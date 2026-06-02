'use client';

import type { ReferenceTypeConfig } from './reference-config';
import type { TableHeadCellProps } from 'src/components/table';
import type { ReferenceRecord } from 'src/actions/admin-reference';

import { useState } from 'react';
import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { deleteReference, useReferenceList } from 'src/actions/admin-reference';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';
import { TableNoData, TableHeadCustom } from 'src/components/table';

import { ReferenceFormDialog } from './reference-form-dialog';

// ----------------------------------------------------------------------

function renderValue(field: ReferenceTypeConfig['fields'][number], value: unknown) {
  if (field?.kind === 'switch') {
    return <Label color={value ? 'success' : 'default'}>{value ? 'Yes' : 'No'}</Label>;
  }
  return value == null || value === '' ? '—' : String(value);
}

type RowProps = {
  config: ReferenceTypeConfig;
  row: ReferenceRecord;
  onEdit: () => void;
  onDelete: () => void;
};

function ReferenceRow({ config, row, onEdit, onDelete }: RowProps) {
  const menu = usePopover();
  const confirm = useBoolean();

  return (
    <>
      <TableRow hover>
        {config.columns.map((col) => {
          const field = config.fields.find((f) => f.name === col);
          return <TableCell key={col}>{renderValue(field!, row[col])}</TableCell>;
        })}
        <TableCell align="right">
          <IconButton color={menu.open ? 'inherit' : 'default'} onClick={menu.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover open={menu.open} anchorEl={menu.anchorEl} onClose={menu.onClose}>
        <MenuList>
          <MenuItem
            onClick={() => {
              onEdit();
              menu.onClose();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            Edit
          </MenuItem>
          <MenuItem
            onClick={() => {
              confirm.onTrue();
              menu.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={
          <>
            Delete <strong>{row.name}</strong>?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              onDelete();
              confirm.onFalse();
            }}
          >
            Delete
          </Button>
        }
      />
    </>
  );
}

// ----------------------------------------------------------------------

type Props = { config: ReferenceTypeConfig };

export function ReferenceCrud({ config }: Props) {
  const { items, loading } = useReferenceList(config.listUrl);

  const formOpen = useBoolean();
  const [editing, setEditing] = useState<ReferenceRecord | undefined>(undefined);

  const head: TableHeadCellProps[] = [
    ...config.columns.map((col) => ({
      id: col,
      label: config.fields.find((f) => f.name === col)?.label ?? col,
    })),
    { id: '', width: 64 },
  ];

  const handleCreate = () => {
    setEditing(undefined);
    formOpen.onTrue();
  };

  const handleEdit = (row: ReferenceRecord) => {
    setEditing(row);
    formOpen.onTrue();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReference(config.adminUrl, config.listUrl, id);
      toast.success('Delete success!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  return (
    <Card>
      <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleCreate}
        >
          Add
        </Button>
      </Box>

      <Scrollbar>
        <Table size="medium" sx={{ minWidth: 640 }}>
          <TableHeadCustom headCells={head} rowCount={items.length} />
          <TableBody>
            {items.map((row) => (
              <ReferenceRow
                key={row.id}
                config={config}
                row={row}
                onEdit={() => handleEdit(row)}
                onDelete={() => handleDelete(row.id)}
              />
            ))}
            <TableNoData notFound={!loading && items.length === 0} />
          </TableBody>
        </Table>
      </Scrollbar>

      {formOpen.value && (
        <ReferenceFormDialog
          config={config}
          currentItem={editing}
          open={formOpen.value}
          onClose={formOpen.onFalse}
        />
      )}
    </Card>
  );
}
