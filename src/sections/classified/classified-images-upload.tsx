'use client';

import type { ImageUploadState } from './image-upload-queue';

import { useRef, useState } from 'react';

import { uploadFile } from 'src/actions/file';
import { uploadErrorMessage } from 'src/actions/file-errors';

import { Upload } from 'src/components/upload';
import { toast } from 'src/components/snackbar';

import { createImageUploadQueue } from './image-upload-queue';

// ----------------------------------------------------------------------

type Props = {
  onChange: (ids: string[]) => void;
  /** Идёт загрузка — форма должна блокировать отправку (FE-32). */
  onUploadingChange?: (uploading: boolean) => void;
};

// Keeps the dropped File objects as the Upload value so the real image preview
// renders (like the single-file Upload), while reporting the uploaded file ids upward.
// Состояние ведёт очередь вне React: параллельные дропы не затирают друг друга.
export function ClassifiedImagesUpload({ onChange, onUploadingChange }: Props) {
  const [state, setState] = useState<ImageUploadState>({ files: [], ids: [], uploading: false });

  // Актуальные колбэки родителя — без пересоздания очереди.
  const handlers = useRef({ onChange, onUploadingChange });
  handlers.current = { onChange, onUploadingChange };

  const queueRef = useRef<ReturnType<typeof createImageUploadQueue> | null>(null);
  if (!queueRef.current) {
    queueRef.current = createImageUploadQueue(uploadFile, (next) => {
      setState(next);
      handlers.current.onChange(next.ids);
      handlers.current.onUploadingChange?.(next.uploading);
    });
  }
  const queue = queueRef.current;

  const handleDrop = async (acceptedFiles: File[]) => {
    const failure = await queue.add(acceptedFiles);
    // Show the actual reason (limit/quota/type) rather than a generic notice.
    if (failure) toast.error(uploadErrorMessage(failure));
  };

  return (
    <Upload
      multiple
      value={state.files}
      loading={state.uploading}
      accept={{ 'image/*': [] }}
      onDrop={handleDrop}
      onRemove={(target) => queue.remove(target as File)}
      onRemoveAll={queue.clear}
    />
  );
}
