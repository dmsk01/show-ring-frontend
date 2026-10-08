'use client';

import { useState } from 'react';

import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { grantConsents, useGetMyConsents } from 'src/actions/consent';

import { useAuthContext } from 'src/auth/hooks';
import { signOut } from 'src/auth/context/jwt/action';

// ----------------------------------------------------------------------

/**
 * Запрос недостающих согласий у вошедшего пользователя: аккаунты,
 * созданные до введения журнала согласий, и все — после новой редакции
 * документов (бэкенд отдаёт их в `missing`). Закрыть диалог нельзя —
 * только принять или выйти: без договора и согласия работать с данными
 * пользователя мы не можем.
 */
export function ConsentGate() {
  const { t } = useTranslate('legal');
  const router = useRouter();
  const { authenticated, checkUserSession } = useAuthContext();
  const { consents } = useGetMyConsents(authenticated);

  const [personalData, setPersonalData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const missing = consents?.missing ?? [];
  if (!authenticated || missing.length === 0) return null;

  const needsPersonalData = missing.includes('personal_data');
  const canAccept = !needsPersonalData || personalData;

  const handleAccept = async () => {
    setSaving(true);
    setError(null);
    try {
      await grantConsents(missing);
    } catch {
      setError(t('gate.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    await checkUserSession?.();
    router.refresh();
  };

  const docLink = (href: string, label: string) => (
    <Link href={href} target="_blank" rel="noopener" underline="always" color="text.primary">
      {label}
    </Link>
  );

  return (
    <Dialog open maxWidth="xs" fullWidth aria-labelledby="consent-gate-title">
      <DialogTitle id="consent-gate-title">{t('gate.title')}</DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('gate.description')}
        </Typography>

        {missing.includes('terms') && (
          <Typography variant="body2">
            {t('gate.termsPrefix')}
            {docLink(paths.legal.terms, t('gate.terms'))}
            {t('gate.termsSuffix')}
          </Typography>
        )}

        {needsPersonalData && (
          <FormControlLabel
            sx={{ alignItems: 'flex-start', mx: 0 }}
            control={
              <Checkbox
                size="small"
                checked={personalData}
                onChange={(event) => setPersonalData(event.target.checked)}
                sx={{ pt: 0.25 }}
              />
            }
            label={
              <Typography variant="body2">
                {t('gate.personalDataPrefix')}
                {docLink(paths.legal.consent, t('gate.personalData'))}
              </Typography>
            }
          />
        )}

        {!!error && <Alert severity="error">{error}</Alert>}
      </DialogContent>

      <DialogActions>
        <Button color="inherit" onClick={handleSignOut}>
          {t('gate.signOut')}
        </Button>
        <Button variant="contained" disabled={!canAccept} loading={saving} onClick={handleAccept}>
          {t('gate.accept')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
