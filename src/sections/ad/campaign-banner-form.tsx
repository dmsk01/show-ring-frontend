'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { createBanner } from 'src/actions/ad';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { BANNER_PLACEMENTS } from 'src/types/ad';

// ----------------------------------------------------------------------

const BannerSchema = z.object({
  target_url: z.string().min(1, { error: 'Target URL is required!' }),
  placement: z.enum(['sidebar', 'top', 'inline', 'footer']),
  title: z.string().nullable(),
  is_active: z.boolean(),
});

type BannerSchemaType = z.infer<typeof BannerSchema>;

type Props = { campaignId: string };

export function CampaignBannerForm({ campaignId }: Props) {
  const methods = useForm<BannerSchemaType>({
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
      toast.success('Banner added!');
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add banner');
    }
  });

  return (
    <Card sx={{ p: 3, mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Add banner
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
          <Field.Text name="target_url" label="Target URL" />
          <Field.Select name="placement" label="Placement">
            {BANNER_PLACEMENTS.map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </Field.Select>
          <Field.Text name="title" label="Title" />
          <Field.Switch name="is_active" label="Active" />
        </Box>

        <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
          <Button type="submit" variant="outlined" color="inherit" loading={isSubmitting}>
            Add banner
          </Button>
        </Stack>
      </Form>
    </Card>
  );
}
