'use client';

import type { TicketStatus } from 'src/types/support';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { postMessage, useGetTicket, setTicketStatus, useGetTicketMessages } from 'src/actions/support';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TICKET_STATUSES } from 'src/types/support';

// ----------------------------------------------------------------------

type Props = { id: string };

export function TicketDetailView({ id }: Props) {
  const { ticket, ticketLoading } = useGetTicket(id);
  const { messages } = useGetTicketMessages(id);
  const { t } = useTranslate(['support', 'common']);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  if (ticketLoading) return <LoadingScreen />;
  if (!ticket) return <DashboardContent>{t('detail.notFound')}</DashboardContent>;

  const handleStatus = async (status: TicketStatus) => {
    try {
      await setTicketStatus(id, status);
      toast.success(t('toast.statusUpdated'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common:state.error'));
    }
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await postMessage(id, text.trim());
      setText('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common:state.error'));
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={ticket.subject}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('list.title'), href: paths.dashboard.support.root },
          { name: ticket.subject },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ p: 3, mb: 3 }}>
        <Box sx={{ gap: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
          <Label color="info">{t(`enums.priority.${ticket.priority}`)}</Label>
          <TextField
            select
            size="small"
            label={t('detail.statusLabel')}
            value={ticket.status}
            onChange={(e) => handleStatus(e.target.value as TicketStatus)}
            sx={{ width: 200, ml: { sm: 'auto' } }}
          >
            {TICKET_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {t(`enums.status.${status}`)}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Card>

      <Card sx={{ p: 3 }}>
        <Stack spacing={2} sx={{ mb: 3 }}>
          {messages.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              {t('detail.noMessages')}
            </Typography>
          ) : (
            messages.map((msg) => (
              <Box
                key={msg.id}
                sx={{
                  maxWidth: '80%',
                  alignSelf: msg.is_from_operator ? 'flex-start' : 'flex-end',
                }}
              >
                <Box
                  sx={(theme) => ({
                    p: 1.5,
                    borderRadius: 1.5,
                    color: msg.is_from_operator ? 'text.primary' : 'primary.contrastText',
                    bgcolor: msg.is_from_operator ? theme.vars.palette.background.neutral : 'primary.main',
                  })}
                >
                  <Typography variant="body2">{msg.body}</Typography>
                </Box>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {msg.is_from_operator ? t('detail.senderSupport') : t('detail.senderYou')} · {msg.created_at?.slice(0, 16).replace('T', ' ')}
                </Typography>
              </Box>
            ))
          )}
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('detail.messagePlaceholder')}
          />
          <Button
            variant="contained"
            loading={sending}
            onClick={handleSend}
            startIcon={<Iconify icon="solar:letter-bold" />}
          >
            {t('detail.send')}
          </Button>
        </Stack>
      </Card>
    </DashboardContent>
  );
}
