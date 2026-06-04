'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';

import { createSupportTicket } from 'src/actions/account';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type FeedbackSchemaType = z.infer<typeof FeedbackSchema>;

export const FeedbackSchema = z.object({
  subject: z.string().min(1, { error: 'Введите тему' }),
  body: z.string().min(1, { error: 'Введите сообщение' }),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
});

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Низкий' },
  { value: 'normal', label: 'Обычный' },
  { value: 'high', label: 'Высокий' },
  { value: 'urgent', label: 'Срочный' },
];

// ----------------------------------------------------------------------

export function ProfileFeedbackForm() {
  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(FeedbackSchema),
    defaultValues: { subject: '', body: '', priority: 'normal' as const },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await createSupportTicket(data);
      toast.success('Обращение отправлено');
      reset();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Не удалось отправить');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Field.Text name="subject" label="Тема" />
          <Field.Select name="priority" label="Приоритет">
            {PRIORITY_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Field.Select>
          <Field.Text name="body" label="Сообщение" multiline rows={4} />

          <Button type="submit" variant="contained" loading={isSubmitting} sx={{ ml: 'auto' }}>
            Отправить
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}
