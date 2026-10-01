import type { BoxProps } from '@mui/material/Box';
import type { IconifyName } from 'src/components/iconify';

import Box from '@mui/material/Box';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type MetaRowProps = BoxProps & {
  icon: IconifyName;
  /**
   * Icon color. Meta icons are neutral by default; pass a semantic color
   * (e.g. `${SEX_COLOR[sex]}.main`) only when the icon itself carries meaning.
   */
  iconColor?: string;
};

/**
 * Secondary "icon + text" line used in cards and detail headers
 * (date, location, breed, counters…).
 */
export function MetaRow({ icon, iconColor, children, sx, ...other }: MetaRowProps) {
  return (
    <Box
      sx={[
        {
          gap: 0.75,
          display: 'flex',
          alignItems: 'center',
          typography: 'body2',
          color: 'text.secondary',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Iconify icon={icon} sx={{ flexShrink: 0, ...(iconColor && { color: iconColor }) }} />
      {children}
    </Box>
  );
}
