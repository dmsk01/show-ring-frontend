import i18next from 'i18next';
import { it, expect, describe, afterEach } from 'vitest';

import { fCurrency } from '../format-number';

// ----------------------------------------------------------------------
// Ревью фронтенда 2026-10-09, FE-19: в английской локали взнос «1 500 ₽»
// показывался как «$1,500» — валюта бралась из языка интерфейса.

const original = Object.getOwnPropertyDescriptor(i18next, 'resolvedLanguage');

function setLanguage(lang: string) {
  Object.defineProperty(i18next, 'resolvedLanguage', { configurable: true, get: () => lang });
}

afterEach(() => {
  if (original) Object.defineProperty(i18next, 'resolvedLanguage', original);
});

describe('fCurrency', () => {
  it('formats rubles in the English locale', () => {
    setLanguage('en');
    const text = fCurrency(1500);
    expect(text).not.toContain('$');
    expect(text).toMatch(/RUB|₽/);
  });

  it('formats rubles in the Russian locale', () => {
    setLanguage('ru');
    expect(fCurrency(1500)).toContain('₽');
  });
});
