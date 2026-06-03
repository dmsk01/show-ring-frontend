'use client';

import type { IShowResult } from 'src/types/show-result';

import useSWR from 'swr';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Container from '@mui/material/Container';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { useGetShow } from 'src/actions/show';
import { fetcher, endpoints } from 'src/lib/axios';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

const STATUS_LABEL: Record<string, string> = {
  registration_open: 'Регистрация открыта',
  registration_closed: 'Регистрация закрыта',
  in_progress: 'Идёт',
  completed: 'Завершена',
};

const AWARD_FLAGS: { key: keyof IShowResult; label: string }[] = [
  { key: 'is_class_winner', label: 'CW' },
  { key: 'is_best_male', label: 'BM' },
  { key: 'is_best_female', label: 'BF' },
  { key: 'is_best_of_breed', label: 'BOB' },
  { key: 'is_best_in_group', label: 'BIG' },
  { key: 'is_best_in_show', label: 'BIS' },
];

type Props = { id: string };

export function ShowPublicDetailView({ id }: Props) {
  const { show, showLoading } = useGetShow(id);

  const isCompleted = show?.status === 'completed';
  const { data: results } = useSWR<IShowResult[]>(
    isCompleted ? endpoints.show.results(id) : null,
    fetcher
  );

  if (showLoading) return <LoadingScreen />;
  if (!show) {
    return (
      <Container sx={{ pt: { xs: 8, md: 12 }, pb: 10 }}>
        <Typography>Выставка не найдена.</Typography>
      </Container>
    );
  }

  const overview = [
    {
      label: 'Даты',
      value: show.date_end
        ? `${fDate(show.date_start)} – ${fDate(show.date_end)}`
        : fDate(show.date_start),
    },
    { label: 'Город', value: [show.city, show.country].filter(Boolean).join(', ') || '—' },
    { label: 'Площадка', value: show.venue ?? '—' },
    { label: 'Взнос', value: show.entry_fee != null ? fCurrency(show.entry_fee) : '—' },
    {
      label: 'Дедлайн регистрации',
      value: show.registration_deadline ? fDate(show.registration_deadline) : '—',
    },
  ];

  return (
    <Container sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 } }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {show.name}
        </Typography>
        <Label color={isCompleted ? 'default' : 'success'}>
          {STATUS_LABEL[show.status] ?? show.status}
        </Label>
      </Stack>

      <Card sx={{ p: 3, mb: 5 }}>
        <Box
          sx={{
            gap: 3,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
          }}
        >
          {overview.map((item) => (
            <ListItemText
              key={item.label}
              primary={item.label}
              secondary={item.value}
              slotProps={{
                primary: { sx: { typography: 'body2', color: 'text.secondary' } },
                secondary: { sx: { mt: 0.5, typography: 'subtitle2', color: 'text.primary' } },
              }}
            />
          ))}
        </Box>

        {show.description && (
          <>
            <Divider sx={{ borderStyle: 'dashed', my: 3 }} />
            <Typography variant="body2">{show.description}</Typography>
          </>
        )}
      </Card>

      {isCompleted && (
        <>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Результаты
          </Typography>
          <Card>
            <Scrollbar>
              <Table sx={{ minWidth: 480 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Место</TableCell>
                    <TableCell>Оценка</TableCell>
                    <TableCell>Награды</TableCell>
                    <TableCell>Замечания</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(results ?? []).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.placement ?? '—'}</TableCell>
                      <TableCell>{r.grade_id ?? '—'}</TableCell>
                      <TableCell>
                        <Box sx={{ gap: 0.5, display: 'flex', flexWrap: 'wrap' }}>
                          {AWARD_FLAGS.filter((f) => r[f.key]).map((f) => (
                            <Label key={f.label} color="success">
                              {f.label}
                            </Label>
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>{r.critique ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                  {(!results || results.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary' }}>
                        Результаты пока не опубликованы.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Scrollbar>
          </Card>
        </>
      )}
    </Container>
  );
}
