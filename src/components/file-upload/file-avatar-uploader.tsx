'use client';

import { useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';

import { fileUrl, uploadFile } from 'src/actions/file';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  fileId: string | null;
  alt?: string;
  size?: number;
  onUploaded: (fileId: string) => void;
};

export function FileAvatarUploader({ fileId, alt, size = 96, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await uploadFile(file);
      onUploaded(res.id);
      toast.success('Image uploaded!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Avatar src={fileUrl(fileId)} alt={alt} sx={{ width: size, height: size }} />

      <Button
        variant="outlined"
        color="inherit"
        loading={uploading}
        startIcon={<Iconify icon="solar:camera-add-bold" />}
        onClick={() => inputRef.current?.click()}
      >
        {fileId ? 'Change image' : 'Upload image'}
      </Button>

      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleChange} />
    </Box>
  );
}
