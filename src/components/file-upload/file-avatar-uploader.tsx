'use client';

import { useState } from 'react';

import { useTranslate } from 'src/locales';
import { fileUrl, uploadFile } from 'src/actions/file';
import { uploadErrorMessage } from 'src/actions/file-errors';

import { toast } from 'src/components/snackbar';
import { UploadAvatar } from 'src/components/upload';

// ----------------------------------------------------------------------

type Props = {
  fileId: string | null;
  size?: number;
  onUploaded: (fileId: string) => void;
};

export function FileAvatarUploader({ fileId, size = 96, onUploaded }: Props) {
  const { t } = useTranslate('common');
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLocalFile(file);
    setUploading(true);
    try {
      const res = await uploadFile(file);
      onUploaded(res.id);
      toast.success(t('upload.success'));
    } catch (error) {
      toast.error(uploadErrorMessage(error));
      setLocalFile(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <UploadAvatar
      value={localFile ?? (fileId ? fileUrl(fileId) : null)}
      loading={uploading}
      onDrop={handleDrop}
      sx={{ width: size, height: size }}
    />
  );
}
