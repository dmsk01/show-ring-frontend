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

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type DogSchemaType = z.infer<typeof DogSchema>;

export const DogSchema = z.object({
  name: z.string().min(1, { error: 'Name is required!' }),
  sex: z.enum(['male', 'female']),
  breed_id: z.string().min(1, { error: 'Breed is required!' }),
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

  const defaultValues: DogSchemaType = {
    name: '',
    sex: 'male',
    breed_id: '',
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
      if (currentDog) {
        await updateDog(currentDog.id, data);
        toast.success('Update success!');
      } else {
        await createDog(data);
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
          <Field.Text name="breed_id" label="Breed ID" helperText="UUID from /references/breeds" />
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
