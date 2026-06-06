'use client';

import type { TFunction } from 'i18next';
import type { IDogItem } from 'src/types/dog';

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
import { createDog, updateDog, useGetDogs } from 'src/actions/dog';
import { useGetBreeds, useGetKennels } from 'src/actions/reference';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export const getDogSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, { error: t('form.validation.nameRequired') }),
    sex: z.enum(['male', 'female']),
    breed_id: z.string().min(1, { error: t('form.validation.breedRequired') }),
    kennel_id: z.string().nullable(),
    father_id: z.string().nullable(),
    mother_id: z.string().nullable(),
    date_of_birth: z.string().nullable(),
    color: z.string().nullable(),
    rkf_number: z.string().nullable(),
    tattoo: z.string().nullable(),
    microchip: z.string().nullable(),
    description: z.string().nullable(),
  });

export type DogSchemaType = z.infer<ReturnType<typeof getDogSchema>>;

// ----------------------------------------------------------------------

type Props = { currentDog?: IDogItem };

export function DogCreateEditForm({ currentDog }: Props) {
  const router = useRouter();
  const { t } = useTranslate(['dog', 'common']);

  const { breeds } = useGetBreeds();
  const { kennels } = useGetKennels();
  const { dogs } = useGetDogs({ per_page: 200 });

  const schema = useMemo(() => getDogSchema(t), [t]);

  const defaultValues: DogSchemaType = {
    name: '',
    sex: 'male',
    breed_id: '',
    kennel_id: '',
    father_id: '',
    mother_id: '',
    date_of_birth: null,
    color: null,
    rkf_number: null,
    tattoo: null,
    microchip: null,
    description: null,
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(schema),
    defaultValues,
    values: currentDog
      ? {
          name: currentDog.name,
          sex: currentDog.sex,
          breed_id: currentDog.breed_id,
          kennel_id: currentDog.kennel_id ?? '',
          father_id: currentDog.father_id ?? '',
          mother_id: currentDog.mother_id ?? '',
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
      const payload = {
        ...data,
        kennel_id: data.kennel_id || null,
        father_id: data.father_id || null,
        mother_id: data.mother_id || null,
      };
      if (currentDog) {
        await updateDog(currentDog.id, payload);
        toast.success(t('toast.updated'));
      } else {
        await createDog(payload);
        toast.success(t('toast.created'));
      }
      router.push(paths.dashboard.dogs.root);
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
          <Field.Select name="sex" label={t('form.fields.sex')}>
            <MenuItem value="male">{t('enums.sex.male')}</MenuItem>
            <MenuItem value="female">{t('enums.sex.female')}</MenuItem>
          </Field.Select>
          <Field.Select name="breed_id" label={t('form.fields.breed')}>
            <MenuItem value="">—</MenuItem>
            {breeds.map((breed) => (
              <MenuItem key={breed.id} value={breed.id}>
                {breed.name}
              </MenuItem>
            ))}
          </Field.Select>
          <Field.Select name="kennel_id" label={t('form.fields.kennel')}>
            <MenuItem value="">—</MenuItem>
            {kennels.map((kennel) => (
              <MenuItem key={kennel.id} value={kennel.id}>
                {kennel.name}
              </MenuItem>
            ))}
          </Field.Select>
          <Field.Select name="father_id" label={t('form.fields.father')}>
            <MenuItem value="">—</MenuItem>
            {dogs
              .filter((dog) => dog.id !== currentDog?.id)
              .map((dog) => (
                <MenuItem key={dog.id} value={dog.id}>
                  {dog.name}
                </MenuItem>
              ))}
          </Field.Select>
          <Field.Select name="mother_id" label={t('form.fields.mother')}>
            <MenuItem value="">—</MenuItem>
            {dogs
              .filter((dog) => dog.id !== currentDog?.id)
              .map((dog) => (
                <MenuItem key={dog.id} value={dog.id}>
                  {dog.name}
                </MenuItem>
              ))}
          </Field.Select>
          <Field.Text name="date_of_birth" label={t('form.fields.dateOfBirth')} placeholder="YYYY-MM-DD" />
          <Field.Text name="color" label={t('form.fields.color')} />
          <Field.Text name="rkf_number" label={t('form.fields.rkfNumber')} />
          <Field.Text name="tattoo" label={t('form.fields.tattoo')} />
          <Field.Text name="microchip" label={t('form.fields.microchip')} />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Field.Text name="description" label={t('form.fields.description')} multiline rows={3} />
        </Box>

        <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {currentDog ? t('form.submitUpdate') : t('form.submitCreate')}
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}
