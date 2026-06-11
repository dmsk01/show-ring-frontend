'use client';

import type { LabelColor } from 'src/components/label';
import type { IClassifiedItem, ClassifiedStatus, AnimalAvailability } from 'src/types/classified';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
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

import { ANIMAL_AVAILABILITIES } from 'src/types/classified';

import {
  AVAILABILITY_COLOR,
  formatClassifiedPrice,
  classifiedStatusI18nKey,
  classifiedCategoryI18nKey,
  classifiedPriceKindI18nKey,
  classifiedAvailabilityI18nKey,
} from './classified-utils';

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
  onChangeAvailability: (availability: AnimalAvailability) => void;
};

export function ClassifiedTableRow({ row, editHref, onDeleteRow, onChangeAvailability }: Props) {
  const { t } = useTranslate(['classified', 'common']);
  const menuActions = usePopover();
  const confirmDialog = useBoolean();

  // Defensive: legacy rows are migrated to `available`, but keep a cheap fallback.
  const availability = row.availability ?? 'available';

  const price =
    row.price_kind === 'fixed'
      ? formatClassifiedPrice(row.price)
      : t(classifiedPriceKindI18nKey(row.price_kind));

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
          <Label color={AVAILABILITY_COLOR[availability]}>
            {t(classifiedAvailabilityI18nKey(availability))}
          </Label>
        </TableCell>
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
          {/* Quick availability change — PUT with a single field, no need to open the form. */}
          {ANIMAL_AVAILABILITIES.map((value) => (
            <MenuItem
              key={value}
              selected={value === availability}
              onClick={() => {
                menuActions.onClose();
                if (value !== availability) onChangeAvailability(value);
              }}
            >
              <Label color={AVAILABILITY_COLOR[value]} sx={{ mr: 1 }}>
                {t(classifiedAvailabilityI18nKey(value))}
              </Label>
            </MenuItem>
          ))}

          <Divider sx={{ borderStyle: 'dashed' }} />

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
