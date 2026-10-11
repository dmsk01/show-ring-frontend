import type { Theme, Components } from '@mui/material/styles';

// ----------------------------------------------------------------------

/**
 * Теги для вариантов текста. Вид задаёт variant, тег — только семантику:
 * - subtitle1/2 — подписи полей и блоков, а не заголовки (MUI по умолчанию
 *   делает их <h6>);
 * - h3…h6 — заголовки разделов под <h1> страницы, поэтому <h2>: иначе после
 *   <h1> идут скачки уровней (axe heading-order). Заголовок страницы — <h1>
 *   (CustomBreadcrumbs или component="h1").
 */
const MuiTypography: Components<Theme>['MuiTypography'] = {
  // ▼▼▼▼▼▼▼▼ ⚙️ PROPS ▼▼▼▼▼▼▼▼
  defaultProps: {
    variantMapping: {
      h1: 'h1',
      h2: 'h2',
      h3: 'h2',
      h4: 'h2',
      h5: 'h2',
      h6: 'h2',
      subtitle1: 'p',
      subtitle2: 'p',
      body1: 'p',
      body2: 'p',
      inherit: 'p',
    },
  },
};

/* **********************************************************************
 * 🚀 Export
 * **********************************************************************/
export const typography: Components<Theme> = {
  MuiTypography,
};
