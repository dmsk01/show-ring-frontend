'use client';

import type { IShowEntry } from 'src/types/show-result';
import type { GroupBy, IShowResultRow } from '../show-results-utils';

import { useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';

import { usePermissions } from 'src/hooks/use-permissions';

import { useTranslate } from 'src/locales';
import { useGetShow } from 'src/actions/show';
import { DashboardContent } from 'src/layouts/dashboard';
import { useReferenceList } from 'src/actions/admin-reference';
import { useShowResultRows, useGetShowEntries } from 'src/actions/show-result';
import { pollTask, downloadTask, generateEntryDocument } from 'src/actions/document';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

import { canEnterResults } from '../show-utils';
import { ShowResultDialog } from '../show-result-dialog';
import { ShowResultsTable } from '../show-results-table';
import { ShowDocumentsPanel } from '../show-documents-panel';

// ----------------------------------------------------------------------

type Props = { id: string };

export function ShowResultsView({ id }: Props) {
  const { t } = useTranslate(['show', 'common']);
  const { can } = usePermissions();
  const { user } = useAuthContext();
  const canGenerate = can('documents:create');

  const { show } = useGetShow(id);
  // Внесение/правка результатов — по владению выставкой (organizer_id) или admin,
  // как на бэкенде. Судья и не-владельцы видят результаты read-only.
  const canEdit = canEnterResults(show, user?.id, can);
  const { entries } = useGetShowEntries(id);
  const { rows, loading } = useShowResultRows(id);
  const { items: grades } = useReferenceList('/references/grades');

  const [groupBy, setGroupBy] = useState<GroupBy>('class');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const dialog = useBoolean();
  const [editingEntry, setEditingEntry] = useState<IShowEntry | undefined>(undefined);

  const entryById = new Map(entries.map((e) => [e.id, e]));

  const handleEdit = (entryId: string) => {
    const entry = entryById.get(entryId);
    if (!entry) return;
    setEditingEntry(entry);
    dialog.onTrue();
  };

  const handleDownloadDiploma = async (row: IShowResultRow) => {
    setDownloadingId(row.entryId);
    try {
      const task = await generateEntryDocument(id, row.entryId, 'diploma');
      const status = await pollTask(task.id);
      if (status !== 'done') throw new Error(t('toast.documentNotReady'));
      await downloadTask(task.id, `diploma-${row.entryId}.docx`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common:state.error'));
    } finally {
      setDownloadingId(null);
    }
  };

  const renderRowActions = (row: IShowResultRow) => {
    const isOwner = !!user && row.registeredBy === user.id;
    return (
      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
        {canEdit && (
          <Button
            size="small"
            color="inherit"
            startIcon={<Iconify icon="solar:pen-bold" />}
            onClick={() => handleEdit(row.entryId)}
          >
            {row.result ? t('results.actions.edit') : t('results.actions.grade')}
          </Button>
        )}
        {(canGenerate || isOwner) && (
          <Button
            size="small"
            color="inherit"
            loading={downloadingId === row.entryId}
            startIcon={<Iconify icon="solar:download-bold" />}
            onClick={() => handleDownloadDiploma(row)}
          >
            {t('results.actions.diploma')}
          </Button>
        )}
      </Stack>
    );
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={show ? t('results.heading', { name: show.name }) : t('results.headingFallback')}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('list.title'), href: paths.dashboard.shows.root },
          { name: t('results.headingFallback') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        <ShowDocumentsPanel showId={id} />

        <ShowResultsTable
          rows={rows}
          loading={loading}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          renderRowActions={renderRowActions}
        />
      </Stack>

      {dialog.value && editingEntry && (
        <ShowResultDialog
          showId={id}
          entry={editingEntry}
          result={rows.find((r) => r.entryId === editingEntry.id)?.result}
          gradeOptions={grades}
          open={dialog.value}
          onClose={dialog.onFalse}
        />
      )}
    </DashboardContent>
  );
}
