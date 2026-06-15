'use client';

import { useState } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales';
import { setFeatureFlag, useFeatureFlagsQuery } from 'src/actions/feature-flag';

import { toast } from 'src/components/snackbar';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

type FlagRowProps = { name: string; enabled: boolean };

function FlagRow({ name, enabled }: FlagRowProps) {
  const { t } = useTranslate('admin');
  const [saving, setSaving] = useState(false);

  const handleToggle = async (_e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setSaving(true);
    try {
      await setFeatureFlag(name, checked);
      toast.success(t('system.flags.updated'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('system.flags.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormControlLabel
      label={<Typography sx={{ fontFamily: 'monospace' }}>{name}</Typography>}
      labelPlacement="start"
      control={<Switch checked={enabled} disabled={saving} onChange={handleToggle} />}
      sx={{ ml: 0, justifyContent: 'space-between', width: 1 }}
    />
  );
}

// ----------------------------------------------------------------------

export function FeatureFlagsPanel() {
  const { t } = useTranslate('admin');
  const { flags, isLoading } = useFeatureFlagsQuery();

  const entries = Object.entries(flags);

  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        <Typography variant="h6">{t('system.flags.heading')}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('system.flags.description')}
        </Typography>
      </Stack>

      {isLoading ? (
        <LoadingScreen />
      ) : entries.length === 0 ? (
        <EmptyContent filled title={t('system.flags.empty')} sx={{ py: 6 }} />
      ) : (
        <Stack divider={<Divider />}>
          {entries.map(([name, enabled]) => (
            <FlagRow key={name} name={name} enabled={enabled} />
          ))}
        </Stack>
      )}
    </Card>
  );
}
