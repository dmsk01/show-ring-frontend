import type { PaletteColorKey } from './core';

// ----------------------------------------------------------------------

/**
 * Semantic color tokens for domain states.
 *
 * Domain status maps (show, litter, ticket, campaign…) must map each status
 * to a tone from `STATUS_TONE` instead of a raw palette color, so that the
 * same meaning always renders the same way and the palette can be changed
 * in one place.
 */

export type SemanticColor = PaletteColorKey | 'default';

export const STATUS_TONE = {
  /** Draft, planned, terminal/archived states — nothing to do. */
  neutral: 'default',
  /** Waiting for someone's action or review. */
  pending: 'warning',
  /** Open, live, available. */
  active: 'success',
  /** Being processed / happening right now. */
  progress: 'info',
  /** Cancelled, failed. */
  danger: 'error',
} as const satisfies Record<string, SemanticColor>;

export type StatusTone = keyof typeof STATUS_TONE;

/** Ordinal scale for priority-like values (low → urgent). */
export const PRIORITY_TONE = {
  low: 'default',
  normal: 'info',
  high: 'warning',
  urgent: 'error',
} as const satisfies Record<string, SemanticColor>;

/** Dog sex. */
export const SEX_COLOR = {
  male: 'info',
  female: 'secondary',
} as const satisfies Record<'male' | 'female', SemanticColor>;
