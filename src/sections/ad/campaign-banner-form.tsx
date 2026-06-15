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
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { createBanner } from 'src/actions/ad';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { BANNER_PLACEMENTS } from 'src/types/ad';

// ----------------------------------------------------------------------

export function getCampaignBannerSchema(t: TFunction) {
  return z.object({
    // Mirror backend BannerCreate: target_url maxLength 2048, title maxLength 255.
    target_url: z
      .string()
      .min(1, { error: t('form.validation.targetUrlRequired') })
      .max(2048, { error: t('form.validation.tooLong', { max: 2048 }) }),
    placement: z.enum(['sidebar', 'top', 'inline', 'footer']),
    title: z.string().max(255, { error: t('form.validation.tooLong', { max: 255 }) }).nullable(),
    is_active: z.boolean(),
  });
}

export type CampaignBannerSchemaType = z.infer<ReturnType<typeof getCampaignBannerSchema>>;

type Props = { campaignId: string };

export function CampaignBannerForm({ campaignId }: Props) {
  const { t } = useTranslate(['ad', 'common']);

  const BannerSchema = useMemo(() => getCampaignBannerSchema(t), [t]);

  const methods = useForm<CampaignBannerSchemaType>({
    resolver: zodResolver(BannerSchema),
    defaultValues: { target_url: '', placement: 'sidebar', title: null, is_active: true },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await createBanner(campaignId, {
        target_url: data.target_url,
        placement: data.placement,
        title: data.title || null,
        is_active: data.is_active,
      });
      toast.success(t('toast.bannerAdded'));
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common:state.error'));
    }
  });

  return (
    <Card sx={{ p: 3, mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {t('banner.title')}
      </Typography>

      <Form methods={methods} onSubmit={onSubmit}>
        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
          }}
        >
          <Field.Text name="target_url" label={t('banner.fields.targetUrl')} />
          <Field.Select name="placement" label={t('banner.fields.placement')}>
            {BANNER_PLACEMENTS.map((p) => (
              <MenuItem key={p} value={p}>
                {t(`enums.placement.${p}`)}
              </MenuItem>
            ))}
          </Field.Select>
          <Field.Text name="title" label={t('banner.fields.title')} />
          <Field.Switch name="is_active" label={t('banner.fields.isActive')} />
        </Box>

        <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
          <Button type="submit" variant="outlined" color="inherit" loading={isSubmitting}>
            {t('banner.submit')}
          </Button>
        </Stack>
      </Form>
    </Card>
  );
}
