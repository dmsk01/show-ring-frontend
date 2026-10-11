import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import SvgIcon from '@mui/material/SvgIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';

import { fToNow } from 'src/utils/format-time';

import { notificationIcons } from './icons';

// ----------------------------------------------------------------------

export type NotificationItemProps = {
  notification: {
    id: string;
    type: string;
    title: string;
    category: string;
    isUnRead: boolean;
    avatarUrl: string | null;
    createdAt: string | number | null;
  };
  onClick?: () => void;
};

const renderIcon = (type: string) =>
  ({
    order: notificationIcons.order,
    chat: notificationIcons.chat,
    mail: notificationIcons.mail,
    delivery: notificationIcons.delivery,
  })[type];

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const renderAvatar = () => (
    <ListItemAvatar>
      {notification.avatarUrl ? (
        <Avatar src={notification.avatarUrl} sx={{ bgcolor: 'background.neutral' }} />
      ) : (
        <Box
          sx={{
            width: 40,
            height: 40,
            display: 'flex',
            borderRadius: '50%',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.neutral',
          }}
        >
          <SvgIcon sx={{ width: 24, height: 24 }}>{renderIcon(notification.type)}</SvgIcon>
        </Box>
      )}
    </ListItemAvatar>
  );

  const renderText = () => (
    <ListItemText
      // Заголовок — текст, не HTML: React экранирует его сам (см. to-drawer-item.ts).
      primary={notification.title}
      secondary={
        <>
          {fToNow(notification.createdAt)}
          <Box
            component="span"
            sx={{ width: 2, height: 2, borderRadius: '50%', bgcolor: 'currentColor' }}
          />
          {notification.category}
        </>
      }
      slotProps={{
        primary: {
          sx: { mb: 0.5, typography: 'body2' },
        },
        secondary: {
          sx: {
            gap: 0.5,
            display: 'flex',
            alignItems: 'center',
            typography: 'caption',
            color: 'text.disabled',
          },
        },
      }}
    />
  );

  const renderUnReadBadge = () =>
    notification.isUnRead && (
      <Box
        sx={{
          top: 26,
          width: 8,
          height: 8,
          right: 20,
          borderRadius: '50%',
          bgcolor: 'info.main',
          position: 'absolute',
        }}
      />
    );

  return (
    <ListItemButton
      disableRipple
      onClick={onClick}
      sx={[
        (theme) => ({
          p: 2.5,
          alignItems: 'flex-start',
          borderBottom: `dashed 1px ${theme.vars.palette.divider}`,
        }),
      ]}
    >
      {renderUnReadBadge()}
      {renderAvatar()}

      <Box sx={{ minWidth: 0, flex: '1 1 auto' }}>{renderText()}</Box>
    </ListItemButton>
  );
}
