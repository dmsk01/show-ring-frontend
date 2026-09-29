import type { Theme, Components } from '@mui/material/styles';

import { varAlpha } from 'minimal-shared/utils';

// ----------------------------------------------------------------------

const MuiLink: Components<Theme>['MuiLink'] = {
  // ▼▼▼▼▼▼▼▼ ⚙️ PROPS ▼▼▼▼▼▼▼▼
  defaultProps: {
    underline: 'hover',
  },
  // ▼▼▼▼▼▼▼▼ 🎨 STYLE ▼▼▼▼▼▼▼▼
  styleOverrides: {
    root: {
      variants: [
        {
          // primary.main on white is ~4:1 — links use primary.dark in light mode
          props: (props) => !props.color || props.color === 'primary',
          style: ({ theme }) => ({
            color: theme.vars.palette.primary.dark,
            textDecorationColor: varAlpha(theme.vars.palette.primary.darkChannel, 0.4),
            ...theme.applyStyles('dark', {
              color: theme.vars.palette.primary.main,
              textDecorationColor: varAlpha(theme.vars.palette.primary.mainChannel, 0.4),
            }),
          }),
        },
      ],
    },
  },
};

/* **********************************************************************
 * 🚀 Export
 * **********************************************************************/
export const link: Components<Theme> = {
  MuiLink,
};
