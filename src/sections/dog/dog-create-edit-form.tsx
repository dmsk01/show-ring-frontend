'use client';

import type { IDogItem } from 'src/types/dog';

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

import { createDog, updateDog } from 'src/actions/dog';
import { useGetBreeds, useGetKennels } from 'src/actions/reference';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type DogSchemaType = z.infer<typeof DogSchema>;

export const DogSchema = z.object({
  name: z.string().min(1, { error: 'Name is required!' }),
  sex: z.enum(['male', 'female']),
  breed_id: z.string().min(1, { error: 'Breed is required!' }),
  kennel_id: z.string().nullable(),
  date_of_birth: z.string().nullable(),
  color: z.string().nullable(),
  rkf_number: z.string().nullable(),
  tattoo: z.string().nullable(),
  microchip: z.string().nullable(),
  description: z.string().nullable(),
});

// ----------------------------------------------------------------------

type Props = { currentDog?: IDogItem };

export function DogCreateEditForm({ currentDog }: Props) {
  const router = useRouter();

  const { breeds } = useGetBreeds();
  const { kennels } = useGetKennels();

  const defaultValues: DogSchemaType = {
    name: '',
    sex: 'male',
    breed_id: '',
    kennel_id: '',
    date_of_birth: null,
    color: null,
    rkf_number: null,
    tattoo: null,
    microchip: null,
    description: null,
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(DogSchema),
    defaultValues,
    values: currentDog
      ? {
          name: currentDog.name,
          sex: currentDog.sex,
          breed_id: currentDog.breed_id,
          kennel_id: currentDog.kennel_id ?? '',
          date_of_birth: currentDog.date_of_birth,
          color: currentDog.color,
          rkf_number: currentDog.rkf_number,
          tattoo: currentDog.tattoo,
          microchip: currentDog.microchip,
          description: currentDog.description,
        }
      : undefined,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = { ...data, kennel_id: data.kennel_id || null };
      if (currentDog) {
        await updateDog(currentDog.id, payload);
        toast.success('Update success!');
      } else {
        await createDog(payload);
        toast.success('Create success!');
      }
      router.push(paths.dashboard.dogs.root);
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
          <Field.Select name="sex" label="Sex">
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
          </Field.Select>
          <Field.Select name="breed_id" label="Breed">
            <MenuItem value="">—</MenuItem>
            {breeds.map((breed) => (
              <MenuItem key={breed.id} value={breed.id}>
                {breed.name}
              </MenuItem>
            ))}
          </Field.Select>
          <Field.Select name="kennel_id" label="Kennel">
            <MenuItem value="">—</MenuItem>
            {kennels.map((kennel) => (
              <MenuItem key={kennel.id} value={kennel.id}>
                {kennel.name}
              </MenuItem>
            ))}
          </Field.Select>
          <Field.Text name="date_of_birth" label="Date of birth" placeholder="YYYY-MM-DD" />
          <Field.Text name="color" label="Color" />
          <Field.Text name="rkf_number" label="RKF number" />
          <Field.Text name="tattoo" label="Tattoo" />
          <Field.Text name="microchip" label="Microchip" />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Field.Text name="description" label="Description" multiline rows={3} />
        </Box>

        <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {currentDog ? 'Save changes' : 'Create dog'}
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}
