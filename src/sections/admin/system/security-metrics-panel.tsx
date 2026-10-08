'use client';

import useSWR from 'swr';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { fetcher, endpoints } from 'src/lib/axios';

import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------
// Счётчики безопасности (бэкенд: GET /admin/security/metrics, план защиты
// 2026-10-05, этап 3). Оповещения о всплесках шлёт сам бэкенд — здесь
// только просмотр текущей картины.

type Window = '10m' | '1h' | '24h';

type SecurityMetrics = { windows: Record<Window, Record<string, number>> };

const EVENTS = [
  'rate_limited',
  'http_5xx',
  'slow_request',
  'sms_sent',
  'otp_verified',
  'captcha_failed',
  'login_failed',
  'account_locked',
] as const;

const WINDOWS: Window[] = ['10m', '1h', '24h'];

export function SecurityMetricsPanel() {
  const { t } = useTranslate('admin');
  const { data } = useSWR<SecurityMetrics>(endpoints.admin.securityMetrics, fetcher, {
    refreshInterval: 60_000,
  });

  return (
    <Card sx={{ p: 3 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">{t('system.security.heading')}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('system.security.description')}
        </Typography>
      </Box>

      <Scrollbar>
        <Table size="small" sx={{ minWidth: 480 }}>
          <TableHead>
            <TableRow>
              <TableCell>{t('system.security.event')}</TableCell>
              {WINDOWS.map((w) => (
                <TableCell key={w} align="right">
                  {t(`system.security.windows.${w}`)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {EVENTS.map((event) => (
              <TableRow key={event}>
                <TableCell>{t(`system.security.events.${event}`)}</TableCell>
                {WINDOWS.map((w) => (
                  <TableCell key={w} align="right">
                    {data ? (data.windows[w]?.[event] ?? 0) : '—'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Scrollbar>
    </Card>
  );
}
