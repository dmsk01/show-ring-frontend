'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { usePermissions } from 'src/hooks/use-permissions';

import { useGetShow } from 'src/actions/show';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetTask, downloadTask, generateCatalog, generateDiplomas } from 'src/actions/document';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

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
      toast.error(error instanceof Error ? error.message : 'Download failed');
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
        Download
      </Button>
    </Box>
  );
}

type Props = { id: string };

export function ShowDocumentsView({ id }: Props) {
  const { show } = useGetShow(id);
  const { can } = usePermissions();
  const canGenerate = can('shows:edit');

  const [tasks, setTasks] = useState<GeneratedTask[]>([]);
  const [busy, setBusy] = useState(false);

  const runGenerate = async (
    kind: 'catalog' | 'diplomas',
    generate: (showId: string) => Promise<{ id: string; status: string }>
  ) => {
    setBusy(true);
    try {
      const task = await generate(id);
      setTasks((prev) => [
        { id: task.id, label: kind === 'catalog' ? 'Catalog' : 'Diplomas', filename: `${kind}-${id}.pdf` },
        ...prev,
      ]);
      toast.success('Generation started');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start generation');
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={show ? `Documents — ${show.name}` : 'Documents'}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Shows', href: paths.dashboard.shows.root },
          { name: 'Documents' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <Button
            variant="contained"
            loading={busy}
            disabled={!canGenerate}
            startIcon={<Iconify icon="solar:bill-list-bold" />}
            onClick={() => runGenerate('catalog', generateCatalog)}
          >
            Generate catalog
          </Button>
          <Button
            variant="contained"
            color="inherit"
            loading={busy}
            disabled={!canGenerate}
            startIcon={<Iconify icon="solar:cup-star-bold" />}
            onClick={() => runGenerate('diplomas', generateDiplomas)}
          >
            Generate diplomas
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
            No documents generated yet. Use the buttons above to start a generation task.
          </Typography>
        )}
      </Card>
    </DashboardContent>
  );
}
