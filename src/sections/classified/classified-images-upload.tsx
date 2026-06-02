'use client';

import { useState } from 'react';

import { fileUrl, uploadFile } from 'src/actions/file';

import { Upload } from 'src/components/upload';
import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = {
  value: string[]; // file ids
  onChange: (ids: string[]) => void;
};

export function ClassifiedImagesUpload({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);

  const previews = value.map((id) => fileUrl(id));

  const handleDrop = async (acceptedFiles: File[]) => {
    setUploading(true);
    try {
      const ids = await Promise.all(acceptedFiles.map((f) => uploadFile(f).then((r) => r.id)));
      onChange([...value, ...ids]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (target: File | string) => {
    const index = previews.indexOf(target as string);
    if (index >= 0) onChange(value.filter((_, i) => i !== index));
  };

  return (
    <Upload
      multiple
      value={previews}
      loading={uploading}
      accept={{ 'image/*': [] }}
      onDrop={handleDrop}
      onRemove={handleRemove}
      onRemoveAll={() => onChange([])}
    />
  );
}
