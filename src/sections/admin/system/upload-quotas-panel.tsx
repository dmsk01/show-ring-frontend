'use client';

import type { UploadTier, IUploadQuota } from 'src/actions/upload-quota';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { bytesToMb, mbToBytes, isValidQuota } from 'src/utils/quota';

import { useTranslate } from 'src/locales';
import { updateUploadQuota } from 'src/actions/upload-quota';

import { toast } from 'src/components/snackbar';
import { Scrollbar } from 'src/components/scrollbar';
import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

type RowProps = { quota: IUploadQuota };

function QuotaRow({ quota }: RowProps) {
  const { t } = useTranslate('admin');
  const [daily, setDaily] = useState(String(quota.daily_limit));
  const [mb, setMb] = useState(String(bytesToMb(quota.max_storage_bytes)));
  const [saving, setSaving] = useState(false);

  const dailyN = Number(daily);
  const bytes = mbToBytes(Number(mb));
  const valid = isValidQuota(dailyN, bytes);
  const dirty = dailyN !== quota.daily_limit || bytes !== quota.max_storage_bytes;

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await updateUploadQuota(quota.tier as UploadTier, {
        daily_limit: dailyN,
        max_storage_bytes: bytes,
      });
      toast.success(t('system.quotas.saved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('system.quotas.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <TableRow>
      <TableCell>{t(`system.quotas.tiers.${quota.tier}`)}</TableCell>
      <TableCell>
        <TextField
          type="number"
          size="small"
          value={daily}
          onChange={(e) => setDaily(e.target.value)}
          error={!!daily && dailyN <= 0}
          sx={{ width: 140 }}
        />
      </TableCell>
      <TableCell>
        <TextField
          type="number"
          size="small"
          value={mb}
          onChange={(e) => setMb(e.target.value)}
          error={!!mb && Number(mb) <= 0}
          sx={{ width: 140 }}
        />
      </TableCell>
      <TableCell align="right">
        <Button variant="outlined" disabled={!valid || !dirty} loading={saving} onClick={handleSave}>
          {t('system.quotas.save')}
        </Button>
      </TableCell>
    </TableRow>
  );
}

// ----------------------------------------------------------------------

type Props = { quotas: IUploadQuota[]; loading: boolean };

export function UploadQuotasPanel({ quotas, loading }: Props) {
  const { t } = useTranslate('admin');

  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        <Typography variant="h6">{t('system.quotas.heading')}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('system.quotas.description')}
        </Typography>
      </Stack>

      {loading ? (
        <LoadingScreen />
      ) : (
        <Scrollbar>
          <Box sx={{ minWidth: 560 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('system.quotas.columns.tier')}</TableCell>
                  <TableCell>{t('system.quotas.columns.dailyLimit')}</TableCell>
                  <TableCell>{t('system.quotas.columns.maxStorageMb')}</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {quotas.map((quota) => (
                  <QuotaRow key={quota.tier} quota={quota} />
                ))}
              </TableBody>
            </Table>
          </Box>
        </Scrollbar>
      )}
    </Card>
  );
}
