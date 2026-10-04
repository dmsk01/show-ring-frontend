'use client';

import type { IEntryCard, IParticipantCard } from 'src/types/checkin';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { useGetShow } from 'src/actions/show';
import { DashboardContent } from 'src/layouts/dashboard';
import { scanTicket, errorDetail, searchCheckin, useCheckinSummary } from 'src/actions/checkin';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { EntryCheckCard } from '../entry-check-card';
import { QrScannerDialog } from '../qr-scanner-dialog';
import { scanErrorKey, isDeskAvailable } from '../checkin-utils';

// ----------------------------------------------------------------------

type Props = { id: string };

const SUMMARY_KEYS = ['registered', 'arrived', 'admitted', 'rejected', 'absent'] as const;
const SEARCH_DEBOUNCE_MS = 400;

export function CheckinDeskView({ id }: Props) {
  const { t } = useTranslate(['checkin', 'common']);
  const { show, showLoading } = useGetShow(id);
  const { summary } = useCheckinSummary(show?.checkin_enabled ? id : undefined);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [participant, setParticipant] = useState<IParticipantCard | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IEntryCard[] | null>(null);

  // Поиск с задержкой: не дёргаем API на каждую букву (и rate limit).
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults(null);
      return undefined;
    }
    const timer = setTimeout(async () => {
      try {
        setResults(await searchCheckin(id, q));
        setParticipant(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('desk.errors.generic'));
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [id, query, t]);

  if (showLoading) return <LoadingScreen />;
  if (!show) return <DashboardContent>{t('desk.headingFallback')}</DashboardContent>;

  const canMark = isDeskAvailable(show);

  const onScan = async (text: string) => {
    setScannerOpen(false);
    try {
      setParticipant(await scanTicket(id, text));
      setResults(null);
      setQuery('');
    } catch (error) {
      toast.error(t(scanErrorKey(errorDetail(error))));
    }
  };

  // Обновлённая карточка после отметки — подменяем в текущем результате.
  const replaceCard = (card: IEntryCard) => {
    setParticipant((p) =>
      p ? { ...p, entries: p.entries.map((e) => (e.entry_id === card.entry_id ? card : e)) } : p
    );
    setResults((r) => (r ? r.map((e) => (e.entry_id === card.entry_id ? card : e)) : r));
  };

  const cards = participant?.entries ?? results ?? [];

  return (
    <DashboardContent maxWidth="md">
      <CustomBreadcrumbs
        heading={t('desk.heading', { name: show.name })}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('staffShows.title'), href: paths.dashboard.checkin },
          { name: show.name },
        ]}
        sx={{ mb: 3 }}
      />

      {!canMark && (
        <Typography variant="body2" sx={{ color: 'warning.main', mb: 2 }}>
          {t('desk.notAvailable')}
        </Typography>
      )}

      {summary && (
        <Card sx={{ p: 2, mb: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gap: 1,
              gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(6, 1fr)' },
              textAlign: 'center',
            }}
          >
            <Box>
              <Typography variant="h5">{summary.total}</Typography>
              <Typography variant="caption">{t('desk.summary.total')}</Typography>
            </Box>
            {SUMMARY_KEYS.map((k) => (
              <Box key={k}>
                <Typography variant="h5">{summary[k]}</Typography>
                <Typography variant="caption">{t(`desk.summary.${k}`)}</Typography>
              </Box>
            ))}
          </Box>
        </Card>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Button
          size="large"
          variant="contained"
          disabled={!canMark}
          startIcon={<Iconify icon="solar:camera-add-bold" />}
          onClick={() => setScannerOpen(true)}
          sx={{ flexShrink: 0 }}
        >
          {t('desk.scan')}
        </Button>
        <TextField
          fullWidth
          disabled={!canMark}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('desk.searchPlaceholder')}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>

      {participant && (
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          {participant.display_name}
          {participant.phone ? ` · ${participant.phone}` : ''}
        </Typography>
      )}

      {results && results.length === 0 ? (
        <EmptyContent filled title={t('desk.noResults')} sx={{ py: 6 }} />
      ) : (
        <Stack spacing={2}>
          {cards.map((card) => (
            <EntryCheckCard
              key={card.entry_id}
              showId={id}
              card={card}
              canMark={canMark}
              onChanged={replaceCard}
            />
          ))}
        </Stack>
      )}

      <QrScannerDialog open={scannerOpen} onClose={() => setScannerOpen(false)} onResult={onScan} />
    </DashboardContent>
  );
}
