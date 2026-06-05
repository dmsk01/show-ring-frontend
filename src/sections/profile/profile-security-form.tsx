'use client';

import * as z from 'zod';
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

import { accountErrorMessage } from 'src/actions/account-errors';
import { updateMyEmail, updateMyPassword } from 'src/actions/account';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';
import { resetRevokedSession } from 'src/auth/context/jwt';

// ----------------------------------------------------------------------

export type EmailSchemaType = z.infer<typeof EmailSchema>;

export const EmailSchema = z.object({
  email: schemaUtils.email({
    error: { required: 'Введите email', invalid: 'Некорректный email' },
  }),
  current_password: z.string().min(1, { error: 'Введите текущий пароль' }),
});

export type PasswordSchemaType = z.infer<typeof PasswordSchema>;

export const PasswordSchema = z
  .object({
    current_password: z.string().min(1, { error: 'Введите текущий пароль' }),
    new_password: z
      .string()
      .min(8, { error: 'Минимум 8 символов' })
      .max(128, { error: 'Максимум 128 символов' }),
    confirm_password: z.string().min(1, { error: 'Подтвердите новый пароль' }),
  })
  .refine((val) => val.new_password === val.confirm_password, {
    error: 'Пароли не совпадают',
    path: ['confirm_password'],
  })
  .refine((val) => val.new_password !== val.current_password, {
    error: 'Новый пароль совпадает с текущим',
    path: ['new_password'],
  });

const EMAIL_CHANGE_FALLBACK = 'Проверьте новый email для подтверждения смены';

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
  const methods = useForm({
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
      toast.success(res.message || EMAIL_CHANGE_FALLBACK);
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
          <Typography variant="h6">Смена email</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            На новый адрес придёт письмо со ссылкой для подтверждения. Email изменится только
            после перехода по ней.
          </Typography>

          <Field.Text name="email" label="Новый email" />
          <Field.Text name="current_password" label="Текущий пароль" type="password" />

          <Button type="submit" variant="contained" loading={isSubmitting} sx={{ ml: 'auto' }}>
            Сохранить
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}

// ----------------------------------------------------------------------

function PasswordCard() {
  const router = useRouter();
  const { checkUserSession } = useAuthContext();

  const showCurrent = useBoolean();
  const showNew = useBoolean();
  const showConfirm = useBoolean();

  const methods = useForm({
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
      toast.success(res.message || 'Пароль изменён. Войдите заново.');
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
          <Typography variant="h6">Смена пароля</Typography>

          <Field.Text
            name="current_password"
            label="Текущий пароль"
            type={showCurrent.value ? 'text' : 'password'}
            slotProps={{ input: { endAdornment: renderToggle(showCurrent) } }}
          />
          <Field.Text
            name="new_password"
            label="Новый пароль"
            type={showNew.value ? 'text' : 'password'}
            helperText="От 8 до 128 символов"
            slotProps={{ input: { endAdornment: renderToggle(showNew) } }}
          />
          <Field.Text
            name="confirm_password"
            label="Подтвердите новый пароль"
            type={showConfirm.value ? 'text' : 'password'}
            slotProps={{ input: { endAdornment: renderToggle(showConfirm) } }}
          />

          <Button type="submit" variant="contained" loading={isSubmitting} sx={{ ml: 'auto' }}>
            Сменить пароль
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}
