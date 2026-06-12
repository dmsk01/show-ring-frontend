'use client';

import type { IShowEntry } from 'src/types/show-entry';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import { useGetShow } from 'src/actions/show';
import { DashboardContent } from 'src/layouts/dashboard';
import { deleteShowEntry, useMyShowEntries } from 'src/actions/show-entry';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SHOW_STATUS_COLOR, showStatusI18nKey } from 'src/sections/show/show-utils';

import { isEntryEditable } from '../my-show-utils';
import { MyShowEntryEditDialog } from '../my-show-entry-edit-dialog';

// ----------------------------------------------------------------------

type Props = { id: string };

export function MyShowDetailView({ id }: Props) {
  const { t } = useTranslate('show');
  const { show, showLoading } = useGetShow(id);
  const { entries, entriesLoading, entriesError } = useMyShowEntries(id);

  const [editing, setEditing] = useState<IShowEntry | null>(null);
  const [deleting, setDeleting] = useState<IShowEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (showLoading || entriesLoading) return <LoadingScreen />;
  if (!show) {
    return (
      <DashboardContent>
        <Typography sx={{ py: 10 }}>{t('detail.notFound')}</Typography>
      </DashboardContent>
    );
  }

  const editable = isEntryEditable(show.status, show.registration_deadline);
  const dates = show.date_end
    ? `${fDate(show.date_start)} – ${fDate(show.date_end)}`
    : fDate(show.date_start);
  const location = [show.city, show.country].filter(Boolean).join(', ') || '—';

  const onConfirmDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await deleteShowEntry(show.id, deleting.id);
      toast.success(t('myShows.toast.deleted'));
      setDeleting(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('myShows.toast.failed'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={show.name}
        links={[
          { name: t('myShows.title'), href: paths.dashboard.myShows.root },
          { name: show.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', typography: 'body2' }}>
              <Iconify icon="solar:calendar-date-bold" sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {dates}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', typography: 'body2' }}>
              <Iconify icon="mingcute:location-fill" sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {location}
              </Typography>
            </Box>
          </Stack>
          <Label color={SHOW_STATUS_COLOR[show.status] ?? 'default'}>
            {t(showStatusI18nKey(show.status))}
          </Label>
        </Stack>

        {editable && (
          <Button
            component={RouterLink}
            href={paths.showcase.showRegister(show.id)}
            variant="outlined"
            startIcon={<Iconify icon="mingcute:add-line" />}
            sx={{ mt: 3 }}
          >
            {t('myShows.detail.addDog')}
          </Button>
        )}
      </Card>

      {!editable && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          {t('myShows.detail.locked')}
        </Typography>
      )}

      {entriesError ? (
        <EmptyContent filled title={t('myShows.detail.error')} sx={{ py: 8 }} />
      ) : entries.length === 0 ? (
        <EmptyContent filled title={t('myShows.detail.empty')} sx={{ py: 8 }} />
      ) : (
        <Card>
          <Stack divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
            {entries.map((entry) => (
              <Stack
                key={entry.id}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ p: 2.5 }}
              >
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2">
                    {entry.dog_name}
                    {entry.catalog_number != null ? ` — №${entry.catalog_number}` : ''}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {entry.class_name}
                    {entry.notes ? ` · ${entry.notes}` : ''}
                  </Typography>
                </Stack>
                {editable && (
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      aria-label={t('myShows.editDialog.title')}
                      onClick={() => setEditing(entry)}
                    >
                      <Iconify icon="solar:pen-bold" />
                    </IconButton>
                    <IconButton
                      color="error"
                      aria-label={t('myShows.delete.title')}
                      onClick={() => setDeleting(entry)}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Stack>
                )}
              </Stack>
            ))}
          </Stack>
        </Card>
      )}

      {editing && (
        <MyShowEntryEditDialog
          open={!!editing}
          onClose={() => setEditing(null)}
          show={show}
          entry={editing}
          entries={entries}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={t('myShows.delete.title')}
        content={t('myShows.delete.message')}
        action={
          <Button variant="contained" color="error" loading={isDeleting} onClick={onConfirmDelete}>
            {t('myShows.delete.confirm')}
          </Button>
        }
      />
    </DashboardContent>
  );
}
