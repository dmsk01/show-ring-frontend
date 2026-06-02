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

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  if (ticketLoading) return <LoadingScreen />;
  if (!ticket) return <DashboardContent>Ticket not found.</DashboardContent>;

  const handleStatus = async (status: TicketStatus) => {
    try {
      await setTicketStatus(id, status);
      toast.success('Status updated!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await postMessage(id, text.trim());
      setText('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={ticket.subject}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Support', href: paths.dashboard.support.root },
          { name: ticket.subject },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ p: 3, mb: 3 }}>
        <Box sx={{ gap: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
          <Label color="info">{ticket.priority}</Label>
          <TextField
            select
            size="small"
            label="Status"
            value={ticket.status}
            onChange={(e) => handleStatus(e.target.value as TicketStatus)}
            sx={{ width: 200, ml: { sm: 'auto' } }}
          >
            {TICKET_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {s.replace('_', ' ')}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Card>

      <Card sx={{ p: 3 }}>
        <Stack spacing={2} sx={{ mb: 3 }}>
          {messages.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              No messages yet.
            </Typography>
          ) : (
            messages.map((m) => (
              <Box
                key={m.id}
                sx={{
                  maxWidth: '80%',
                  alignSelf: m.is_from_operator ? 'flex-start' : 'flex-end',
                }}
              >
                <Box
                  sx={(theme) => ({
                    p: 1.5,
                    borderRadius: 1.5,
                    color: m.is_from_operator ? 'text.primary' : 'primary.contrastText',
                    bgcolor: m.is_from_operator ? theme.vars.palette.background.neutral : 'primary.main',
                  })}
                >
                  <Typography variant="body2">{m.body}</Typography>
                </Box>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {m.is_from_operator ? 'Support' : 'You'} · {m.created_at?.slice(0, 16).replace('T', ' ')}
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
            placeholder="Write a message..."
          />
          <Button
            variant="contained"
            loading={sending}
            onClick={handleSend}
            startIcon={<Iconify icon="solar:letter-bold" />}
          >
            Send
          </Button>
        </Stack>
      </Card>
    </DashboardContent>
  );
}
