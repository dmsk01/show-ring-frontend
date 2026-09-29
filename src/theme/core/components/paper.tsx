import type { Theme, Components } from '@mui/material/styles';

// ----------------------------------------------------------------------

const MuiPaper: Components<Theme>['MuiPaper'] = {
  // ▼▼▼▼▼▼▼▼ ⚙️ PROPS ▼▼▼▼▼▼▼▼
  defaultProps: {
    elevation: 0,
  },
  // ▼▼▼▼▼▼▼▼ 🎨 STYLE ▼▼▼▼▼▼▼▼
  styleOverrides: {
    root: {
      backgroundImage: 'none',
      variants: [
        {
          props: (props) => props.variant === 'outlined',
          style: ({ theme }) => ({
            border: 0,
            boxShadow: theme.vars.customShadows.card,
          }),
        },
        {
          props: (props) => props.variant !== 'outlined' && !!props.elevation,
          style: ({ theme }) => ({
            boxShadow: theme.vars.customShadows.card,
          }),
        },
      ],
    },
  },
};

/* **********************************************************************
 * 🚀 Export
 * **********************************************************************/
export const paper: Components<Theme> = {
  MuiPaper,
};
