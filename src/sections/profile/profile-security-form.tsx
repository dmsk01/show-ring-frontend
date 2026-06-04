'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import { updateMyEmail } from 'src/actions/account';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export type EmailSchemaType = z.infer<typeof EmailSchema>;

export const EmailSchema = z.object({
  email: z
    .string()
    .min(1, { error: 'Введите email' })
    .refine((v) => /.+@.+\..+/.test(v), { error: 'Некорректный email' }),
  current_password: z.string().min(1, { error: 'Введите текущий пароль' }),
});

// ----------------------------------------------------------------------

export function ProfileSecurityForm() {
  const { checkUserSession } = useAuthContext();

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
      await updateMyEmail(data);
      await checkUserSession?.();
      toast.success('Email обновлён');
      reset();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Не удалось сменить email');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Alert severity="info">
            Смена пароля пока недоступна на сервере — здесь можно изменить email, подтвердив
            текущим паролем.
          </Alert>

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
