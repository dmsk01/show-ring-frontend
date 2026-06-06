'use client';

import type { TFunction } from 'i18next';
import type { IKennelItem } from 'src/types/kennel';

import * as z from 'zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { createKennel, updateKennel } from 'src/actions/kennel';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export const getKennelSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, { error: t('form.validation.nameRequired') }),
    kennel_prefix: z.string().nullable(),
    description: z.string().nullable(),
    city: z.string().nullable(),
    country: z.string().nullable(),
    contact_phone: z.string().nullable(),
    contact_email: z.string().nullable(),
    website: z.string().nullable(),
  });

export type KennelSchemaType = z.infer<ReturnType<typeof getKennelSchema>>;

// ----------------------------------------------------------------------

type Props = { currentKennel?: IKennelItem };

export function KennelCreateEditForm({ currentKennel }: Props) {
  const router = useRouter();
  const { t } = useTranslate(['kennel', 'common']);

  const schema = useMemo(() => getKennelSchema(t), [t]);

  const defaultValues: KennelSchemaType = {
    name: '',
    kennel_prefix: null,
    description: null,
    city: null,
    country: null,
    contact_phone: null,
    contact_email: null,
    website: null,
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(schema),
    defaultValues,
    values: currentKennel
      ? {
          name: currentKennel.name,
          kennel_prefix: currentKennel.kennel_prefix,
          description: currentKennel.description,
          city: currentKennel.city,
          country: currentKennel.country,
          contact_phone: currentKennel.contact_phone,
          contact_email: currentKennel.contact_email,
          website: currentKennel.website,
        }
      : undefined,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (currentKennel) {
        await updateKennel(currentKennel.id, data);
        toast.success(t('toast.updated'));
      } else {
        await createKennel(data);
        toast.success(t('toast.created'));
      }
      router.push(paths.dashboard.kennels.root);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : t('common:state.error'));
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
          }}
        >
          <Field.Text name="name" label={t('form.fields.name')} />
          <Field.Text name="kennel_prefix" label={t('form.fields.prefix')} />
          <Field.Text name="city" label={t('form.fields.city')} />
          <Field.Text name="country" label={t('form.fields.country')} />
          <Field.Text name="contact_phone" label={t('form.fields.phone')} />
          <Field.Text name="contact_email" label={t('form.fields.email')} />
          <Field.Text name="website" label={t('form.fields.website')} />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Field.Text name="description" label={t('form.fields.description')} multiline rows={3} />
        </Box>

        <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {currentKennel ? t('form.submitUpdate') : t('form.submitCreate')}
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}
