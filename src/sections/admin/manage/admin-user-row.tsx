'use client';

import type { Role } from 'src/types/permissions';
import type { IAdminUser } from 'src/types/admin';

import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { setUserRole, setUserBlock } from 'src/actions/admin';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

import { ADMIN_ROLES } from 'src/types/admin';

// ----------------------------------------------------------------------

type Props = { row: IAdminUser };

export function AdminUserRow({ row }: Props) {
  const grantMenu = usePopover();

  const heldRoles = row.roles;

  const handleBlock = async (isActive: boolean) => {
    try {
      await setUserBlock(row.id, isActive);
      toast.success(isActive ? 'User unblocked' : 'User blocked');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update user');
    }
  };

  const handleRole = async (role: Role, grant: boolean) => {
    try {
      await setUserRole(row.id, role, grant);
      toast.success(grant ? 'Role granted' : 'Role revoked');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
    }
  };

  return (
    <>
      <TableRow hover>
        <TableCell sx={{ fontWeight: 600 }}>{row.email}</TableCell>

        <TableCell>
          <Label color={row.is_email_verified ? 'success' : 'warning'}>
            {row.is_email_verified ? 'Verified' : 'Unverified'}
          </Label>
        </TableCell>

        <TableCell>
          <Box sx={{ gap: 0.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
            {heldRoles.length ? (
              heldRoles.map((role) => (
                <Chip
                  key={role}
                  size="small"
                  label={role}
                  onDelete={() => handleRole(role, false)}
                />
              ))
            ) : (
              <Box component="span" sx={{ color: 'text.disabled' }}>
                —
              </Box>
            )}
            <IconButton size="small" onClick={grantMenu.onOpen}>
              <Iconify icon="mingcute:add-line" width={16} />
            </IconButton>
          </Box>
        </TableCell>

        <TableCell align="right">
          <Switch checked={row.is_active} onChange={(_, checked) => handleBlock(checked)} />
        </TableCell>
      </TableRow>

      <CustomPopover open={grantMenu.open} anchorEl={grantMenu.anchorEl} onClose={grantMenu.onClose}>
        <MenuList>
          {ADMIN_ROLES.filter((r) => !heldRoles.includes(r)).map((role) => (
            <MenuItem
              key={role}
              onClick={() => {
                handleRole(role, true);
                grantMenu.onClose();
              }}
            >
              <Iconify icon="mingcute:add-line" />
              {role}
            </MenuItem>
          ))}
        </MenuList>
      </CustomPopover>
    </>
  );
}
