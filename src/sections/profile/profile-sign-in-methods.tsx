'use client';

import type { TFunction } from 'i18next';
import type { IMe } from 'src/actions/account';

import * as z from 'zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MuiOtpInput } from 'mui-one-time-password-input';
import { useBoolean, useCountdownSeconds } from 'minimal-shared/hooks';
import { formatPhoneNumberIntl } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';
import {
  addEmailLogin,
  sendReauthCode,
  verifyLinkPhone,
  sendLinkPhoneCode,
} from 'src/actions/account';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';
import { passwordPolicy } from 'src/auth/password-policy';
import { PhoneOtpForm } from 'src/auth/components/phone-otp-form';
import {
  otpCodeSchema,
  OTP_CODE_LENGTH,
  resolveOtpErrorKey,
  OTP_RESEND_SECONDS,
} from 'src/auth/phone';

// ----------------------------------------------------------------------
// Способы входа в профиле: телефон (основной) и почта (дополнительный).

type Translate = TFunction<['profile', 'auth', 'common']>;

export function getEmailLoginSchema(t: Translate) {
  return z
    .object({
      email: schemaUtils.email({
        error: {
          required: t('profile:validation.emailRequired'),
          invalid: t('profile:validation.emailInvalid'),
        },
      }),
      password: passwordPolicy({
        min: t('profile:validation.passwordMin'),
        max: t('profile:validation.passwordMax'),
        bytes: t('profile:validation.passwordBytes'),
      }),
      confirm_password: z
        .string()
        .min(1, { error: t('profile:validation.confirmPasswordRequired') }),
    })
    .refine((val) => val.password === val.confirm_password, {
      error: t('profile:validation.passwordMismatch'),
      path: ['confirm_password'],
    });
}

export type EmailLoginSchemaType = z.infer<ReturnType<typeof getEmailLoginSchema>>;

// ----------------------------------------------------------------------

type CardProps = { me: IMe };

export function PhoneCard({ me }: CardProps) {
  const { t } = useTranslate(['profile', 'auth', 'common']);
  const { checkUserSession } = useAuthContext();

  const linked = !!me.phone && me.is_phone_verified;

  const handleVerified = async () => {
    toast.success(t('profile:security.phone.linked'));
    // Обновить пользователя в auth-контексте: баннер «привяжите телефон»
    // в дашборде читает его оттуда.
    await checkUserSession?.();
  };

  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6">{t('profile:security.phone.heading')}</Typography>
          {linked && <Label color="success">{t('profile:security.phone.verified')}</Label>}
        </Box>

        {linked ? (
          <>
            <Typography variant="subtitle1">{formatPhoneNumberIntl(me.phone!) || me.phone}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('profile:security.phone.changeHint')}
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('profile:security.phone.linkDescription')}
            </Typography>
            <Box sx={{ maxWidth: 480 }}>
              <PhoneOtpForm
                submitLabel={t('profile:security.phone.submit')}
                sendCode={sendLinkPhoneCode}
                verifyCode={verifyLinkPhone}
                onVerified={handleVerified}
              />
            </Box>
          </>
        )}
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

/**
 * Подключение входа по почте к аккаунту, созданному по телефону. Текущего
 * пароля нет, поэтому действие подтверждается свежим SMS-кодом на номер
 * аккаунта. Пароль ставится сразу, а вход по почте заработает после перехода
 * по ссылке из письма.
 */
export function EmailLoginCard({ me }: CardProps) {
  const { t } = useTranslate(['profile', 'auth', 'common']);

  const showPassword = useBoolean();
  const countdown = useCountdownSeconds(OTP_RESEND_SECONDS);

  // null — шаг 1 (email + пароль), иначе — шаг 2 (ввод кода) для этих данных.
  const [pending, setPending] = useState<EmailLoginSchemaType | null>(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Код уже ушёл в этой карточке: повторный запрос в пределах cooldown
  // вернёт 429, но прежний код действует — ведём к его вводу.
  const [codeSent, setCodeSent] = useState(false);

  const EmailLoginSchema = useMemo(() => getEmailLoginSchema(t), [t]);
  const CodeSchema = useMemo(
    () =>
      otpCodeSchema({
        required: t('auth:validation.codeRequired'),
        invalid: t('auth:validation.codeInvalid'),
      }),
    [t]
  );

  const methods = useForm<EmailLoginSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(EmailLoginSchema),
    defaultValues: { email: me.pending_email ?? '', password: '', confirm_password: '' },
  });

  const sendCode = async () => {
    await sendReauthCode();
    setCodeSent(true);
    countdown.reset();
    countdown.start();
  };

  const errorKey = (error: unknown) =>
    resolveOtpErrorKey(error, { on422: 'auth:errors.emailLoginInvalid' });

  const onRequestCode = methods.handleSubmit(async (data) => {
    try {
      await sendCode();
    } catch (error) {
      const key = errorKey(error);
      if (!(key === 'auth:errors.tooManyCodes' && codeSent)) {
        toast.error(t(key));
        return;
      }
      toast.info(t('auth:phone.codeStillValid'));
    }
    setCode('');
    setCodeError(null);
    setPending(data);
  });

  const handleResend = async () => {
    try {
      await sendCode();
      setCode('');
    } catch (error) {
      toast.error(t(errorKey(error)));
    }
  };

  const handleConfirm = async () => {
    if (!pending) return;
    const parsed = CodeSchema.safeParse(code);
    if (!parsed.success) {
      setCodeError(parsed.error.issues[0]?.message ?? null);
      return;
    }
    setSubmitting(true);
    setCodeError(null);
    try {
      const res = await addEmailLogin({
        email: pending.email,
        password: pending.password,
        code,
      });
      toast.success(res.message || t('profile:security.emailLogin.requested'));
      methods.reset({ email: pending.email, password: '', confirm_password: '' });
      setPending(null);
    } catch (error) {
      const key = errorKey(error);
      if (key === 'auth:errors.invalidCode' || key === 'auth:errors.codeExpired') {
        setCodeError(t(key));
      } else {
        toast.error(t(key));
        setPending(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const passwordAdornment = (
    <InputAdornment position="end">
      <IconButton onClick={showPassword.onToggle} edge="end">
        <Iconify icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
      </IconButton>
    </InputAdornment>
  );

  const canUsePhone = !!me.phone && me.is_phone_verified;

  return (
    <Form methods={methods} onSubmit={onRequestCode}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Typography variant="h6">{t('profile:security.emailLogin.heading')}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('profile:security.emailLogin.description')}
          </Typography>

          {!!me.pending_email && (
            <Alert severity="info">
              {t('profile:security.emailLogin.pending', { email: me.pending_email })}
            </Alert>
          )}

          {!canUsePhone && (
            <Alert severity="warning">{t('profile:security.emailLogin.phoneFirst')}</Alert>
          )}

          <Field.Text
            name="email"
            label={t('profile:security.emailLogin.fields.email')}
            disabled={!!pending}
          />
          <Field.Text
            name="password"
            label={t('profile:security.emailLogin.fields.password')}
            helperText={t('profile:security.password.fields.newPasswordHelper')}
            type={showPassword.value ? 'text' : 'password'}
            disabled={!!pending}
            slotProps={{ input: { endAdornment: passwordAdornment } }}
          />
          <Field.Text
            name="confirm_password"
            label={t('profile:security.emailLogin.fields.confirmPassword')}
            type={showPassword.value ? 'text' : 'password'}
            disabled={!!pending}
          />

          {pending ? (
            <Stack spacing={2}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('profile:security.emailLogin.codeSent', {
                  phone: formatPhoneNumberIntl(me.phone ?? '') || me.phone,
                })}
              </Typography>
              <Box sx={{ maxWidth: 400 }}>
                <MuiOtpInput
                  autoFocus
                  gap={1.5}
                  length={OTP_CODE_LENGTH}
                  value={code}
                  onChange={setCode}
                  TextFieldsProps={{ placeholder: '-', error: !!codeError }}
                />
                {!!codeError && <FormHelperText error>{codeError}</FormHelperText>}
              </Box>
              <Box sx={{ gap: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                <Button variant="contained" loading={submitting} onClick={handleConfirm}>
                  {t('profile:security.emailLogin.submit')}
                </Button>
                <Button variant="text" color="inherit" onClick={() => setPending(null)}>
                  {t('profile:security.emailLogin.back')}
                </Button>
                {countdown.isCounting ? (
                  <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                    {t('auth:phone.resendIn', { seconds: countdown.value })}
                  </Typography>
                ) : (
                  <Link component="button" type="button" variant="subtitle2" onClick={handleResend}>
                    {t('auth:phone.resend')}
                  </Link>
                )}
              </Box>
            </Stack>
          ) : (
            <Button
              type="submit"
              variant="contained"
              disabled={!canUsePhone}
              loading={methods.formState.isSubmitting}
              sx={{ ml: 'auto' }}
            >
              {t('profile:security.emailLogin.sendCode')}
            </Button>
          )}
        </Stack>
      </Card>
    </Form>
  );
}
