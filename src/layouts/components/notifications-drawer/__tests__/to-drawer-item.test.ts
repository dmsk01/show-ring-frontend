import type { INotification } from 'src/types/notification';

import { it, expect, describe } from 'vitest';

import { toDrawerItem } from '../to-drawer-item';

// subject приходит с бэка и может содержать текст, введённый пользователями
// (название выставки, питомника). Раньше он оборачивался в `<p>${subject}</p>`
// и рендерился через dangerouslySetInnerHTML — XSS держался только на
// экранировании Jinja на бэке. Теперь заголовок — простой текст, который
// React экранирует сам.
const base = {
  id: 'n1',
  event_type: 'show.results_published',
  is_read: false,
  created_at: '2026-10-03T10:00:00Z',
} as unknown as INotification;

describe('toDrawerItem', () => {
  it('keeps subject as plain text without HTML wrapping', () => {
    const subject = '<img src=x onerror=alert(1)>';
    const item = toDrawerItem({ ...base, subject } as INotification);
    expect(item.title).toBe(subject);
  });

  it('maps read flag and category', () => {
    const item = toDrawerItem({ ...base, subject: 's', is_read: true } as INotification);
    expect(item.isUnRead).toBe(false);
    expect(item.category).toBe('show.results_published');
  });
});
