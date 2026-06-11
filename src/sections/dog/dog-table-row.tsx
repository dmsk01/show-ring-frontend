'use client';

import type { IDogItem } from 'src/types/dog';

import { usePopover } from 'minimal-shared/hooks';

import Link from '@mui/material/Link';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: IDogItem;
  breedName?: string;
  detailsHref: string;
  editHref: string;
  canEdit: boolean;
};

export function DogTableRow({ row, breedName, detailsHref, editHref, canEdit }: Props) {
  const { t } = useTranslate(['dog', 'common']);
  const menuActions = usePopover();

  return (
    <>
      <TableRow hover>
        <TableCell>
          <Link component={RouterLink} href={detailsHref} color="inherit" sx={{ fontWeight: 600 }}>
            {row.name}
          </Link>
        </TableCell>

        <TableCell sx={{ color: breedName ? 'text.primary' : 'text.disabled' }}>
          {breedName ?? '—'}
        </TableCell>

        <TableCell>
          <Label color={row.sex === 'male' ? 'info' : 'secondary'}>
            {row.sex === 'female' ? t('enums.sex.female') : t('enums.sex.male')}
          </Label>
        </TableCell>

        <TableCell>{row.rkf_number ?? '—'}</TableCell>
        <TableCell>{row.date_of_birth ?? '—'}</TableCell>
        <TableCell>{row.color ?? '—'}</TableCell>

        <TableCell align="right">
          <IconButton color={menuActions.open ? 'inherit' : 'default'} onClick={menuActions.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={menuActions.open}
        anchorEl={menuActions.anchorEl}
        onClose={menuActions.onClose}
      >
        <MenuList>
          <li>
            <MenuItem component={RouterLink} href={detailsHref} onClick={menuActions.onClose}>
              <Iconify icon="solar:eye-bold" />
              {t('common:actions.view')}
            </MenuItem>
          </li>
          {canEdit && (
            <li>
              <MenuItem component={RouterLink} href={editHref} onClick={menuActions.onClose}>
                <Iconify icon="solar:pen-bold" />
                {t('common:actions.edit')}
              </MenuItem>
            </li>
          )}
        </MenuList>
      </CustomPopover>
    </>
  );
}
