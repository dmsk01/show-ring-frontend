'use client';

import type { TFunction } from 'i18next';
import type { IShowItem } from 'src/types/show';

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
import { createShow, updateShow } from 'src/actions/show';
import { useReferenceList } from 'src/actions/admin-reference';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export function getShowSchema(t: TFunction<['show', 'common']>) {
  return z.object({
    name: z.string().min(1, { error: t('show:form.validation.nameRequired') }),
    rank_id: z.string().min(1, { error: t('show:form.validation.rankRequired') }),
    date_start: z.string().min(1, { error: t('show:form.validation.dateStartRequired') }),
    date_end: z.string().nullable(),
    registration_deadline: z.string().nullable(),
    city: z.string().nullable(),
    country: z.string().nullable(),
    venue: z.string().nullable(),
    entry_fee: z.string().nullable(),
    description: z.string().nullable(),
  });
}

export type ShowSchemaType = z.infer<ReturnType<typeof getShowSchema>>;

type Props = { currentShow?: IShowItem };

export function ShowCreateEditForm({ currentShow }: Props) {
  const { t } = useTranslate(['show', 'common']);
  const router = useRouter();
  const { items: ranks } = useReferenceList('/references/show-ranks');

  const ShowSchema = useMemo(() => getShowSchema(t), [t]);

  const defaultValues: ShowSchemaType = {
    name: '',
    rank_id: '',
    date_start: '',
    date_end: null,
    registration_deadline: null,
    city: null,
    country: null,
    venue: null,
    entry_fee: null,
    description: null,
  };

  const methods = useForm<ShowSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(ShowSchema),
    defaultValues,
    values: currentShow
      ? {
          name: currentShow.name,
          rank_id: currentShow.rank_id,
          date_start: currentShow.date_start ?? '',
          date_end: currentShow.date_end,
          registration_deadline: currentShow.registration_deadline,
          city: currentShow.city,
          country: currentShow.country,
          venue: currentShow.venue,
          entry_fee: currentShow.entry_fee?.toString() ?? null,
          description: currentShow.description,
        }
      : undefined,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const common = {
        name: data.name,
        date_start: data.date_start,
        date_end: data.date_end || null,
        registration_deadline: data.registration_deadline || null,
        city: data.city || null,
        country: data.country || null,
        venue: data.venue || null,
        entry_fee: data.entry_fee ? Number(data.entry_fee) : null,
        description: data.description || null,
      };

      if (currentShow) {
        await updateShow(currentShow.id, common);
        toast.success(t('toast.updated'));
      } else {
        await createShow({ ...common, rank_id: data.rank_id });
        toast.success(t('toast.created'));
      }
      router.push(paths.dashboard.shows.root);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : t('toast.saveFailed'));
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
          <Field.Select name="rank_id" label={t('form.fields.rank')} disabled={!!currentShow}>
            <MenuItem value="">—</MenuItem>
            {ranks.map((rank) => (
              <MenuItem key={rank.id} value={rank.id}>
                {rank.name}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Text name="date_start" label={t('form.fields.dateStart')} placeholder={t('form.placeholders.date')} />
          <Field.Text name="date_end" label={t('form.fields.dateEnd')} placeholder={t('form.placeholders.date')} />
          <Field.Text
            name="registration_deadline"
            label={t('form.fields.registrationDeadline')}
            placeholder={t('form.placeholders.date')}
          />
          <Field.Text name="entry_fee" label={t('form.fields.entryFee')} type="number" />

          <Field.Text name="city" label={t('form.fields.city')} />
          <Field.Text name="country" label={t('form.fields.country')} />
          <Field.Text name="venue" label={t('form.fields.venue')} />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Field.Text name="description" label={t('form.fields.description')} multiline rows={3} />
        </Box>

        <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {currentShow ? t('form.submitUpdate') : t('form.submitCreate')}
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}
