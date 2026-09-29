import type { Theme, Components } from '@mui/material/styles';

import { varAlpha } from 'minimal-shared/utils';

import { checkboxClasses } from '@mui/material/Checkbox';
import { tableRowClasses } from '@mui/material/TableRow';
import { tableCellClasses } from '@mui/material/TableCell';
import { tableSortLabelClasses } from '@mui/material/TableSortLabel';

// ----------------------------------------------------------------------

const MuiTableContainer: Components<Theme>['MuiTableContainer'] = {
  // ▼▼▼▼▼▼▼▼ 🎨 STYLE ▼▼▼▼▼▼▼▼
  styleOverrides: {
    root: ({ theme }) => ({
      ...theme.mixins.scrollbarStyles(theme),
      position: 'relative',
    }),
  },
};

const MuiTableRow: Components<Theme>['MuiTableRow'] = {
  // ▼▼▼▼▼▼▼▼ 🎨 STYLE ▼▼▼▼▼▼▼▼
  styleOverrides: {
    root: ({ theme }) => ({
      [`&.${tableRowClasses.selected}`]: {
        backgroundColor: varAlpha(theme.vars.palette.primary.darkChannel, 0.04),
        '&:hover': {
          backgroundColor: varAlpha(theme.vars.palette.primary.darkChannel, 0.08),
        },
      },
      '&:last-of-type': {
        [`& .${tableCellClasses.root}`]: {
          border: 0,
        },
      },
    }),
  },
};

const MuiTableCell: Components<Theme>['MuiTableCell'] = {
  // ▼▼▼▼▼▼▼▼ 🎨 STYLE ▼▼▼▼▼▼▼▼
  styleOverrides: {
    root: {
      borderBottomStyle: 'dashed',
    },
    head: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(11),
      fontWeight: 800,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: theme.vars.palette.background.paper,
      backgroundColor: theme.vars.palette.text.primary,
      // Inverted head: MUI paints active sort label / unchecked checkbox with text colors
      [`& .${tableSortLabelClasses.root}, & .${tableSortLabelClasses.root}:hover, & .${tableSortLabelClasses.active}`]:
        {
          color: 'inherit',
          [`& .${tableSortLabelClasses.icon}`]: { color: 'inherit' },
        },
      [`& .${checkboxClasses.root}:not(.${checkboxClasses.checked}):not(.${checkboxClasses.indeterminate})`]:
        {
          color: 'inherit',
        },
    }),
    stickyHeader: ({ theme }) => ({
      backgroundColor: theme.vars.palette.text.primary,
    }),
    paddingCheckbox: ({ theme }) => ({
      paddingLeft: theme.spacing(1),
    }),
  },
};

const MuiTablePagination: Components<Theme>['MuiTablePagination'] = {
  // ▼▼▼▼▼▼▼▼ ⚙️ PROPS ▼▼▼▼▼▼▼▼
  defaultProps: {
    backIconButtonProps: { size: 'small' },
    nextIconButtonProps: { size: 'small' },
    slotProps: { select: { name: 'table-pagination-select' } },
  },
  // ▼▼▼▼▼▼▼▼ 🎨 STYLE ▼▼▼▼▼▼▼▼
  styleOverrides: {
    root: { width: '100%' },
    toolbar: { height: 64 },
    actions: { marginRight: 8 },
    select: {
      display: 'flex',
      alignItems: 'center',
    },
    selectIcon: {
      right: 4,
      width: 16,
      height: 16,
      top: 'calc(50% - 8px)',
    },
  },
};

/* **********************************************************************
 * 🚀 Export
 * **********************************************************************/
export const table: Components<Theme> = {
  MuiTableRow,
  MuiTableCell,
  MuiTableContainer,
  MuiTablePagination,
};
