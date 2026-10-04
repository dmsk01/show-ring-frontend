'use client';

import type { IDogDocument, DogDocumentKind } from 'src/types/checkin';

import { useRef, useState } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import {
  dogDocumentUrl,
  useDogDocuments,
  deleteDogDocument,
  uploadDogDocument,
} from 'src/actions/checkin';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { DOG_DOCUMENT_KINDS } from 'src/types/checkin';

// ----------------------------------------------------------------------

type Props = { dogId: string };

/**
 * Документы собаки для допуска на выставки (ветпаспорт, родословная…).
 * Сканы приватные: открываются через ACL-эндпоинт бэкенда.
 */
export function DogDocuments({ dogId }: Props) {
  const { t } = useTranslate('checkin');
  const { documents, documentsLoading } = useDogDocuments(dogId);

  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<DogDocumentKind>('vet_passport');
  const [validUntil, setValidUntil] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<IDogDocument | null>(null);

  const onUpload = async () => {
    if (!file) {
      toast.error(t('documents.needFile'));
      return;
    }
    if (kind === 'vet_passport' && !validUntil) {
      toast.error(t('documents.needValidUntil'));
      return;
    }
    setUploading(true);
    try {
      await uploadDogDocument(dogId, file, kind, kind === 'vet_passport' ? validUntil : null);
      toast.success(t('documents.uploaded'));
      setFile(null);
      setValidUntil('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('documents.failed'));
    } finally {
      setUploading(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteDogDocument(dogId, deleting.id);
      toast.success(t('documents.deleted'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('documents.failed'));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Stack spacing={3}>
      <Card sx={{ p: 3 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          {t('documents.hint')}
        </Typography>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <TextField
            select
            size="small"
            label={t('documents.kind')}
            value={kind}
            onChange={(e) => setKind(e.target.value as DogDocumentKind)}
            sx={{ minWidth: 240 }}
          >
            {DOG_DOCUMENT_KINDS.map((k) => (
              <MenuItem key={k} value={k}>
                {t(`kinds.${k}`)}
              </MenuItem>
            ))}
          </TextField>

          {kind === 'vet_passport' && (
            <TextField
              size="small"
              type="date"
              label={t('documents.validUntil')}
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 260 }}
            />
          )}

          <Button
            component="label"
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="eva:cloud-upload-fill" />}
            sx={{
              maxWidth: 320,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {file ? file.name : t('documents.chooseFile')}
            <input
              ref={fileRef}
              hidden
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Button>

          <Button variant="contained" loading={uploading} onClick={onUpload}>
            {t('documents.upload')}
          </Button>
        </Stack>
      </Card>

      {!documentsLoading && documents.length === 0 ? (
        <EmptyContent filled title={t('documents.empty')} sx={{ py: 6 }} />
      ) : (
        <Card>
          <Stack divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
            {documents.map((doc) => (
              <Stack
                key={doc.id}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
                sx={{ p: 2.5 }}
              >
                <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2">{t(`kinds.${doc.kind}`)}</Typography>
                    {doc.is_current && <Label color="success">{t('documents.current')}</Label>}
                  </Stack>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                    {doc.original_filename} ·{' '}
                    {t('documents.uploadedAt', { date: fDate(doc.created_at) })}
                    {doc.valid_until
                      ? ` · ${t('documents.validUntilShort', { date: fDate(doc.valid_until) })}`
                      : ''}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    color="inherit"
                    href={dogDocumentUrl(dogId, doc.id)}
                    target="_blank"
                    rel="noopener"
                  >
                    {t('documents.open')}
                  </Button>
                  <IconButton
                    color="error"
                    aria-label={t('documents.delete')}
                    onClick={() => setDeleting(doc)}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Card>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={t('documents.deleteTitle')}
        content={t('documents.deleteMessage')}
        action={
          <Button variant="contained" color="error" onClick={onConfirmDelete}>
            {t('documents.delete')}
          </Button>
        }
      />
    </Stack>
  );
}
