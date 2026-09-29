// Show Ring design-system entry for claude.ai/design (see .design-sync/NOTES.md).
// Re-exports the app's real theme and components - nothing is reimplemented here.
// The only glue is ShowRingThemeProvider: the app's ThemeProvider reads the
// settings drawer + i18n contexts, which don't exist outside the Next app.

import './process-shim';

import type { ReactNode } from 'react';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';

import { createTheme } from 'src/theme/create-theme';

// ----------------------------------------------------------------------

const theme = createTheme();

export type ShowRingThemeProviderProps = {
  children?: ReactNode;
  /** Color scheme to render in. Defaults to `light`. */
  mode?: 'light' | 'dark';
};

/**
 * Root provider for every Show Ring UI. Applies the MUI theme (palette, typography,
 * shadows, component overrides) and CssBaseline. Every component in this library must
 * render inside it - without it MUI falls back to its stock look.
 */
export function ShowRingThemeProvider({ children, mode = 'light' }: ShowRingThemeProviderProps) {
  return (
    <ThemeProvider theme={theme} defaultMode={mode} disableTransitionOnChange>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

// -- Semantic tokens ------------------------------------------------------

export { SEX_COLOR, STATUS_TONE, PRIORITY_TONE } from 'src/theme/semantic';

// -- Show Ring components -------------------------------------------------

export { Label } from 'src/components/label';
export { Image } from 'src/components/image';
export { Logo } from 'src/components/logo';
export { Iconify } from 'src/components/iconify';
export { MetaRow } from 'src/components/meta-row';
export { Scrollbar } from 'src/components/scrollbar';
export { ConfirmDialog } from 'src/components/custom-dialog';
export { EmptyContent } from 'src/components/empty-content';
export { CustomPopover } from 'src/components/custom-popover';
export { SearchNotFound } from 'src/components/search-not-found';
export { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
export { CardLink, cardActionableSx } from 'src/components/card-link';
export {
  TableNoData,
  TableSkeleton,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

// -- MUI components (styled by the Show Ring theme overrides) --------------

export { default as Box } from '@mui/material/Box';
export { default as Stack } from '@mui/material/Stack';
export { default as Grid } from '@mui/material/Grid';
export { default as Container } from '@mui/material/Container';
export { default as Typography } from '@mui/material/Typography';
export { default as Link } from '@mui/material/Link';
export { default as Divider } from '@mui/material/Divider';
export { default as Paper } from '@mui/material/Paper';

export { default as Button } from '@mui/material/Button';
export { default as IconButton } from '@mui/material/IconButton';
export { default as ButtonGroup } from '@mui/material/ButtonGroup';

export { default as Card } from '@mui/material/Card';
export { default as CardHeader } from '@mui/material/CardHeader';
export { default as CardContent } from '@mui/material/CardContent';
export { default as CardActions } from '@mui/material/CardActions';

export { default as TextField } from '@mui/material/TextField';
export { default as MenuItem } from '@mui/material/MenuItem';
export { default as InputAdornment } from '@mui/material/InputAdornment';
export { default as Autocomplete } from '@mui/material/Autocomplete';
export { default as Switch } from '@mui/material/Switch';
export { default as Checkbox } from '@mui/material/Checkbox';
export { default as Radio } from '@mui/material/Radio';
export { default as RadioGroup } from '@mui/material/RadioGroup';
export { default as FormControlLabel } from '@mui/material/FormControlLabel';

export { default as Chip } from '@mui/material/Chip';
export { default as Avatar } from '@mui/material/Avatar';
export { default as AvatarGroup } from '@mui/material/AvatarGroup';
export { default as Badge } from '@mui/material/Badge';
export { default as Tooltip } from '@mui/material/Tooltip';
export { default as Rating } from '@mui/material/Rating';

export { default as Alert } from '@mui/material/Alert';
export { default as AlertTitle } from '@mui/material/AlertTitle';
export { default as LinearProgress } from '@mui/material/LinearProgress';
export { default as CircularProgress } from '@mui/material/CircularProgress';
export { default as Skeleton } from '@mui/material/Skeleton';

export { default as Tabs } from '@mui/material/Tabs';
export { default as Tab } from '@mui/material/Tab';
export { default as Pagination } from '@mui/material/Pagination';

export { default as Table } from '@mui/material/Table';
export { default as TableHead } from '@mui/material/TableHead';
export { default as TableBody } from '@mui/material/TableBody';
export { default as TableRow } from '@mui/material/TableRow';
export { default as TableCell } from '@mui/material/TableCell';
export { default as TableContainer } from '@mui/material/TableContainer';

export { default as Dialog } from '@mui/material/Dialog';
export { default as DialogTitle } from '@mui/material/DialogTitle';
export { default as DialogContent } from '@mui/material/DialogContent';
export { default as DialogActions } from '@mui/material/DialogActions';
export { default as Drawer } from '@mui/material/Drawer';
export { default as Menu } from '@mui/material/Menu';
export { default as MenuList } from '@mui/material/MenuList';

export { default as ListItemText } from '@mui/material/ListItemText';
export { default as ListItemButton } from '@mui/material/ListItemButton';
export { default as ListItemAvatar } from '@mui/material/ListItemAvatar';

export { default as Accordion } from '@mui/material/Accordion';
export { default as AccordionSummary } from '@mui/material/AccordionSummary';
export { default as AccordionDetails } from '@mui/material/AccordionDetails';
