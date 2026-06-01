'use client';

import type { ILitterItem } from 'src/types/litter';

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

import { useGetDogs } from 'src/actions/dog';
import { createLitter, updateLitter } from 'src/actions/litter';
import { useGetBreeds, useGetKennels } from 'src/actions/reference';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { LITTER_STATUSES } from 'src/types/litter';

// ----------------------------------------------------------------------

export type LitterSchemaType = z.infer<typeof LitterSchema>;

export const LitterSchema = z.object({
  kennel_id: z.string().min(1, { error: 'Kennel is required!' }),
  breed_id: z.string().min(1, { error: 'Breed is required!' }),
  status: z.enum(['planned', 'born', 'available', 'sold_out', 'archived']),
  father_id: z.string().nullable(),
  mother_id: z.string().nullable(),
  born_at: z.string().nullable(),
  puppies_count: z.string().nullable(),
  price_from: z.string().nullable(),
  price_to: z.string().nullable(),
  description: z.string().nullable(),
});

const toNum = (v: string | null) => (v ? Number(v) : null);

// ----------------------------------------------------------------------

type Props = { currentLitter?: ILitterItem };

export function LitterCreateEditForm({ currentLitter }: Props) {
  const router = useRouter();

  const { breeds } = useGetBreeds();
  const { kennels } = useGetKennels();
  const { dogs } = useGetDogs({ per_page: 200 });

  const defaultValues: LitterSchemaType = {
    kennel_id: '',
    breed_id: '',
    status: 'planned',
    father_id: '',
    mother_id: '',
    born_at: null,
    puppies_count: null,
    price_from: null,
    price_to: null,
    description: null,
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(LitterSchema),
    defaultValues,
    values: currentLitter
      ? {
          kennel_id: currentLitter.kennel_id,
          breed_id: currentLitter.breed_id,
          status: currentLitter.status,
          father_id: currentLitter.father_id ?? '',
          mother_id: currentLitter.mother_id ?? '',
          born_at: currentLitter.born_at,
          puppies_count: currentLitter.puppies_count?.toString() ?? null,
          price_from: currentLitter.price_from?.toString() ?? null,
          price_to: currentLitter.price_to?.toString() ?? null,
          description: currentLitter.description,
        }
      : undefined,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        kennel_id: data.kennel_id,
        breed_id: data.breed_id,
        status: data.status,
        father_id: data.father_id || null,
        mother_id: data.mother_id || null,
        born_at: data.born_at || null,
        description: data.description || null,
        puppies_count: toNum(data.puppies_count),
        price_from: toNum(data.price_from),
        price_to: toNum(data.price_to),
      };
      if (currentLitter) {
        await updateLitter(currentLitter.id, payload);
        toast.success('Update success!');
      } else {
        await createLitter(payload);
        toast.success('Create success!');
      }
      router.push(paths.dashboard.litters.root);
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
          <Field.Select name="kennel_id" label="Kennel">
            <MenuItem value="">—</MenuItem>
            {kennels.map((kennel) => (
              <MenuItem key={kennel.id} value={kennel.id}>
                {kennel.name}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Select name="breed_id" label="Breed">
            <MenuItem value="">—</MenuItem>
            {breeds.map((breed) => (
              <MenuItem key={breed.id} value={breed.id}>
                {breed.name}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Select name="father_id" label="Father">
            <MenuItem value="">—</MenuItem>
            {dogs.map((dog) => (
              <MenuItem key={dog.id} value={dog.id}>
                {dog.name}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Select name="mother_id" label="Mother">
            <MenuItem value="">—</MenuItem>
            {dogs.map((dog) => (
              <MenuItem key={dog.id} value={dog.id}>
                {dog.name}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Select name="status" label="Status">
            {LITTER_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Text name="born_at" label="Born at" placeholder="YYYY-MM-DD" />
          <Field.Text name="puppies_count" label="Puppies count" type="number" />
          <Field.Text name="price_from" label="Price from" type="number" />
          <Field.Text name="price_to" label="Price to" type="number" />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Field.Text name="description" label="Description" multiline rows={3} />
        </Box>

        <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {currentLitter ? 'Save changes' : 'Create litter'}
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}
