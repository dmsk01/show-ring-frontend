import { it, expect, describe } from 'vitest';

import { themeConfig } from '../theme-config';

// ----------------------------------------------------------------------
// Ревью фронтенда 2026-10-09, FE-28 (axe): белый текст на фирменном цвете
// давал 3,98:1 при норме WCAG AA 4,5:1 для обычного текста — а это все
// основные кнопки («Войти», «Принять», CTA).

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('theme colors meet WCAG AA for normal text', () => {
  it.each(['primary', 'secondary', 'info'] as const)('%s.main vs contrastText', (name) => {
    const { main, contrastText } = themeConfig.palette[name];
    expect(contrast(main, contrastText)).toBeGreaterThanOrEqual(4.5);
  });

  it('primary.main as text on the light page background (#F4F5F7)', () => {
    expect(contrast(themeConfig.palette.primary.main, '#F4F5F7')).toBeGreaterThanOrEqual(4.5);
  });
});
