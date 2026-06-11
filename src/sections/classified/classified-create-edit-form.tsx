'use client';

import type { TFunction } from 'i18next';
import type { IClassifiedItem } from 'src/types/classified';

import * as z from 'zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { fileUrl } from 'src/actions/file';
import { useGetBreeds } from 'src/actions/reference';
import { createClassified, updateClassified } from 'src/actions/classified';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import {
  CLASSIFIED_CATEGORIES,
  ANIMAL_AVAILABILITIES,
  CLASSIFIED_PRICE_KINDS,
} from 'src/types/classified';

import { ClassifiedImagesUpload } from './classified-images-upload';
import {
  classifiedCategoryI18nKey,
  classifiedPriceKindI18nKey,
  classifiedAvailabilityI18nKey,
} from './classified-utils';

// ----------------------------------------------------------------------

export const getClassifiedSchema = (t: TFunction) =>
  z.object({
    category: z.enum(['puppy_sale', 'adult_sale', 'mating', 'handler', 'grooming', 'other']),
    title: z.string().min(1, { error: t('form.validation.titleRequired') }),
    description: z.string().min(1, { error: t('form.validation.descriptionRequired') }),
    price_kind: z.enum(['fixed', 'free', 'negotiable']),
    // Update-only on the backend (ClassifiedCreate has no such field) — sent only when editing.
    availability: z.enum(['available', 'reserved', 'sold']),
    breed_id: z.string().nullable(),
    price: z.string().nullable(),
    city: z.string().nullable(),
    contact_phone: z.string().nullable(),
    contact_email: z.string().nullable(),
  });

export type ClassifiedSchemaType = z.infer<ReturnType<typeof getClassifiedSchema>>;

type Props = { currentClassified?: IClassifiedItem };

export function ClassifiedCreateEditForm({ currentClassified }: Props) {
  const router = useRouter();
  const { t } = useTranslate(['classified', 'common']);
  const { breeds } = useGetBreeds();

  const [imageIds, setImageIds] = useState<string[]>([]);

  const schema = useMemo(() => getClassifiedSchema(t), [t]);

  const defaultValues: ClassifiedSchemaType = {
    category: 'puppy_sale',
    title: '',
    description: '',
    price_kind: 'fixed',
    availability: 'available',
    breed_id: '',
    price: null,
    city: null,
    contact_phone: null,
    contact_email: null,
  };

  const methods = useForm<ClassifiedSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(schema),
    defaultValues,
    values: currentClassified
      ? {
          category: currentClassified.category,
          title: currentClassified.title,
          description: currentClassified.description,
          price_kind: currentClassified.price_kind,
          availability: currentClassified.availability ?? 'available',
          breed_id: currentClassified.breed_id ?? '',
          price: currentClassified.price?.toString() ?? null,
          city: currentClassified.city,
          contact_phone: currentClassified.contact_phone,
          contact_email: currentClassified.contact_email,
        }
      : undefined,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const base = {
        category: data.category,
        title: data.title,
        description: data.description,
        price_kind: data.price_kind,
        breed_id: data.breed_id || null,
        price: data.price ? Number(data.price) : null,
        city: data.city || null,
        contact_phone: data.contact_phone || null,
        contact_email: data.contact_email || null,
      };

      if (currentClassified) {
        await updateClassified(currentClassified.id, { ...base, availability: data.availability });
        toast.success(t('toast.updated'));
      } else {
        await createClassified({
          ...base,
          images: imageIds.map((file_id, i) => ({ file_id, position: i, is_primary: i === 0 })),
        });
        toast.success(t('toast.created'));
      }
      router.push(paths.dashboard.classifieds.root);
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
          <Field.Select name="category" label={t('form.fields.category')}>
            {CLASSIFIED_CATEGORIES.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {t(classifiedCategoryI18nKey(cat))}
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

          <Field.Text name="title" label={t('form.fields.title')} />
          <Field.Text name="city" label={t('form.fields.city')} />

          <Field.Select name="price_kind" label={t('form.fields.priceKind')}>
            {CLASSIFIED_PRICE_KINDS.map((p) => (
              <MenuItem key={p} value={p}>
                {t(classifiedPriceKindI18nKey(p))}
              </MenuItem>
            ))}
          </Field.Select>
          <Field.Text name="price" label={t('form.fields.price')} type="number" />

          <Field.Text name="contact_phone" label={t('form.fields.contactPhone')} />
          <Field.Text name="contact_email" label={t('form.fields.contactEmail')} />

          {/* Backend accepts availability only on update — hidden when creating. */}
          {currentClassified && (
            <Field.Select name="availability" label={t('form.fields.availability')}>
              {ANIMAL_AVAILABILITIES.map((value) => (
                <MenuItem key={value} value={value}>
                  {t(classifiedAvailabilityI18nKey(value))}
                </MenuItem>
              ))}
            </Field.Select>
          )}
        </Box>

        <Box sx={{ mt: 3 }}>
          <Field.Text name="description" label={t('form.fields.description')} multiline rows={4} />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            {t('form.fields.images')}
          </Typography>
          {currentClassified ? (
            <Box sx={{ gap: 1, display: 'flex', flexWrap: 'wrap' }}>
              {currentClassified.images.length ? (
                currentClassified.images.map((img) => (
                  <Box
                    key={img.file_id}
                    component="img"
                    src={fileUrl(img.file_id)}
                    alt=""
                    sx={{ width: 88, height: 88, borderRadius: 1, objectFit: 'cover' }}
                  />
                ))
              ) : (
                <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                  {t('form.fields.noImages')}
                </Typography>
              )}
            </Box>
          ) : (
            <ClassifiedImagesUpload onChange={setImageIds} />
          )}
        </Box>

        <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {currentClassified ? t('form.submitUpdate') : t('form.submitCreate')}
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}
