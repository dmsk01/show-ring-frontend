'use client';

import type { EventType, NotificationChannel } from 'src/types/notification';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';

import { paths } from 'src/routes/paths';

import { useGetBreeds } from 'src/actions/reference';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  createSubscription,
  deleteSubscription,
  useGetNotifications,
  useGetSubscriptions,
  markNotificationRead,
  markAllNotificationsRead,
} from 'src/actions/notification';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { EVENT_TYPES, NOTIFICATION_CHANNELS } from 'src/types/notification';

// ----------------------------------------------------------------------

const STATUS_COLOR = { pending: 'warning', sent: 'success', failed: 'error' } as const;

export function NotificationsView() {
  const { breeds } = useGetBreeds();
  const { subscriptions } = useGetSubscriptions();
  const { notifications } = useGetNotifications();

  const [eventType, setEventType] = useState<EventType>('show.registration_opened');
  const [channel, setChannel] = useState<NotificationChannel>('email');
  const [breedId, setBreedId] = useState('');
  const [region, setRegion] = useState('');
  const [busy, setBusy] = useState(false);

  const breedName = (id: string | null) =>
    id ? (breeds.find((b) => b.id === id)?.name ?? id) : null;

  const handleSubscribe = async () => {
    setBusy(true);
    try {
      await createSubscription({
        event_type: eventType,
        channel,
        filter_breed_id: breedId || null,
        filter_region: region || null,
      });
      toast.success('Subscribed!');
      setBreedId('');
      setRegion('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to subscribe');
    } finally {
      setBusy(false);
    }
  };

  const handleUnsubscribe = async (id: string) => {
    try {
      await deleteSubscription(id);
      toast.success('Unsubscribed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to unsubscribe');
    }
  };

  const hasUnread = notifications.some((n) => !n.is_read);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark all read');
    }
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Notifications"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Notifications' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ mb: 3 }}>
        <CardHeader title="Subscriptions" subheader="Get notified about platform events" />
        <Box sx={{ p: 3 }}>
          <Box
            sx={{
              gap: 2,
              mb: 3,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(4, 1fr)' },
              alignItems: 'center',
            }}
          >
            <TextField
              select
              label="Event"
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
            >
              {EVENT_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value as NotificationChannel)}
            >
              {NOTIFICATION_CHANNELS.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Breed (optional)"
              value={breedId}
              onChange={(e) => setBreedId(e.target.value)}
            >
              <MenuItem value="">Any</MenuItem>
              {breeds.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Region (optional)"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
          </Box>

          <Stack sx={{ alignItems: 'flex-end', mb: subscriptions.length ? 3 : 0 }}>
            <Button
              variant="contained"
              loading={busy}
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleSubscribe}
            >
              Subscribe
            </Button>
          </Stack>

          {subscriptions.length > 0 && (
            <Stack divider={<Divider sx={{ borderStyle: 'dashed' }} />} spacing={1.5}>
              {subscriptions.map((s) => (
                <Box key={s.id} sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ flex: 1 }}>
                    {s.event_type}
                  </Typography>
                  <Label color="info">{s.channel}</Label>
                  {breedName(s.filter_breed_id) && <Label>{breedName(s.filter_breed_id)}</Label>}
                  {s.filter_region && <Label>{s.filter_region}</Label>}
                  <IconButton color="error" onClick={() => handleUnsubscribe(s.id)}>
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Card>

      <Card>
        <CardHeader
          title="Recent notifications"
          action={
            hasUnread && (
              <Button
                size="small"
                color="inherit"
                startIcon={<Iconify icon="eva:done-all-fill" />}
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </Button>
            )
          }
        />
        <Box sx={{ p: 3 }}>
          {notifications.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              No notifications yet.
            </Typography>
          ) : (
            <Stack divider={<Divider sx={{ borderStyle: 'dashed' }} />} spacing={1.5}>
              {notifications.map((n) => (
                <Box
                  key={n.id}
                  onClick={n.is_read ? undefined : () => markNotificationRead(n.id)}
                  sx={{
                    gap: 1,
                    display: 'flex',
                    alignItems: 'center',
                    cursor: n.is_read ? 'default' : 'pointer',
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      flexShrink: 0,
                      borderRadius: '50%',
                      bgcolor: n.is_read ? 'transparent' : 'info.main',
                    }}
                  />
                  <Stack sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: n.is_read ? 400 : 600 }}>
                      {n.subject}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {n.event_type} · {n.created_at?.slice(0, 16).replace('T', ' ')}
                    </Typography>
                  </Stack>
                  <Label color="default">{n.channel}</Label>
                  <Label color={STATUS_COLOR[n.status]}>{n.status}</Label>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Card>
    </DashboardContent>
  );
}
