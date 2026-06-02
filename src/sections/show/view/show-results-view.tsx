'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { IShowEntry, IShowResult } from 'src/types/show-result';

import { useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';

import { paths } from 'src/routes/paths';

import { usePermissions } from 'src/hooks/use-permissions';

import { useGetDogs } from 'src/actions/dog';
import { useGetShow } from 'src/actions/show';
import { DashboardContent } from 'src/layouts/dashboard';
import { useReferenceList } from 'src/actions/admin-reference';
import { useGetShowResults, useGetShowEntries } from 'src/actions/show-result';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TableNoData, TableHeadCustom } from 'src/components/table';

import { ShowResultDialog } from '../show-result-dialog';

// ----------------------------------------------------------------------

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'catalog', label: 'Cat #', width: 80 },
  { id: 'dog', label: 'Dog' },
  { id: 'class', label: 'Class', width: 160 },
  { id: 'grade', label: 'Grade', width: 140 },
  { id: 'placement', label: 'Place', width: 80 },
  { id: 'best', label: 'Awards' },
  { id: '', width: 88 },
];

const BEST_FLAGS: { key: keyof IShowResult; label: string }[] = [
  { key: 'is_class_winner', label: 'CW' },
  { key: 'is_best_male', label: 'BM' },
  { key: 'is_best_female', label: 'BF' },
  { key: 'is_best_of_breed', label: 'BOB' },
  { key: 'is_best_in_group', label: 'BIG' },
  { key: 'is_best_in_show', label: 'BIS' },
];

type Props = { id: string };

export function ShowResultsView({ id }: Props) {
  const table = useTable();
  const { can } = usePermissions();
  const canEdit = can('results:create') || can('results:edit');

  const { show } = useGetShow(id);
  const { entries, entriesLoading } = useGetShowEntries(id);
  const { results } = useGetShowResults(id);
  const { dogs } = useGetDogs({ per_page: 200 });
  const { items: grades } = useReferenceList('/references/grades');
  const { items: classes } = useReferenceList('/references/show-classes');

  const dialog = useBoolean();
  const [editingEntry, setEditingEntry] = useState<IShowEntry | undefined>(undefined);

  const resultByEntry = new Map(results.map((r) => [r.show_entry_id, r]));
  const dogName = (dogId: string) => dogs.find((d) => d.id === dogId)?.name ?? '—';
  const className = (classId: string) => classes.find((c) => c.id === classId)?.name ?? '—';
  const gradeName = (gradeId: string | null) =>
    gradeId ? (grades.find((g) => g.id === gradeId)?.name ?? '—') : '—';

  const handleEdit = (entry: IShowEntry) => {
    setEditingEntry(entry);
    dialog.onTrue();
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={show ? `Results — ${show.name}` : 'Results'}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Shows', href: paths.dashboard.shows.root },
          { name: 'Results' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Scrollbar>
          <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
            <TableHeadCustom headCells={TABLE_HEAD} rowCount={entries.length} />
            <TableBody>
              {entries.map((entry) => {
                const result = resultByEntry.get(entry.id);
                return (
                  <TableRow key={entry.id} hover>
                    <TableCell>{entry.catalog_number ?? '—'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{dogName(entry.dog_id)}</TableCell>
                    <TableCell>{className(entry.show_class_id)}</TableCell>
                    <TableCell>{gradeName(result?.grade_id ?? null)}</TableCell>
                    <TableCell>{result?.placement ?? '—'}</TableCell>
                    <TableCell>
                      <Box sx={{ gap: 0.5, display: 'flex', flexWrap: 'wrap' }}>
                        {result
                          ? BEST_FLAGS.filter((f) => result[f.key]).map((f) => (
                              <Label key={f.label} color="success">
                                {f.label}
                              </Label>
                            ))
                          : null}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {canEdit && (
                        <Button
                          size="small"
                          color="inherit"
                          startIcon={<Iconify icon="solar:pen-bold" />}
                          onClick={() => handleEdit(entry)}
                        >
                          {result ? 'Edit' : 'Set'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

              <TableNoData notFound={!entriesLoading && entries.length === 0} />
            </TableBody>
          </Table>
        </Scrollbar>
      </Card>

      {dialog.value && editingEntry && (
        <ShowResultDialog
          showId={id}
          entry={editingEntry}
          result={resultByEntry.get(editingEntry.id)}
          gradeOptions={grades}
          open={dialog.value}
          onClose={dialog.onFalse}
        />
      )}
    </DashboardContent>
  );
}
