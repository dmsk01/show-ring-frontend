'use client';

import type { ReactNode } from 'react';
import type { TableHeadCellProps } from 'src/components/table';
import type { GroupBy, IShowResultRow } from './show-results-utils';

import { Fragment } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { useTable, TableNoData, TableHeadCustom } from 'src/components/table';

import { SHOW_AWARD_FLAGS } from './show-utils';
import { sortRows, groupRows, GROUP_BY_OPTIONS } from './show-results-utils';

// ----------------------------------------------------------------------

type Props = {
  rows: IShowResultRow[];
  loading: boolean;
  groupBy: GroupBy;
  onGroupByChange: (value: GroupBy) => void;
  renderRowActions?: (row: IShowResultRow) => ReactNode;
};

export function ShowResultsTable({
  rows,
  loading,
  groupBy,
  onGroupByChange,
  renderRowActions,
}: Props) {
  const table = useTable({ defaultOrderBy: '' });
  const { order, orderBy, onSort } = table;
  const groups = groupRows(rows, groupBy);

  const head: TableHeadCellProps[] = [
    { id: 'catalog', label: '№', width: 64 },
    { id: 'dog', label: 'Кличка' },
    { id: 'breed', label: 'Порода' },
    { id: 'kennel', label: 'Заводчик' },
    { id: 'class', label: 'Класс', width: 140 },
    { id: 'grade', label: 'Оценка', width: 120 },
    { id: 'placement', label: 'Место', width: 72 },
    { id: 'ring', label: 'Ринг', width: 80 },
    { id: 'titles', label: 'Титулы' },
    { id: 'awards', label: 'Награды' },
    ...(renderRowActions ? [{ id: 'actions', label: '', width: 120 }] : []),
  ];

  const colSpan = head.length;

  return (
    <Card>
      <Box sx={{ p: 2 }}>
        <TextField
          select
          size="small"
          label="Группировка"
          value={groupBy}
          onChange={(e) => onGroupByChange(e.target.value as GroupBy)}
          sx={{ minWidth: 200 }}
        >
          {GROUP_BY_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Scrollbar>
        <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 1180 }}>
          <TableHeadCustom headCells={head} order={order} orderBy={orderBy} onSort={onSort} />
          <TableBody>
            {groups.map((group) => (
              <Fragment key={group.key}>
                <TableRow>
                  <TableCell colSpan={colSpan} sx={{ bgcolor: 'background.neutral' }}>
                    <Typography variant="subtitle2">{group.label}</Typography>
                  </TableCell>
                </TableRow>

                {sortRows(group.rows, orderBy, order).map((row) => (
                  <TableRow key={row.entryId} hover>
                    <TableCell>{row.catalogNumber ?? '—'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{row.dogName}</TableCell>
                    <TableCell>{row.breedName}</TableCell>
                    <TableCell>{row.kennelName}</TableCell>
                    <TableCell>{row.className}</TableCell>
                    <TableCell>{row.gradeName}</TableCell>
                    <TableCell>{row.placement ?? '—'}</TableCell>
                    <TableCell>{row.ringNumber ?? '—'}</TableCell>
                    <TableCell>
                      <Box sx={{ gap: 0.5, display: 'flex', flexWrap: 'wrap' }}>
                        {row.titles.map((t) => (
                          <Label key={t.code} color="info">
                            {t.code}
                          </Label>
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ gap: 0.5, display: 'flex', flexWrap: 'wrap' }}>
                        {row.result
                          ? SHOW_AWARD_FLAGS.filter((f) => row.result![f.key]).map((f) => (
                              <Label key={f.label} color="success">
                                {f.label}
                              </Label>
                            ))
                          : null}
                      </Box>
                    </TableCell>
                    {renderRowActions && (
                      <TableCell align="right">{renderRowActions(row)}</TableCell>
                    )}
                  </TableRow>
                ))}
              </Fragment>
            ))}

            <TableNoData notFound={!loading && rows.length === 0} />
          </TableBody>
        </Table>
      </Scrollbar>
    </Card>
  );
}
