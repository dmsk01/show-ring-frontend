'use client';

import { useState } from 'react';

import { uploadFile } from 'src/actions/file';
import { uploadErrorMessage } from 'src/actions/file-errors';

import { Upload } from 'src/components/upload';
import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = {
  onChange: (ids: string[]) => void;
};

// Keeps the dropped File objects as the Upload value so the real image preview
// renders (like the single-file Upload), while reporting the uploaded file ids upward.
export function ClassifiedImagesUpload({ onChange }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [ids, setIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleDrop = async (acceptedFiles: File[]) => {
    setUploading(true);
    try {
      const results = await Promise.allSettled(acceptedFiles.map((f) => uploadFile(f)));

      const okFiles: File[] = [];
      const okIds: string[] = [];
      results.forEach((res, i) => {
        if (res.status === 'fulfilled') {
          okFiles.push(acceptedFiles[i]);
          okIds.push(res.value.id);
        }
      });

      const firstRejected = results.find((r) => r.status === 'rejected');
      if (firstRejected) {
        // Show the actual reason (limit/quota/type) rather than a generic notice.
        toast.error(uploadErrorMessage((firstRejected as PromiseRejectedResult).reason));
      }

      const nextFiles = [...files, ...okFiles];
      const nextIds = [...ids, ...okIds];
      setFiles(nextFiles);
      setIds(nextIds);
      onChange(nextIds);
    } catch (error) {
      toast.error(uploadErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (target: File | string) => {
    const index = files.indexOf(target as File);
    if (index < 0) return;
    const nextFiles = files.filter((_, i) => i !== index);
    const nextIds = ids.filter((_, i) => i !== index);
    setFiles(nextFiles);
    setIds(nextIds);
    onChange(nextIds);
  };

  const handleRemoveAll = () => {
    setFiles([]);
    setIds([]);
    onChange([]);
  };

  return (
    <Upload
      multiple
      value={files}
      loading={uploading}
      accept={{ 'image/*': [] }}
      onDrop={handleDrop}
      onRemove={handleRemove}
      onRemoveAll={handleRemoveAll}
    />
  );
}
