import type { Editor } from '@tiptap/react';
import type { EditorToolbarItemProps } from '../types';

import { useState, useCallback } from 'react';
import { usePopover } from 'minimal-shared/hooks';

import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { apiErrorMessageKey } from 'src/utils/api-error';

import { useTranslate } from 'src/locales';
import { uploadFile } from 'src/actions/file';
import { UploadError, uploadErrorMessage } from 'src/actions/file-errors';

import { toast } from 'src/components/snackbar';

import { editorClasses } from '../classes';
import { ToolbarItem } from './toolbar-item';
import { uploadEditorImage } from '../upload-editor-image';

// ----------------------------------------------------------------------

type ImageBlockProps = Pick<EditorToolbarItemProps, 'icon'> & {
  editor: Editor;
};

export function ImageBlock({ editor, icon }: ImageBlockProps) {
  const { t } = useTranslate('common');
  const { anchorEl, open, onOpen, onClose } = usePopover();
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [uploading, setUploading] = useState(false);

  // Картинка загружается в /files и вставляется по адресу своего сайта:
  // внешние URL блокирует CSP img-src 'self' (ревью 2026-10-09, FE-25).
  const handleApply = useCallback(async () => {
    if (!file) return;
    setUploading(true);
    try {
      const src = await uploadEditorImage(file, uploadFile);
      editor.chain().focus().setImage({ src, alt: altText }).run();
      onClose();
      setFile(null);
      setAltText('');
    } catch (error) {
      toast.error(
        error instanceof UploadError
          ? uploadErrorMessage(error)
          : t(apiErrorMessageKey(error, {}, 'state.error'))
      );
    } finally {
      setUploading(false);
    }
  }, [altText, editor, file, onClose, t]);

  const popoverId = open ? 'image-popover' : undefined;

  return (
    <>
      <ToolbarItem
        aria-describedby={popoverId}
        aria-label={t('editor.addImage')}
        className={editorClasses.toolbar.image}
        onClick={onOpen}
        icon={icon}
      />

      <Popover
        id={popoverId}
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              p: 2.5,
              gap: 1.25,
              width: 1,
              maxWidth: 320,
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        <Typography variant="subtitle2">{t('editor.addImage')}</Typography>

        <Button component="label" variant="outlined" color="inherit" size="small">
          {file ? file.name : t('editor.chooseImage')}
          <input
            hidden
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </Button>

        <TextField
          fullWidth
          size="small"
          placeholder={t('editor.altText')}
          value={altText}
          onChange={(event) => setAltText(event.target.value)}
        />

        <Button
          variant="contained"
          disabled={!file}
          loading={uploading}
          onClick={handleApply}
          sx={{ alignSelf: 'flex-end' }}
        >
          {t('editor.insert')}
        </Button>
      </Popover>
    </>
  );
}
