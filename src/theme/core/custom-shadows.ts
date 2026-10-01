import type { SchemesRecord } from '../types';

import { varAlpha } from 'minimal-shared/utils';

import { grey, info, error, common, primary, success, warning, secondary } from './palette';

// ----------------------------------------------------------------------

/**
 * TypeScript extension for MUI theme augmentation.
 * @to {@link file://./../extend-theme-types.d.ts}
 */

export type CustomShadows = {
  z1: string;
  z4: string;
  z8: string;
  z12: string;
  z16: string;
  z20: string;
  z24: string;
  primary: string;
  secondary: string;
  info: string;
  success: string;
  warning: string;
  error: string;
  card: string;
  dialog: string;
  dropdown: string;
};

// ----------------------------------------------------------------------

export function createShadowColor(colorChannel: string): string {
  return `0 8px 16px 0 ${varAlpha(colorChannel, 0.24)}`;
}

/** Flat 1.5px outline instead of soft shadows. */
const OUTLINE = {
  light: '0 0 0 1.5px #D5D9E0',
  dark: '0 0 0 1.5px #2A2F39',
} as const;

/** Only floating layers (dropdown, dialog) keep a drop shadow. */
const FLOATING = '0 12px 24px -8px rgba(14,17,22,0.24)';

function createCustomShadows(colorChannel: string, mode: 'light' | 'dark'): CustomShadows {
  return {
    z1: `0 1px 2px 0 ${varAlpha(colorChannel, 0.16)}`,
    z4: `0 4px 8px 0 ${varAlpha(colorChannel, 0.16)}`,
    z8: `0 8px 16px 0 ${varAlpha(colorChannel, 0.16)}`,
    z12: `0 12px 24px -4px ${varAlpha(colorChannel, 0.16)}`,
    z16: `0 16px 32px -4px ${varAlpha(colorChannel, 0.16)}`,
    z20: `0 20px 40px -4px ${varAlpha(colorChannel, 0.16)}`,
    z24: `0 24px 48px 0 ${varAlpha(colorChannel, 0.16)}`,
    /********/
    dialog: `${OUTLINE[mode]}, ${FLOATING}`,
    card: OUTLINE[mode],
    dropdown: `${OUTLINE[mode]}, ${FLOATING}`,
    /********/
    primary: createShadowColor(primary.mainChannel),
    secondary: createShadowColor(secondary.mainChannel),
    info: createShadowColor(info.mainChannel),
    success: createShadowColor(success.mainChannel),
    warning: createShadowColor(warning.mainChannel),
    error: createShadowColor(error.mainChannel),
  };
}

/* **********************************************************************
 * 📦 Final
 * **********************************************************************/
export const customShadows: SchemesRecord<CustomShadows> = {
  light: createCustomShadows(grey['500Channel'], 'light'),
  dark: createCustomShadows(common.blackChannel, 'dark'),
};
