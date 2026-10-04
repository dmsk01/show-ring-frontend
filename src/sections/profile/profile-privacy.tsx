'use client';

import type { IMe } from 'src/actions/account';

import { useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import { sendReauthCode } from 'src/actions/account';
import { deleteMyAccount, useGetMyConsents, revokePersonalDataConsent } from 'src/actions/consent';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { useAuthContext } from 'src/auth/hooks';
import { signOut } from 'src/auth/context/jwt/action';
import { getErrorMessage } from 'src/auth/utils/error-message';

// ----------------------------------------------------------------------
// Права субъекта ПДн в личном кабинете (ст. 9, 14, 21 152-ФЗ): статус
// согласия с возможностью отзыва и удаление аккаунта.

export function ConsentsCard() {
  const { t } = useTranslate('legal');
  const { consents } = useGetMyConsents();
  const confirm = useBoolean();
  const [revoking, setRevoking] = useState(false);

  const personalData = consents?.active.find(
    (c) => c.kind === 'personal_data' && c.target_id === null
  );

  const handleRevoke = async () => {
    setRevoking(true);
    try {
      await revokePersonalDataConsent();
      toast.success(t('consents.revoked'));
      confirm.onFalse();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setRevoking(false);
    }
  };

  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6">{t('consents.title')}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('consents.subheader')}
          </Typography>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
        >
          <Box>
            <Typography variant="subtitle2">{t('consents.personalData')}</Typography>
            {personalData ? (
              <Label color="success" sx={{ mt: 0.5 }}>
                {t('consents.givenAt', { date: fDate(personalData.granted_at) })}
              </Label>
            ) : (
              <Label color="default" sx={{ mt: 0.5 }}>
                {t('consents.notGiven')}
              </Label>
            )}
          </Box>
          {personalData && (
            <Button size="small" color="inherit" variant="outlined" onClick={confirm.onTrue}>
              {t('consents.revoke')}
            </Button>
          )}
        </Stack>

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('consents.publicHint')}
        </Typography>

        <Link component={RouterLink} href={paths.legal.privacy} variant="body2">
          {t('consents.documents')}
        </Link>
      </Stack>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title={t('consents.revokeTitle')}
        content={t('consents.revokeText')}
        action={
          <Button variant="contained" color="error" loading={revoking} onClick={handleRevoke}>
            {t('consents.revoke')}
          </Button>
        }
      />
    </Card>
  );
}

// ----------------------------------------------------------------------

const DELETE_ERROR_CODES = [
  'active_shows',
  'active_ad_campaigns',
  'invalid_password',
  'code_required',
  'invalid_code',
  'code_expired',
] as const;

export function DeleteAccountCard({ me }: { me: IMe }) {
  const { t } = useTranslate('legal');
  const router = useRouter();
  const { checkUserSession } = useAuthContext();
  const dialog = useBoolean();

  // Re-auth как на бэкенде: при подтверждённом телефоне — код, иначе пароль.
  const byCode = !!me.phone && me.is_phone_verified;

  const [secret, setSecret] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toMessage = (err: unknown) => {
    const raw = getErrorMessage(err);
    const code = DELETE_ERROR_CODES.find((c) => c === raw);
    return code ? t(`deletion.errors.${code}`) : t('deletion.errors.generic');
  };

  const handleClose = () => {
    dialog.onFalse();
    setSecret('');
    setError(null);
  };

  const handleSendCode = async () => {
    setError(null);
    try {
      await sendReauthCode();
      setCodeSent(true);
      toast.success(t('deletion.codeSent'));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteMyAccount(byCode ? { code: secret } : { password: secret });
      toast.success(t('deletion.done'));
      // Сессия на бэкенде уже недействительна: чистим куки и контекст.
      await signOut();
      await checkUserSession?.();
      router.replace('/');
    } catch (err) {
      setError(toMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h6">{t('deletion.title')}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('deletion.description')}
        </Typography>
        <Box>
          <Button variant="soft" color="error" onClick={dialog.onTrue}>
            {t('deletion.button')}
          </Button>
        </Box>
      </Stack>

      <Dialog open={dialog.value} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>{t('deletion.dialogTitle')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('deletion.description')}
          </Typography>

          {byCode && !codeSent ? (
            <>
              <Typography variant="body2">{t('deletion.codeHint')}</Typography>
              <Button variant="outlined" color="inherit" onClick={handleSendCode}>
                {t('deletion.sendCode')}
              </Button>
            </>
          ) : (
            <TextField
              autoFocus
              fullWidth
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              label={byCode ? t('deletion.codeLabel') : t('deletion.passwordLabel')}
              type={byCode ? 'text' : 'password'}
              slotProps={{
                htmlInput: byCode
                  ? { inputMode: 'numeric', autoComplete: 'one-time-code' }
                  : { autoComplete: 'current-password' },
              }}
            />
          )}

          {!!error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={handleClose}>
            {t('deletion.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            loading={busy}
            disabled={!secret}
            onClick={handleDelete}
          >
            {t('deletion.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
