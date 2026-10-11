import { it, expect, describe } from 'vitest';

import { typography } from '../core/components/typography';

// ----------------------------------------------------------------------
// Ревью фронтенда 2026-10-09, FE-28 (axe: page-has-heading-one, heading-order).
// MUI по умолчанию рендерит subtitle1/2 как <h6>: подписи полей становились
// «заголовками», а после <h1> страницы шли скачки на <h6>.

const mapping = () => typography.MuiTypography?.defaultProps?.variantMapping ?? {};

describe('Typography variant → tag', () => {
  it('renders subtitles as paragraphs, not headings', () => {
    expect(mapping().subtitle1).toBe('p');
    expect(mapping().subtitle2).toBe('p');
  });

  it.each(['h3', 'h4', 'h5', 'h6'] as const)('renders %s as h2 under the page h1', (variant) => {
    expect(mapping()[variant]).toBe('h2');
  });

  it('keeps h1 and h2 as is', () => {
    expect(mapping().h1).toBe('h1');
    expect(mapping().h2).toBe('h2');
  });
});
