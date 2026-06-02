import { CONFIG } from 'src/global-config';
import axios, { endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

export type IFileResponse = {
  id: string;
  uploaded_by: string | null;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
};

/** Upload a file to the backend (MinIO-backed). Returns the created file record. */
export async function uploadFile(file: File): Promise<IFileResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await axios.post<IFileResponse>(endpoints.file.upload, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return res.data;
}

/** Public URL for serving a stored file (GET /files/{id} is public). */
export function fileUrl(fileId?: string | null): string {
  return fileId ? `${CONFIG.serverUrl}${endpoints.file.details(fileId)}` : '';
}
