'use client';

import type { IEntryCard, IEntryCheckCreate } from 'src/types/checkin';

import { useState } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { fDateTime } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import { fileUrl } from 'src/actions/file';
import { addEntryChecks, useEntryChecks } from 'src/actions/checkin';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';

import { EntryDocuments } from './entry-documents';
import { admitChecks, rejectChecks, ATTENDANCE_COLOR, arrivalOnlyChecks } from './checkin-utils';

// ----------------------------------------------------------------------

type Props = {
  showId: string;
  card: IEntryCard;
  /** Отметки разрешены (выставка в окне стойки). */
  canMark: boolean;
  onChanged: (card: IEntryCard) => void;
};

export function EntryCheckCard({ showId, card, canMark, onChanged }: Props) {
  const { t } = useTranslate('checkin');
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState<'vet' | 'docs_onsite'>('vet');
  const [comment, setComment] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const { checks } = useEntryChecks(showId, historyOpen ? card.entry_id : null);

  const submit = async (payload: IEntryCheckCreate[]) => {
    setBusy(true);
    try {
      const updated = await addEntryChecks(showId, card.entry_id, payload);
      onChanged(updated);
      toast.success(t('desk.saved'));
      setRejectOpen(false);
      setComment('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('desk.errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Avatar
          variant="rounded"
          src={card.dog.avatar_file_id ? fileUrl(card.dog.avatar_file_id) : undefined}
          sx={{ width: 64, height: 64 }}
        >
          {card.dog.name.charAt(0)}
        </Avatar>
        <Stack spacing={0.5} sx={{ flexGrow: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Typography variant="h6" noWrap>
              {card.catalog_number != null ? `№${card.catalog_number} · ` : ''}
              {card.dog.name}
            </Typography>
            <Label color={ATTENDANCE_COLOR[card.attendance_status]}>
              {t(`attendance.${card.attendance_status}`)}
            </Label>
          </Stack>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {card.class_name} · {card.participant_name}
          </Typography>
          <Typography variant="body2">
            {t('desk.chip')}: <strong>{card.dog.microchip || '—'}</strong>
            {' · '}
            {t('desk.tattoo')}: <strong>{card.dog.tattoo || '—'}</strong>
          </Typography>
        </Stack>
      </Stack>

      <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
      <EntryDocuments card={card} />

      {canMark && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
          <Button
            variant="contained"
            color="success"
            size="large"
            disabled={busy}
            onClick={() => submit(admitChecks())}
          >
            {t('desk.admit')}
          </Button>
          <Button
            variant="outlined"
            color="error"
            disabled={busy}
            onClick={() => setRejectOpen(true)}
          >
            {t('desk.reject')}
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            disabled={busy}
            onClick={() => submit(arrivalOnlyChecks())}
          >
            {t('desk.arrivalOnly')}
          </Button>
          <Button color="inherit" onClick={() => setHistoryOpen(true)}>
            {t('desk.history')}
          </Button>
        </Stack>
      )}

      <Dialog fullWidth maxWidth="xs" open={rejectOpen} onClose={() => setRejectOpen(false)}>
        <DialogTitle>{t('desk.rejectTitle')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label={t('desk.reason')}
              value={reason}
              onChange={(e) => setReason(e.target.value as 'vet' | 'docs_onsite')}
            >
              <MenuItem value="vet">{t('desk.reasons.vet')}</MenuItem>
              <MenuItem value="docs_onsite">{t('desk.reasons.docs_onsite')}</MenuItem>
            </TextField>
            <TextField
              autoFocus
              multiline
              minRows={2}
              label={t('desk.comment')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setRejectOpen(false)}>
            {t('desk.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            loading={busy}
            disabled={!comment.trim()}
            onClick={() => submit(rejectChecks(reason, comment.trim()))}
          >
            {t('desk.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog fullWidth maxWidth="sm" open={historyOpen} onClose={() => setHistoryOpen(false)}>
        <DialogTitle>{t('desk.historyTitle')}</DialogTitle>
        <DialogContent>
          {checks.length === 0 ? (
            <Typography sx={{ color: 'text.secondary', py: 2 }}>
              {t('desk.historyEmpty')}
            </Typography>
          ) : (
            <Stack divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
              {checks.map((c) => (
                <Stack key={c.id} spacing={0.5} sx={{ py: 1.5 }}>
                  <Typography variant="subtitle2">
                    {t(`checkKinds.${c.kind}`)}:{' '}
                    <Typography
                      component="span"
                      variant="subtitle2"
                      sx={{ color: c.result === 'passed' ? 'success.main' : 'error.main' }}
                    >
                      {t(`checkResults.${c.result}`)}
                    </Typography>
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {fDateTime(c.created_at)}
                    {c.performed_by_name ? ` · ${c.performed_by_name}` : ''}
                  </Typography>
                  {c.comment && <Typography variant="body2">{c.comment}</Typography>}
                </Stack>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setHistoryOpen(false)}>
            {t('ticket.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
