'use client';

import type { IEntryCard } from 'src/types/checkin';

import { useState } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { useGetShow } from 'src/actions/show';
import { DashboardContent } from 'src/layouts/dashboard';
import { addEntryChecks, usePrecheckQueue } from 'src/actions/checkin';

import { toast } from 'src/components/snackbar';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { EntryDocuments } from '../entry-documents';

// ----------------------------------------------------------------------

type Props = { id: string };

export function PrecheckView({ id }: Props) {
  const { t } = useTranslate(['checkin', 'common']);
  const { show } = useGetShow(id);
  const { queue, queueLoading } = usePrecheckQueue(id);
  const [rejecting, setRejecting] = useState<IEntryCard | null>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (card: IEntryCard, passed: boolean) => {
    setBusy(true);
    try {
      await addEntryChecks(id, card.entry_id, [
        passed
          ? { kind: 'docs_precheck', result: 'passed' }
          : { kind: 'docs_precheck', result: 'failed', comment: comment.trim() },
      ]);
      toast.success(t(passed ? 'precheck.approved' : 'precheck.rejected'));
      setRejecting(null);
      setComment('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('precheck.failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={show ? t('precheck.heading', { name: show.name }) : t('precheck.headingFallback')}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: show?.name ?? '', href: paths.dashboard.shows.edit(id) },
          { name: t('precheck.headingFallback') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        {t('precheck.hint')}
      </Typography>

      {!queueLoading && queue.length === 0 ? (
        <EmptyContent filled title={t('precheck.empty')} sx={{ py: 8 }} />
      ) : (
        <Stack spacing={2}>
          {queue.map((card) => (
            <Card key={card.entry_id} sx={{ p: 2.5 }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                justifyContent="space-between"
              >
                <Stack spacing={1} sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1">
                    {card.catalog_number != null ? `№${card.catalog_number} · ` : ''}
                    {card.dog.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {card.class_name} · {card.participant_name}
                  </Typography>
                  <EntryDocuments card={card} />
                </Stack>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <Button
                    variant="contained"
                    color="success"
                    disabled={busy}
                    onClick={() => submit(card, true)}
                  >
                    {t('precheck.approve')}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    disabled={busy}
                    onClick={() => setRejecting(card)}
                  >
                    {t('precheck.reject')}
                  </Button>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog fullWidth maxWidth="xs" open={!!rejecting} onClose={() => setRejecting(null)}>
        <DialogTitle>{t('precheck.rejectTitle')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            label={t('precheck.comment')}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setRejecting(null)}>
            {t('desk.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            loading={busy}
            disabled={!comment.trim()}
            onClick={() => rejecting && submit(rejecting, false)}
          >
            {t('precheck.reject')}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
