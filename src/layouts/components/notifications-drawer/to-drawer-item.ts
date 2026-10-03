import type { INotification } from 'src/types/notification';
import type { NotificationItemProps } from './notification-item';

// ----------------------------------------------------------------------

export type DrawerNotification = NotificationItemProps['notification'];

// Map a backend notification to the template's notification-item shape.
// title — простой текст (рендерится React'ом с экранированием), НЕ HTML:
// subject может содержать пользовательский ввод (название выставки и т.п.).
export function toDrawerItem(n: INotification): DrawerNotification {
  return {
    id: n.id,
    type: 'mail',
    title: n.subject,
    category: n.event_type,
    isUnRead: !n.is_read,
    avatarUrl: null,
    createdAt: n.created_at,
  };
}
