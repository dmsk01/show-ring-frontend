'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useRef, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCountdownSeconds } from 'minimal-shared/hooks';
import { formatPhoneNumberIntl } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

import { Form, Field } from 'src/components/hook-form';

import { sendPhoneCode } from '../context/jwt';
import {
  phoneSchema,
  otpCodeSchema,
  OTP_CODE_LENGTH,
  resolveOtpErrorKey,
  OTP_RESEND_SECONDS,
} from '../phone';

// ----------------------------------------------------------------------
// Двухшаговая форма подтверждения телефона: номер → код из SMS.
// Используется для входа/регистрации (по умолчанию шлёт /auth/send-code) и
// для привязки номера в профиле (свои sendCode/verifyCode).

type PhoneOtpFormProps<T> = {
  /** Текст кнопки подтверждения кода: «Войти», «Зарегистрироваться», «Привязать». */
  submitLabel: string;
  sendCode?: (phone: string) => Promise<unknown>;
  verifyCode: (phone: string, code: string) => Promise<T>;
  onVerified: (result: T, phone: string) => Promise<void> | void;
  /** Под формой номера (согласие с условиями, подсказки). */
  phoneFooter?: React.ReactNode;
};

export function PhoneOtpForm<T>({
  submitLabel,
  sendCode = sendPhoneCode,
  verifyCode,
  onVerified,
  phoneFooter,
}: PhoneOtpFormProps<T>) {
  const { t } = useTranslate(['auth']);

  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  // Номер, на который код уже ушёл: повторный ввод того же номера в пределах
  // cooldown вернёт 429 — но прежний код всё ещё действует, ведём к его вводу.
  const lastSentPhone = useRef<string | null>(null);

  const countdown = useCountdownSeconds(OTP_RESEND_SECONDS);

  const PhoneSchema = useMemo(
    () =>
      z.object({
        phone: phoneSchema({
          required: t('auth:validation.phoneRequired'),
          invalid: t('auth:validation.phoneInvalid'),
        }),
      }),
    [t]
  );

  const CodeSchema = useMemo(
    () =>
      z.object({
        code: otpCodeSchema({
          required: t('auth:validation.codeRequired'),
          invalid: t('auth:validation.codeInvalid'),
        }),
      }),
    [t]
  );

  const phoneMethods = useForm<z.infer<typeof PhoneSchema>>({
    resolver: zodResolver(PhoneSchema),
    defaultValues: { phone: '' },
  });

  const codeMethods = useForm<z.infer<typeof CodeSchema>>({
    resolver: zodResolver(CodeSchema),
    defaultValues: { code: '' },
  });

  const goToCodeStep = (nextPhone: string) => {
    setPhone(nextPhone);
    setStep('code');
    codeMethods.reset({ code: '' });
  };

  const restartCountdown = () => {
    countdown.reset();
    countdown.start();
  };

  const onSubmitPhone = phoneMethods.handleSubmit(async (data) => {
    setErrorMessage(null);
    setInfoMessage(null);
    try {
      await sendCode(data.phone);
      lastSentPhone.current = data.phone;
      goToCodeStep(data.phone);
      restartCountdown();
    } catch (error) {
      const key = resolveOtpErrorKey(error);
      if (key === 'auth:errors.tooManyCodes' && lastSentPhone.current === data.phone) {
        setInfoMessage(t('auth:phone.codeStillValid'));
        goToCodeStep(data.phone);
        return;
      }
      setErrorMessage(t(key));
    }
  });

  const onSubmitCode = codeMethods.handleSubmit(async (data) => {
    setErrorMessage(null);
    setInfoMessage(null);
    try {
      const result = await verifyCode(phone, data.code);
      await onVerified(result, phone);
    } catch (error) {
      const key = resolveOtpErrorKey(error);
      // Код истёк/сожжён попытками — вводить его заново бессмысленно.
      if (key === 'auth:errors.codeExpired') codeMethods.reset({ code: '' });
      setErrorMessage(t(key));
    }
  });

  const handleResend = async () => {
    if (countdown.isCounting || resending) return;
    setErrorMessage(null);
    setInfoMessage(null);
    setResending(true);
    try {
      await sendCode(phone);
      codeMethods.reset({ code: '' });
      setInfoMessage(t('auth:phone.codeResent'));
      restartCountdown();
    } catch (error) {
      setErrorMessage(t(resolveOtpErrorKey(error)));
    } finally {
      setResending(false);
    }
  };

  const handleChangePhone = () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setStep('phone');
  };

  const renderMessages = () => (
    <>
      {!!errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      {!!infoMessage && <Alert severity="info">{infoMessage}</Alert>}
    </>
  );

  if (step === 'phone') {
    return (
      <Form methods={phoneMethods} onSubmit={onSubmitPhone}>
        <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
          {renderMessages()}

          <Field.Phone
            name="phone"
            label={t('auth:phone.label')}
            placeholder={t('auth:phone.placeholder')}
            defaultCountry="RU"
          />

          <Button
            fullWidth
            color="inherit"
            size="large"
            type="submit"
            variant="contained"
            loading={phoneMethods.formState.isSubmitting}
            loadingIndicator={t('auth:phone.sendingCode')}
          >
            {t('auth:phone.sendCode')}
          </Button>

          {phoneFooter}
        </Box>
      </Form>
    );
  }

  return (
    <Form methods={codeMethods} onSubmit={onSubmitCode}>
      <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
        {renderMessages()}

        <Box sx={{ gap: 0.5, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('auth:phone.codeSentTo', { phone: formatPhoneNumberIntl(phone) || phone })}
          </Typography>
          <Link
            component="button"
            type="button"
            variant="subtitle2"
            onClick={handleChangePhone}
            sx={{ alignSelf: 'flex-start' }}
          >
            {t('auth:phone.changePhone')}
          </Link>
        </Box>

        <Field.Code name="code" length={OTP_CODE_LENGTH} />

        <Button
          fullWidth
          color="inherit"
          size="large"
          type="submit"
          variant="contained"
          loading={codeMethods.formState.isSubmitting}
          loadingIndicator={t('auth:phone.verifying')}
        >
          {submitLabel}
        </Button>

        <Box sx={{ typography: 'body2', alignSelf: 'center' }}>
          {countdown.isCounting ? (
            <Box component="span" sx={{ color: 'text.disabled' }}>
              {t('auth:phone.resendIn', { seconds: countdown.value })}
            </Box>
          ) : (
            <Link
              component="button"
              type="button"
              variant="subtitle2"
              onClick={handleResend}
              disabled={resending}
            >
              {t('auth:phone.resend')}
            </Link>
          )}
        </Box>
      </Box>
    </Form>
  );
}
