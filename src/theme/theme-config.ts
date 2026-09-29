import type { Theme, Direction, CommonColors, ThemeProviderProps } from '@mui/material/styles';
import type { ThemeCssVariables } from './types';
import type { PaletteColorKey, PaletteColorNoChannels } from './core/palette';

// ----------------------------------------------------------------------

export type ThemeConfig = {
  direction: Direction;
  classesPrefix: string;
  cssVariables: ThemeCssVariables;
  defaultMode: ThemeProviderProps<Theme>['defaultMode'];
  modeStorageKey: ThemeProviderProps<Theme>['modeStorageKey'];
  fontFamily: Record<'primary' | 'secondary', string>;
  palette: Record<PaletteColorKey, PaletteColorNoChannels> & {
    common: Pick<CommonColors, 'black' | 'white'>;
    grey: {
      [K in 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 as `${K}`]: string;
    };
  };
};

export const themeConfig: ThemeConfig = {
  /** **************************************
   * Base
   *************************************** */
  defaultMode: 'light',
  modeStorageKey: 'theme-mode',
  direction: 'ltr',
  classesPrefix: 'minimal',
  /** **************************************
   * Css variables
   *************************************** */
  cssVariables: {
    cssVarPrefix: '',
    colorSchemeSelector: 'data-color-scheme',
  },
  /** **************************************
   * Typography
   *************************************** */
  fontFamily: {
    primary: 'Onest',
    secondary: 'Unbounded',
  },
  /** **************************************
   * Palette
   *************************************** */
  palette: {
    primary: {
      lighter: '#FADAD1',
      light: '#F18F76',
      main: '#E8441A',
      dark: '#A73113',
      darker: '#6F210C',
      contrastText: '#FFFFFF',
    },
    secondary: {
      lighter: '#D2D9F7',
      light: '#778CE6',
      main: '#1D3FD6',
      dark: '#152D9A',
      darker: '#0E1E67',
      contrastText: '#FFFFFF',
    },
    info: {
      lighter: '#CEE5F2',
      light: '#6CB0D9',
      main: '#0A7CC0',
      dark: '#07598A',
      darker: '#053C5C',
      contrastText: '#FFFFFF',
    },
    success: {
      lighter: '#D0EADB',
      light: '#73C092',
      main: '#15964A',
      dark: '#0F6C35',
      darker: '#0A4824',
      contrastText: '#FFFFFF',
    },
    warning: {
      lighter: '#FAEBCC',
      light: '#F1C366',
      main: '#E89B00',
      dark: '#A77000',
      darker: '#6F4A00',
      contrastText: '#1A1613',
    },
    error: {
      lighter: '#F7D4D4',
      light: '#E87D7D',
      main: '#D92626',
      dark: '#9C1B1B',
      darker: '#681212',
      contrastText: '#FFFFFF',
    },
    grey: {
      50: '#FAFAFB',
      100: '#F4F5F7',
      200: '#E9EBEF',
      300: '#D5D9E0',
      400: '#AEB4BF',
      500: '#7D8594',
      600: '#545C6B',
      700: '#363C48',
      800: '#1B1F27',
      900: '#0E1116',
    },
    common: {
      black: '#000000',
      white: '#FFFFFF',
    },
  },
};
