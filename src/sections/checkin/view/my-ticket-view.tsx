'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { useGetShow } from 'src/actions/show';
import { useMyTicket } from 'src/actions/checkin';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ATTENDANCE_COLOR } from '../checkin-utils';

// ----------------------------------------------------------------------

type Props = { id: string };

export function MyTicketView({ id }: Props) {
  const { t } = useTranslate(['checkin', 'show']);
  const { show, showLoading } = useGetShow(id);
  const { ticket, ticketLoading, ticketError } = useMyTicket(id);
  const [fullscreen, setFullscreen] = useState(false);

  if (showLoading || ticketLoading) return <LoadingScreen />;

  const name = show?.name ?? '';

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('ticket.heading', { name })}
        links={[
          { name: t('show:myShows.title'), href: paths.dashboard.myShows.root },
          { name, href: paths.dashboard.myShows.details(id) },
          { name: t('ticket.button') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {ticketError || !ticket ? (
        <EmptyContent filled title={t('ticket.unavailable')} sx={{ py: 8 }} />
      ) : (
        <Stack spacing={3} sx={{ maxWidth: 560, mx: 'auto' }}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Box
              sx={{ p: 2, bgcolor: 'common.white', borderRadius: 2, display: 'inline-flex' }}
              onClick={() => setFullscreen(true)}
            >
              <QRCodeSVG value={ticket.token} size={280} level="M" marginSize={2} />
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
              {t('ticket.hint')}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:full-screen-square-outline" />}
              onClick={() => setFullscreen(true)}
              sx={{ mt: 2 }}
            >
              {t('ticket.fullscreen')}
            </Button>
          </Card>

          <Card>
            <Stack divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
              {ticket.entries.map((entry) => (
                <Stack key={entry.entry_id} spacing={1} sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2">
                      {entry.dog_name}
                      {' · '}
                      {entry.catalog_number != null
                        ? t('ticket.catalogNumber', { n: entry.catalog_number })
                        : t('ticket.noNumber')}
                    </Typography>
                    <Label color={ATTENDANCE_COLOR[entry.attendance_status]}>
                      {t(`attendance.${entry.attendance_status}`)}
                    </Label>
                  </Stack>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {entry.class_name}
                  </Typography>
                  {entry.problems.length === 0 ? (
                    <Typography variant="body2" sx={{ color: 'success.main' }}>
                      {t('ticket.allGood')}
                    </Typography>
                  ) : (
                    <Stack spacing={0.5} alignItems="flex-start">
                      {entry.problems.map((p) => (
                        <Typography key={p} variant="body2" sx={{ color: 'warning.main' }}>
                          • {t(`problems.${p}`)}
                        </Typography>
                      ))}
                      <Button
                        size="small"
                        component={RouterLink}
                        href={paths.dashboard.dogs.details(entry.dog_id)}
                      >
                        {t('ticket.toDocuments')}
                      </Button>
                    </Stack>
                  )}
                </Stack>
              ))}
            </Stack>
          </Card>
        </Stack>
      )}

      {ticket && (
        <Dialog fullScreen open={fullscreen} onClose={() => setFullscreen(false)}>
          <Box
            onClick={() => setFullscreen(false)}
            sx={{
              height: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              bgcolor: 'common.white',
              color: 'common.black',
              gap: 3,
              p: 2,
            }}
          >
            <QRCodeSVG
              value={ticket.token}
              level="M"
              marginSize={2}
              style={{ width: 'min(90vw, 90vh)', height: 'auto' }}
            />
            <Typography variant="h6">{name}</Typography>
            <Button variant="outlined" color="inherit">
              {t('ticket.close')}
            </Button>
          </Box>
        </Dialog>
      )}
    </DashboardContent>
  );
}
