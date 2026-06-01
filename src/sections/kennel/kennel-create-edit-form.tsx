'use client';

import type { IKennelItem } from 'src/types/kennel';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { createKennel, updateKennel } from 'src/actions/kennel';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type KennelSchemaType = z.infer<typeof KennelSchema>;

export const KennelSchema = z.object({
  name: z.string().min(1, { error: 'Name is required!' }),
  kennel_prefix: z.string().nullable(),
  description: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  contact_phone: z.string().nullable(),
  contact_email: z.string().nullable(),
  website: z.string().nullable(),
});

// ----------------------------------------------------------------------

type Props = { currentKennel?: IKennelItem };

export function KennelCreateEditForm({ currentKennel }: Props) {
  const router = useRouter();

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
    resolver: zodResolver(KennelSchema),
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
        toast.success('Update success!');
      } else {
        await createKennel(data);
        toast.success('Create success!');
      }
      router.push(paths.dashboard.kennels.root);
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
          <Field.Text name="kennel_prefix" label="Kennel prefix" />
          <Field.Text name="city" label="City" />
          <Field.Text name="country" label="Country" />
          <Field.Text name="contact_phone" label="Contact phone" />
          <Field.Text name="contact_email" label="Contact email" />
          <Field.Text name="website" label="Website" />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Field.Text name="description" label="Description" multiline rows={3} />
        </Box>

        <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {currentKennel ? 'Save changes' : 'Create kennel'}
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}
