import type { Breakpoint, TypographyVariantsOptions } from '@mui/material/styles';

import { pxToRem, setFont } from 'minimal-shared/utils';

import { createTheme } from '@mui/material/styles';

import { themeConfig } from '../theme-config';

// ----------------------------------------------------------------------

/**
 * TypeScript extension for MUI theme augmentation.
 * @to {@link file://./../extend-theme-types.d.ts}
 */

export type TypographyVariantsExtend = {
  fontWeightSemiBold: React.CSSProperties['fontWeight'];
  fontWeightExtraBold: React.CSSProperties['fontWeight'];
  fontSecondaryFamily: React.CSSProperties['fontFamily'];
  /** Participant numbers, amounts, scores: Unbounded with tabular figures. */
  numeric: React.CSSProperties;
};

/**
 * Generates responsive font styles for given breakpoints
 * @param sizes - Object mapping breakpoints to font sizes in pixels
 * @returns CSS media query styles for responsive font sizes
 */
type FontSizesInput = Partial<Record<Breakpoint, number>>;
type FontSizesResult = Record<string, { fontSize: React.CSSProperties['fontSize'] }>;

function responsiveFontSizes(sizes: FontSizesInput): FontSizesResult {
  const {
    breakpoints: { keys, up },
  } = createTheme();

  return keys.reduce((styles, breakpoint) => {
    const size = sizes[breakpoint];

    if (size !== undefined && size >= 0) {
      styles[up(breakpoint)] = {
        fontSize: pxToRem(size),
      };
    }

    return styles;
  }, {} as FontSizesResult);
}

// ----------------------------------------------------------------------

const primaryFont = setFont(themeConfig.fontFamily.primary);
const secondaryFont = setFont(themeConfig.fontFamily.secondary);

const baseTypography: TypographyVariantsOptions = {
  fontFamily: primaryFont,
  fontSecondaryFamily: secondaryFont,
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightSemiBold: 600,
  fontWeightBold: 700,
  fontWeightExtraBold: 800,
};

/* **********************************************************************
 * 📦 Final
 * **********************************************************************/
/**
 * Line height is set as a unitless ratio: 22 / 14 ≈ 1.57
 * - 22px is the desired visual line height
 * - 14px is the font size
 * This keeps the line height scalable and responsive.
 */
export const typography: TypographyVariantsOptions = {
  ...baseTypography,
  h1: {
    fontFamily: secondaryFont,
    fontWeight: baseTypography.fontWeightBold,
    lineHeight: 80 / 64,
    fontSize: pxToRem(37),
    ...responsiveFontSizes({ sm: 48, md: 53, lg: 59 }),
  },
  h2: {
    fontFamily: secondaryFont,
    fontWeight: baseTypography.fontWeightBold,
    lineHeight: 64 / 48,
    fontSize: pxToRem(29),
    ...responsiveFontSizes({ sm: 37, md: 40, lg: 44 }),
  },
  h3: {
    fontFamily: secondaryFont,
    fontWeight: baseTypography.fontWeightBold,
    lineHeight: 1.5,
    fontSize: pxToRem(22),
    ...responsiveFontSizes({ sm: 24, md: 28, lg: 29 }),
  },
  h4: {
    fontFamily: secondaryFont,
    fontWeight: baseTypography.fontWeightBold,
    lineHeight: 1.5,
    fontSize: pxToRem(18),
    ...responsiveFontSizes({ md: 22 }),
  },
  h5: {
    fontFamily: secondaryFont,
    fontWeight: baseTypography.fontWeightBold,
    lineHeight: 1.5,
    fontSize: pxToRem(17),
    ...responsiveFontSizes({ sm: 17 }),
  },
  h6: {
    fontFamily: secondaryFont,
    fontWeight: baseTypography.fontWeightBold,
    lineHeight: 28 / 18,
    fontSize: pxToRem(16),
    ...responsiveFontSizes({ sm: 17 }),
  },
  subtitle1: {
    fontWeight: baseTypography.fontWeightSemiBold,
    lineHeight: 1.5,
    fontSize: pxToRem(16),
  },
  subtitle2: {
    fontWeight: baseTypography.fontWeightSemiBold,
    lineHeight: 22 / 14,
    fontSize: pxToRem(14),
  },
  body1: {
    lineHeight: 1.5,
    fontSize: pxToRem(16),
  },
  body2: {
    lineHeight: 22 / 14,
    fontSize: pxToRem(14),
  },
  caption: {
    lineHeight: 1.5,
    fontSize: pxToRem(12),
  },
  overline: {
    fontWeight: baseTypography.fontWeightBold,
    lineHeight: 1.5,
    fontSize: pxToRem(12),
    textTransform: 'uppercase',
  },
  button: {
    fontWeight: baseTypography.fontWeightBold,
    lineHeight: 24 / 14,
    fontSize: pxToRem(14),
    textTransform: 'unset',
  },
  numeric: {
    fontFamily: secondaryFont,
    fontWeight: baseTypography.fontWeightBold,
    fontVariantNumeric: 'tabular-nums',
  },
};
