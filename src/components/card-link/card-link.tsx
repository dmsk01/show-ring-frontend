import type { Theme } from '@mui/material/styles';
import type { LinkProps } from '@mui/material/Link';

import Link from '@mui/material/Link';

import { RouterLink } from 'src/routes/components';

// ----------------------------------------------------------------------

/**
 * sx for a Card that hosts a `CardLink`: positions the stretched-link overlay,
 * shows a pointer cursor and a hover shadow so the whole card reads as clickable.
 */
export const cardActionableSx = (theme: Theme) => ({
  position: 'relative',
  cursor: 'pointer',
  transition: theme.transitions.create(['box-shadow']),
  '&:hover': { boxShadow: theme.customShadows.z16 },
});

const stretchSx = {
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
  },
};

type CardLinkProps = LinkProps & { href: string };

/**
 * Title link whose hit area is stretched over the whole positioned Card
 * (use together with `cardActionableSx`). Keeps a real `<a href>`, so middle
 * click, open-in-new-tab and copy-link work. Any nested interactive element
 * must raise its own stacking (`sx={{ position: 'relative' }}`) to stay
 * clickable above the overlay.
 */
export function CardLink({ href, sx, ...other }: CardLinkProps) {
  return (
    <Link
      component={RouterLink}
      href={href}
      color="inherit"
      sx={[stretchSx, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    />
  );
}
