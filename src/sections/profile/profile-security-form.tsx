'use client';

import type { TFunction } from 'i18next';

import * as z from 'zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { accountErrorMessage } from 'src/actions/account-errors';
import { updateMyEmail, updateMyPassword } from 'src/actions/account';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';
import { resetRevokedSession } from 'src/auth/context/jwt';

// ----------------------------------------------------------------------

export function getEmailSchema(t: TFunction<['profile', 'common']>) {
  return z.object({
    email: schemaUtils.email({
      error: {
        required: t('profile:validation.emailRequired'),
        invalid: t('profile:validation.emailInvalid'),
      },
    }),
    current_password: z
      .string()
      .min(1, { error: t('profile:validation.currentPasswordRequired') }),
  });
}

export type EmailSchemaType = z.infer<ReturnType<typeof getEmailSchema>>;

export function getPasswordSchema(t: TFunction<['profile', 'common']>) {
  return z
    .object({
      current_password: z
        .string()
        .min(1, { error: t('profile:validation.currentPasswordRequired') }),
      new_password: z
        .string()
        .min(8, { error: t('profile:validation.passwordMin') })
        .max(128, { error: t('profile:validation.passwordMax') }),
      confirm_password: z
        .string()
        .min(1, { error: t('profile:validation.confirmPasswordRequired') }),
    })
    .refine((val) => val.new_password === val.confirm_password, {
      error: t('profile:validation.passwordMismatch'),
      path: ['confirm_password'],
    })
    .refine((val) => val.new_password !== val.current_password, {
      error: t('profile:validation.passwordSameAsCurrent'),
      path: ['new_password'],
    });
}

export type PasswordSchemaType = z.infer<ReturnType<typeof getPasswordSchema>>;

// ----------------------------------------------------------------------

export function ProfileSecurityForm() {
  return (
    <Stack spacing={3}>
      <EmailCard />
      <PasswordCard />
    </Stack>
  );
}

// ----------------------------------------------------------------------

function EmailCard() {
  const { t } = useTranslate(['profile', 'common']);

  const EmailSchema = useMemo(() => getEmailSchema(t), [t]);

  const methods = useForm<EmailSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(EmailSchema),
    defaultValues: { email: '', current_password: '' },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await updateMyEmail(data);
      toast.success(res.message || t('profile:toast.emailChangeFallback'));
      reset();
    } catch (error) {
      console.error(error);
      toast.error(accountErrorMessage(error));
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Typography variant="h6">{t('profile:security.email.heading')}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('profile:security.email.description')}
          </Typography>

          <Field.Text name="email" label={t('profile:security.email.fields.newEmail')} />
          <Field.Text
            name="current_password"
            label={t('profile:security.email.fields.currentPassword')}
            type="password"
          />

          <Button type="submit" variant="contained" loading={isSubmitting} sx={{ ml: 'auto' }}>
            {t('profile:security.email.submit')}
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}

// ----------------------------------------------------------------------

function PasswordCard() {
  const { t } = useTranslate(['profile', 'common']);
  const router = useRouter();
  const { checkUserSession } = useAuthContext();

  const showCurrent = useBoolean();
  const showNew = useBoolean();
  const showConfirm = useBoolean();

  const PasswordSchema = useMemo(() => getPasswordSchema(t), [t]);

  const methods = useForm<PasswordSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(PasswordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await updateMyPassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });
      reset();
      // Бэкенд отозвал все refresh-токены (включая текущий) — локальные токены
      // мертвы. Сносим сессию и синхронизируем контекст ДО навигации: GuestGuard
      // на /auth/* редиректит ещё-«авторизованного» юзера обратно в дашборд,
      // поэтому порядок (сначала очистка, потом router.replace) обязателен.
      // AuthGuard защищённой страницы может успеть добавить свой returnTo на
      // неё же — это приемлемо: после повторного входа вернёмся сюда.
      await resetRevokedSession(checkUserSession);
      toast.success(res.message || t('profile:toast.passwordChanged'));
      router.replace(paths.auth.jwt.signIn);
    } catch (error) {
      console.error(error);
      toast.error(accountErrorMessage(error));
    }
  });

  const renderToggle = (field: ReturnType<typeof useBoolean>) => (
    <InputAdornment position="end">
      <IconButton onClick={field.onToggle} edge="end">
        <Iconify icon={field.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
      </IconButton>
    </InputAdornment>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Typography variant="h6">{t('profile:security.password.heading')}</Typography>

          <Field.Text
            name="current_password"
            label={t('profile:security.password.fields.currentPassword')}
            type={showCurrent.value ? 'text' : 'password'}
            slotProps={{ input: { endAdornment: renderToggle(showCurrent) } }}
          />
          <Field.Text
            name="new_password"
            label={t('profile:security.password.fields.newPassword')}
            type={showNew.value ? 'text' : 'password'}
            helperText={t('profile:security.password.fields.newPasswordHelper')}
            slotProps={{ input: { endAdornment: renderToggle(showNew) } }}
          />
          <Field.Text
            name="confirm_password"
            label={t('profile:security.password.fields.confirmPassword')}
            type={showConfirm.value ? 'text' : 'password'}
            slotProps={{ input: { endAdornment: renderToggle(showConfirm) } }}
          />

          <Button type="submit" variant="contained" loading={isSubmitting} sx={{ ml: 'auto' }}>
            {t('profile:security.password.submit')}
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}
