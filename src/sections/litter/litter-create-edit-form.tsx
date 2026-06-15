'use client';

import type { TFunction } from 'i18next';
import type { ILitterItem } from 'src/types/litter';

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
import { useGetDogs } from 'src/actions/dog';
import { createLitter, updateLitter } from 'src/actions/litter';
import { useGetBreeds, useGetKennels } from 'src/actions/reference';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { LITTER_STATUSES } from 'src/types/litter';

// ----------------------------------------------------------------------

export const getLitterSchema = (t: TFunction) =>
  z.object({
    kennel_id: z.string().min(1, { error: t('form.validation.kennelRequired') }),
    breed_id: z.string().min(1, { error: t('form.validation.breedRequired') }),
    status: z.enum(['planned', 'born', 'available', 'sold_out', 'archived']),
    father_id: z.string().nullable(),
    mother_id: z.string().nullable(),
    born_at: z.string().nullable(),
    // Mirror backend LitterCreate: puppies_count 0..30, price_from/price_to ≥ 0.
    puppies_count: z
      .string()
      .refine((v) => !v || (Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 30), {
        error: t('form.validation.puppiesRange'),
      })
      .nullable(),
    price_from: z
      .string()
      .refine((v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
        error: t('form.validation.priceInvalid'),
      })
      .nullable(),
    price_to: z
      .string()
      .refine((v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
        error: t('form.validation.priceInvalid'),
      })
      .nullable(),
    description: z.string().nullable(),
  });

export type LitterSchemaType = z.infer<ReturnType<typeof getLitterSchema>>;

const toNum = (v: string | null) => (v ? Number(v) : null);

// ----------------------------------------------------------------------

type Props = { currentLitter?: ILitterItem };

export function LitterCreateEditForm({ currentLitter }: Props) {
  const router = useRouter();
  const { t } = useTranslate(['litter', 'common']);

  const { breeds } = useGetBreeds();
  const { kennels } = useGetKennels();
  const { dogs } = useGetDogs({ per_page: 200 });

  const schema = useMemo(() => getLitterSchema(t), [t]);

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
    resolver: zodResolver(schema),
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
        toast.success(t('toast.updated'));
      } else {
        await createLitter(payload);
        toast.success(t('toast.created'));
      }
      router.push(paths.dashboard.litters.root);
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
          <Field.Select name="kennel_id" label={t('form.fields.kennel')}>
            <MenuItem value="">—</MenuItem>
            {kennels.map((kennel) => (
              <MenuItem key={kennel.id} value={kennel.id}>
                {kennel.name}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Select name="breed_id" label={t('form.fields.breed')}>
            <MenuItem value="">—</MenuItem>
            {breeds.map((breed) => (
              <MenuItem key={breed.id} value={breed.id}>
                {breed.name}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Select name="father_id" label={t('form.fields.father')}>
            <MenuItem value="">—</MenuItem>
            {dogs.map((dog) => (
              <MenuItem key={dog.id} value={dog.id}>
                {dog.name}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Select name="mother_id" label={t('form.fields.mother')}>
            <MenuItem value="">—</MenuItem>
            {dogs.map((dog) => (
              <MenuItem key={dog.id} value={dog.id}>
                {dog.name}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Select name="status" label={t('form.fields.status')}>
            {LITTER_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {t(`common:enums.litterStatus.${status}`)}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Text name="born_at" label={t('form.fields.bornAt')} placeholder="YYYY-MM-DD" />
          <Field.Text name="puppies_count" label={t('form.fields.puppiesCount')} type="number" />
          <Field.Text name="price_from" label={t('form.fields.priceFrom')} type="number" />
          <Field.Text name="price_to" label={t('form.fields.priceTo')} type="number" />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Field.Text name="description" label={t('form.fields.description')} multiline rows={3} />
        </Box>

        <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {currentLitter ? t('form.submitUpdate') : t('form.submitCreate')}
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}
