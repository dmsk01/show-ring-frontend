import { createElement } from 'react';
import { it, expect, describe } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { UserText } from '../user-text';

// ----------------------------------------------------------------------
// Пользовательский простой текст (описания собак и объявлений) — без
// HTML/markdown: абзацы и переносы сохраняются, разметка экранируется
// (ревью фронтенда 2026-10-09, FE-01).

function render(text: string): string {
  // Классы и SSR-стили MUI/emotion к поведению не относятся — убираем их из сравнения.
  return renderToStaticMarkup(createElement(UserText, null, text))
    .replace(/<style data-emotion[^>]*>.*?<\/style>/g, '')
    .replace(/ class="[^"]*"/g, '');
}

describe('UserText', () => {
  it('keeps paragraphs and line breaks of plain text', () => {
    expect(render('Строка 1\nСтрока 2\n\nАбзац 2')).toBe(
      '<div><p>Строка 1<br/>Строка 2</p><p>Абзац 2</p></div>'
    );
  });

  it('renders markup as text, not as elements', () => {
    const html = render('<meta http-equiv="refresh" content="0;url=https://evil.example/">');
    expect(html).not.toContain('<meta');
    expect(html).toContain('&lt;meta http-equiv=&quot;refresh&quot;');
  });

  it('normalizes Windows line endings and trims empty paragraphs', () => {
    expect(render('\r\nА\r\n\r\n\r\nБ\r\n')).toBe('<div><p>А</p><p>Б</p></div>');
  });
});
