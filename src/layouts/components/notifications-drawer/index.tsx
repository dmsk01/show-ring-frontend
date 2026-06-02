'use client';

import type { IconButtonProps } from '@mui/material/IconButton';
import type { INotification } from 'src/types/notification';
import type { NotificationItemProps } from './notification-item';

import { m } from 'framer-motion';
import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import {
  useGetUnreadCount,
  useGetNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from 'src/actions/notification';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { varTap, varHover, transitionTap } from 'src/components/animate';

import { NotificationItem } from './notification-item';

// ----------------------------------------------------------------------

type DrawerNotification = NotificationItemProps['notification'];

// Map a backend notification to the template's notification-item shape.
function toItem(n: INotification): DrawerNotification {
  return {
    id: n.id,
    type: 'mail',
    title: `<p>${n.subject}</p>`,
    category: n.event_type,
    isUnRead: !n.is_read,
    avatarUrl: null,
    createdAt: n.created_at,
  };
}

// ----------------------------------------------------------------------

export type NotificationsDrawerProps = IconButtonProps;

export function NotificationsDrawer({ sx, ...other }: NotificationsDrawerProps) {
  const { value: open, onFalse: onClose, onTrue: onOpen } = useBoolean();

  const [currentTab, setCurrentTab] = useState('all');

  const { notifications } = useGetNotifications();
  const { unreadCount } = useGetUnreadCount();

  const items = useMemo(() => notifications.map(toItem), [notifications]);

  const totalUnRead = items.filter((item) => item.isUnRead).length;

  const tabs = [
    { value: 'all', label: 'All', count: items.length },
    { value: 'unread', label: 'Unread', count: totalUnRead },
  ];

  const handleChangeTab = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  }, []);

  const handleMarkRead = useCallback((id: string) => {
    markNotificationRead(id).catch(() => {});
  }, []);

  const handleMarkAllRead = useCallback(() => {
    markAllNotificationsRead().catch(() => {});
  }, []);

  const filtered = currentTab === 'unread' ? items.filter((i) => i.isUnRead) : items;

  const renderHead = () => (
    <Box sx={{ py: 2, pr: 1, pl: 2.5, minHeight: 68, display: 'flex', alignItems: 'center' }}>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Notifications
      </Typography>

      {unreadCount > 0 && (
        <Tooltip title="Mark all as read">
          <IconButton color="primary" onClick={handleMarkAllRead}>
            <Iconify icon="eva:done-all-fill" />
          </IconButton>
        </Tooltip>
      )}

      <IconButton onClick={onClose} sx={{ display: { xs: 'inline-flex', sm: 'none' } }}>
        <Iconify icon="mingcute:close-line" />
      </IconButton>
    </Box>
  );

  const renderTabs = () => (
    <Tabs variant="fullWidth" value={currentTab} onChange={handleChangeTab} indicatorColor="custom">
      {tabs.map((tab) => (
        <Tab
          key={tab.value}
          iconPosition="end"
          value={tab.value}
          label={tab.label}
          icon={
            <Label
              variant={((tab.value === 'all' || tab.value === currentTab) && 'filled') || 'soft'}
              color={(tab.value === 'unread' && 'info') || 'default'}
            >
              {tab.count}
            </Label>
          }
        />
      ))}
    </Tabs>
  );

  const renderList = () => (
    <Scrollbar>
      {filtered.length ? (
        <Box component="ul">
          {filtered.map((notification) => (
            <Box component="li" key={notification.id} sx={{ display: 'flex' }}>
              <NotificationItem
                notification={notification}
                onClick={
                  notification.isUnRead ? () => handleMarkRead(notification.id) : undefined
                }
              />
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ p: 5, textAlign: 'center', color: 'text.disabled', typography: 'body2' }}>
          No notifications
        </Box>
      )}
    </Scrollbar>
  );

  return (
    <>
      <IconButton
        component={m.button}
        whileTap={varTap(0.96)}
        whileHover={varHover(1.04)}
        transition={transitionTap()}
        aria-label="Notifications button"
        onClick={onOpen}
        sx={sx}
        {...other}
      >
        <Badge badgeContent={unreadCount} color="error">
          <Iconify width={24} icon="solar:bell-bing-bold-duotone" />
        </Badge>
      </IconButton>

      <Drawer
        open={open}
        onClose={onClose}
        anchor="right"
        slotProps={{
          backdrop: { invisible: true },
          paper: { sx: { width: 1, maxWidth: 420 } },
        }}
      >
        {renderHead()}
        {renderTabs()}
        {renderList()}

        <Box sx={{ p: 1 }}>
          <Button
            fullWidth
            size="large"
            component={RouterLink}
            href={paths.dashboard.notifications}
            onClick={onClose}
          >
            View all
          </Button>
        </Box>
      </Drawer>
    </>
  );
}
