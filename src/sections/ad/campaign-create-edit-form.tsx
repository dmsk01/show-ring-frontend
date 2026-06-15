'use client';

import type { TFunction } from 'i18next';
import type { ICampaign } from 'src/types/ad';

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
import { createCampaign, updateCampaign } from 'src/actions/ad';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { CAMPAIGN_STATUSES } from 'src/types/ad';

// ----------------------------------------------------------------------

export function getCampaignSchema(t: TFunction) {
  return z.object({
    // Mirror backend CampaignCreate: name maxLength 255, budget > 0, cost_per_impression ≥ 0.
    name: z
      .string()
      .min(1, { error: t('form.validation.nameRequired') })
      .max(255, { error: t('form.validation.tooLong', { max: 255 }) }),
    budget: z
      .string()
      .min(1, { error: t('form.validation.budgetRequired') })
      .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, {
        error: t('form.validation.budgetPositive'),
      }),
    date_start: z.string().min(1, { error: t('form.validation.dateStartRequired') }),
    date_end: z.string().min(1, { error: t('form.validation.dateEndRequired') }),
    cost_per_impression: z
      .string()
      .refine((v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
        error: t('form.validation.cpiInvalid'),
      })
      .nullable(),
    description: z.string().nullable(),
    status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']),
  });
}

export type CampaignSchemaType = z.infer<ReturnType<typeof getCampaignSchema>>;

type Props = { currentCampaign?: ICampaign };

export function CampaignCreateEditForm({ currentCampaign }: Props) {
  const router = useRouter();
  const { t } = useTranslate(['ad', 'common']);

  const CampaignSchema = useMemo(() => getCampaignSchema(t), [t]);

  const defaultValues: CampaignSchemaType = {
    name: '',
    budget: '',
    date_start: '',
    date_end: '',
    cost_per_impression: null,
    description: null,
    status: 'draft',
  };

  const methods = useForm<CampaignSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(CampaignSchema),
    defaultValues,
    values: currentCampaign
      ? {
          name: currentCampaign.name,
          budget: currentCampaign.budget,
          date_start: currentCampaign.date_start?.slice(0, 10) ?? '',
          date_end: currentCampaign.date_end?.slice(0, 10) ?? '',
          cost_per_impression: currentCampaign.cost_per_impression,
          description: currentCampaign.description,
          status: currentCampaign.status,
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
        budget: Number(data.budget),
        date_start: data.date_start,
        date_end: data.date_end,
        description: data.description || null,
        cost_per_impression: data.cost_per_impression ? Number(data.cost_per_impression) : null,
      };

      if (currentCampaign) {
        await updateCampaign(currentCampaign.id, { ...common, status: data.status });
        toast.success(t('toast.updated'));
      } else {
        await createCampaign(common);
        toast.success(t('toast.created'));
      }
      router.push(paths.dashboard.ads.root);
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
          {currentCampaign && (
            <Field.Select name="status" label={t('form.fields.status')}>
              {CAMPAIGN_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {t(`enums.status.${s}`)}
                </MenuItem>
              ))}
            </Field.Select>
          )}

          <Field.Text name="budget" label={t('form.fields.budget')} type="number" />
          <Field.Text
            name="cost_per_impression"
            label={t('form.fields.costPerImpression')}
            type="number"
          />

          <Field.Text
            name="date_start"
            label={t('form.fields.dateStart')}
            placeholder="YYYY-MM-DD"
          />
          <Field.Text
            name="date_end"
            label={t('form.fields.dateEnd')}
            placeholder="YYYY-MM-DD"
          />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Field.Text name="description" label={t('form.fields.description')} multiline rows={3} />
        </Box>

        <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {currentCampaign ? t('form.submitUpdate') : t('form.submitCreate')}
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}
