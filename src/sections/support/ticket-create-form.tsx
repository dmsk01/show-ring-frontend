'use client';

import type { TFunction } from 'i18next';

import * as z from 'zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { createTicket } from 'src/actions/support';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { TICKET_PRIORITIES } from 'src/types/support';

// ----------------------------------------------------------------------

export const getTicketSchema = (t: TFunction) =>
  z.object({
    // Mirror backend TicketCreate: subject 3..255, body ≥ 3.
    subject: z
      .string()
      .min(3, { error: t('form.validation.subjectMin') })
      .max(255, { error: t('form.validation.tooLong', { max: 255 }) }),
    body: z.string().min(3, { error: t('form.validation.messageMin') }),
    priority: z.enum(['low', 'normal', 'high', 'urgent']),
  });

export type TicketSchemaType = z.infer<ReturnType<typeof getTicketSchema>>;

export function TicketCreateForm() {
  const router = useRouter();
  const { t } = useTranslate(['support', 'common']);

  const schema = useMemo(() => getTicketSchema(t), [t]);

  const methods = useForm<TicketSchemaType>({
    resolver: zodResolver(schema),
    defaultValues: { subject: '', body: '', priority: 'normal' },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await createTicket(data);
      toast.success(t('toast.created'));
      router.push(paths.dashboard.support.root);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common:state.error'));
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
        <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
          <Field.Text name="subject" label={t('form.fields.subject')} />
          <Field.Select name="priority" label={t('form.fields.priority')}>
            {TICKET_PRIORITIES.map((priority) => (
              <MenuItem key={priority} value={priority}>
                {t(`enums.priority.${priority}`)}
              </MenuItem>
            ))}
          </Field.Select>
          <Field.Text name="body" label={t('form.fields.message')} multiline rows={5} />
        </Box>

        <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {t('form.submit')}
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}
