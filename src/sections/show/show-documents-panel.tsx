'use client';

import type { OfficialKind } from 'src/actions/document';
import type { IconifyName } from 'src/components/iconify';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { usePermissions } from 'src/hooks/use-permissions';

import { useGetShowRings } from 'src/actions/show-result';
import { useGetTask, downloadTask, generateOfficial } from 'src/actions/document';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type GeneratedTask = { id: string; label: string; filename: string };

const STATUS_COLOR = {
  pending: 'warning',
  processing: 'info',
  done: 'success',
  failed: 'error',
} as const;

function TaskItem({ task }: { task: GeneratedTask }) {
  const { status } = useGetTask(task.id);

  const handleDownload = async () => {
    try {
      await downloadTask(task.id, task.filename);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось скачать');
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        gap: 2,
        display: 'flex',
        alignItems: 'center',
        borderRadius: 1,
        border: (theme) => `solid 1px ${theme.vars.palette.divider}`,
      }}
    >
      <Iconify icon="solar:file-text-bold" width={24} />
      <Typography variant="subtitle2" sx={{ flex: 1 }}>
        {task.label}
      </Typography>
      <Label color={status ? STATUS_COLOR[status] : 'default'}>{status ?? 'pending'}</Label>
      <Button
        size="small"
        variant="outlined"
        color="inherit"
        disabled={status !== 'done'}
        startIcon={<Iconify icon="solar:download-bold" />}
        onClick={handleDownload}
      >
        Скачать
      </Button>
    </Box>
  );
}

const OFFICIAL_BUTTONS: { kind: OfficialKind; label: string; icon: IconifyName }[] = [
  { kind: 'catalog', label: 'Каталог', icon: 'solar:bill-list-bold' },
  { kind: 'diplomas', label: 'Дипломы', icon: 'solar:cup-star-bold' },
  { kind: 'certificates', label: 'Сертификаты', icon: 'solar:file-check-bold-duotone' },
];

type Props = { showId: string };

export function ShowDocumentsPanel({ showId }: Props) {
  const { can } = usePermissions();
  const canGenerate = can('documents:create');
  const { rings } = useGetShowRings(showId);

  const [tasks, setTasks] = useState<GeneratedTask[]>([]);
  const [busy, setBusy] = useState(false);
  const [ringId, setRingId] = useState('');

  const run = async (kind: OfficialKind, label: string, ring?: string) => {
    setBusy(true);
    try {
      const task = await generateOfficial(showId, kind, ring);
      setTasks((prev) => [{ id: task.id, label, filename: `${kind}-${showId}.docx` }, ...prev]);
      toast.success('Генерация запущена');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось запустить генерацию');
    } finally {
      setBusy(false);
    }
  };

  if (!canGenerate) return null;

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Документы выставки
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
        {OFFICIAL_BUTTONS.map((b) => (
          <Button
            key={b.kind}
            variant="contained"
            color="inherit"
            loading={busy}
            startIcon={<Iconify icon={b.icon} />}
            onClick={() => run(b.kind, b.label)}
          >
            {b.label}
          </Button>
        ))}
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          select
          size="small"
          label="Ринг"
          value={ringId}
          onChange={(e) => setRingId(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">—</MenuItem>
          {rings.map((r) => (
            <MenuItem key={r.id} value={r.id}>
              Ринг {r.ring_number}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="outlined"
          color="inherit"
          loading={busy}
          disabled={!ringId}
          startIcon={<Iconify icon="solar:notebook-bold-duotone" />}
          onClick={() => run('ring-sheets', `Ринг-лист (ринг ${ringId})`, ringId)}
        >
          Ринг-листы
        </Button>
      </Stack>

      {tasks.length ? (
        <Stack spacing={1.5}>
          {tasks.map((task, i) => (
            <TaskItem key={`${task.id}-${i}`} task={task} />
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
          Документы ещё не сгенерированы. Используйте кнопки выше.
        </Typography>
      )}
    </Card>
  );
}
