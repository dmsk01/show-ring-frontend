import { compressImageFile, getUploadRejection } from 'src/utils/upload-image';

import { CONFIG } from 'src/global-config';
import axios, { endpoints } from 'src/lib/axios';

import { UploadError, parseUploadError } from './file-errors';

// ----------------------------------------------------------------------

export type IFileResponse = {
  id: string;
  uploaded_by: string | null;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
};

const MAX_503_RETRIES = 2;
const DEFAULT_503_DELAY_MS = 5000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Upload a file to the backend (MinIO-backed). Returns the created file record.
 *
 * Hardening (mirrors backend limits, keeps oversized bytes off the wire):
 * - rejects disallowed types / files > 10 MB client-side (throws UploadError);
 * - downscales + re-encodes large photos toward ~2 MB before sending;
 * - on 503 (storage backpressure) retries per Retry-After, up to MAX_503_RETRIES;
 * - normalizes any failure to a typed UploadError (see file-errors.ts).
 */
export async function uploadFile(file: File): Promise<IFileResponse> {
  const rejection = getUploadRejection(file);
  if (rejection) throw new UploadError(rejection);

  const payload = await compressImageFile(file);

  const formData = new FormData();
  formData.append('file', payload);

  for (let attempt = 0; ; attempt += 1) {
    try {
      const res = await axios.post<IFileResponse>(endpoints.file.upload, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (error) {
      const uploadError = parseUploadError(error);
      if (uploadError.code === 'storage_busy' && attempt < MAX_503_RETRIES) {
        await sleep((uploadError.retryAfterSeconds ?? DEFAULT_503_DELAY_MS / 1000) * 1000);
        continue;
      }
      throw uploadError;
    }
  }
}

/** Public URL for serving a stored file (GET /files/{id} is public). */
export function fileUrl(fileId?: string | null): string {
  return fileId ? `${CONFIG.serverUrl}${endpoints.file.details(fileId)}` : '';
}
