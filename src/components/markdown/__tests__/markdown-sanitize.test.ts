import { createElement } from 'react';
import ReactMarkdown from 'react-markdown';
import { it, expect, describe } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { markdownRehypePlugins, prepareMarkdownContent } from '../markdown';

// ----------------------------------------------------------------------
// Тот же конвейер, что в <Markdown>: подготовка контента + rehype-плагины.
// Ревью фронтенда 2026-10-09, FE-01: HTML из пользовательского текста
// рендерился как разметка (rehype-raw без санитизации).

function render(input: string): string {
  return renderToStaticMarkup(
    createElement(
      ReactMarkdown,
      { rehypePlugins: markdownRehypePlugins },
      prepareMarkdownContent(input)
    )
  );
}

describe('Markdown sanitization', () => {
  it('drops meta refresh redirects', () => {
    const html = render('Текст <meta http-equiv="refresh" content="0;url=https://evil.example/">');
    expect(html).not.toContain('<meta');
    expect(html).toContain('Текст');
  });

  it('drops style, form, input, script and iframe elements', () => {
    const html = render(
      '<p>a</p><style>body{display:none}</style><form action="/api/auth/login"><input name="password"></form><script>x()</script><iframe src="https://evil.example"></iframe>'
    );
    expect(html).not.toMatch(/<(style|form|input|script|iframe)\b/);
  });

  it('keeps the blog formatting allowed by the backend allowlist', () => {
    const html = render(
      '<h2>Итоги</h2><p><strong>CACIB</strong> <u>важно</u> <a href="https://rkf.org.ru">РКФ</a></p><ul><li>один</li></ul><blockquote>цитата</blockquote><img src="/api/files/abc" alt="фото">'
    );
    expect(html).toContain('<h2>Итоги</h2>');
    expect(html).toContain('<strong>CACIB</strong>');
    expect(html).toContain('<u>важно</u>');
    expect(html).toContain('<a href="https://rkf.org.ru">РКФ</a>');
    expect(html).toContain('<li>один</li>');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('<img src="/api/files/abc" alt="фото"');
  });
});
