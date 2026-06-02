'use client';

import type { ICampaign } from 'src/types/ad';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { createCampaign, updateCampaign } from 'src/actions/ad';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { CAMPAIGN_STATUSES } from 'src/types/ad';

// ----------------------------------------------------------------------

export type CampaignSchemaType = z.infer<typeof CampaignSchema>;

export const CampaignSchema = z.object({
  name: z.string().min(1, { error: 'Name is required!' }),
  budget: z.string().min(1, { error: 'Budget is required!' }),
  date_start: z.string().min(1, { error: 'Start date is required!' }),
  date_end: z.string().min(1, { error: 'End date is required!' }),
  cost_per_impression: z.string().nullable(),
  description: z.string().nullable(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']),
});

type Props = { currentCampaign?: ICampaign };

export function CampaignCreateEditForm({ currentCampaign }: Props) {
  const router = useRouter();

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
        toast.success('Update success!');
      } else {
        await createCampaign(common);
        toast.success('Create success!');
      }
      router.push(paths.dashboard.ads.root);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Save failed');
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
          <Field.Text name="name" label="Name" />
          {currentCampaign && (
            <Field.Select name="status" label="Status">
              {CAMPAIGN_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Field.Select>
          )}

          <Field.Text name="budget" label="Budget" type="number" />
          <Field.Text name="cost_per_impression" label="Cost per impression" type="number" />

          <Field.Text name="date_start" label="Start date" placeholder="YYYY-MM-DD" />
          <Field.Text name="date_end" label="End date" placeholder="YYYY-MM-DD" />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Field.Text name="description" label="Description" multiline rows={3} />
        </Box>

        <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {currentCampaign ? 'Save changes' : 'Create campaign'}
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}
