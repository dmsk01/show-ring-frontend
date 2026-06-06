'use client';

import type { LabelColor } from 'src/components/label';
import type { IClassifiedItem, ClassifiedStatus } from 'src/types/classified';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { fileUrl } from 'src/actions/file';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

import { formatClassifiedPrice, classifiedStatusI18nKey, classifiedCategoryI18nKey } from './classified-utils';

// ----------------------------------------------------------------------

const STATUS_COLOR: Record<ClassifiedStatus, LabelColor> = {
  active: 'success',
  moderation: 'warning',
  closed: 'default',
  archived: 'default',
};

type Props = {
  row: IClassifiedItem;
  editHref: string;
  onDeleteRow: () => void;
};

export function ClassifiedTableRow({ row, editHref, onDeleteRow }: Props) {
  const { t } = useTranslate(['classified', 'common']);
  const menuActions = usePopover();
  const confirmDialog = useBoolean();

  const priceRaw = formatClassifiedPrice(row.price, row.price_kind);
  const price =
    row.price_kind === 'free' || row.price_kind === 'negotiable' ? t(priceRaw) : priceRaw;

  return (
    <>
      <TableRow hover>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              variant="rounded"
              src={row.images?.find((i) => i.is_primary) ? fileUrl(row.images.find((i) => i.is_primary)!.file_id) : row.images?.[0] ? fileUrl(row.images[0].file_id) : undefined}
              alt={row.title}
              sx={{ width: 48, height: 48 }}
            />
            <Link component={RouterLink} href={editHref} color="inherit" sx={{ fontWeight: 600 }}>
              {row.title}
            </Link>
          </Box>
        </TableCell>

        <TableCell>{t(classifiedCategoryI18nKey(row.category))}</TableCell>
        <TableCell>{price}</TableCell>
        <TableCell>{row.city ?? '—'}</TableCell>
        <TableCell>
          <Label color={STATUS_COLOR[row.status]}>{t(classifiedStatusI18nKey(row.status))}</Label>
        </TableCell>

        <TableCell align="right">
          <IconButton color={menuActions.open ? 'inherit' : 'default'} onClick={menuActions.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover open={menuActions.open} anchorEl={menuActions.anchorEl} onClose={menuActions.onClose}>
        <MenuList>
          <li>
            <MenuItem component={RouterLink} href={editHref} onClick={menuActions.onClose}>
              <Iconify icon="solar:pen-bold" />
              {t('common:actions.edit')}
            </MenuItem>
          </li>
          <MenuItem
            onClick={() => {
              confirmDialog.onTrue();
              menuActions.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            {t('common:actions.delete')}
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirmDialog.value}
        onClose={confirmDialog.onFalse}
        title={t('common:confirm.title')}
        content={
          <>
            {t('common:confirm.content')} <strong>{row.title}</strong>?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              onDeleteRow();
              confirmDialog.onFalse();
            }}
          >
            {t('common:confirm.deleteAction')}
          </Button>
        }
      />
    </>
  );
}
