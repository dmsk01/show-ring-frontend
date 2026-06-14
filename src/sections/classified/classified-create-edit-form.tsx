'use client';

import type { TFunction } from 'i18next';
import type { IClassifiedItem } from 'src/types/classified';

import * as z from 'zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

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
    // Mirror backend constraints (ClassifiedCreate): title 3..255, description ≥10.
    title: z
      .string()
      .min(3, { error: t('form.validation.titleMin') })
      .max(255, { error: t('form.validation.titleMax') }),
    description: z.string().min(10, { error: t('form.validation.descriptionMin') }),
    price_kind: z.enum(['fixed', 'free', 'negotiable']),
    // Update-only on the backend (ClassifiedCreate has no such field) — sent only when editing.
    availability: z.enum(['available', 'reserved', 'sold']),
    // Publish/withdraw toggle (edit only). published = status !== 'closed' (active or
    // moderation read as "published/pending"). On submit: off → `closed`, on (from closed) →
    // `moderation` (re-submit; only an admin can set `active` directly — see moderation design).
    published: z.boolean(),
    breed_id: z.string().nullable(),
    // `Field.Text type="number"` emits a string while typing but a number on blur
    // (minimal-shared `transformValueOnBlur` → parseFloat), so accept both here.
    price: z
      .union([z.string(), z.number()])
      .nullable()
      .refine((val) => val == null || val === '' || (!Number.isNaN(Number(val)) && Number(val) >= 0), {
        error: t('form.validation.priceInvalid'),
      }),
    city: z.string().max(128, { error: t('form.validation.cityMax') }).nullable(),
    // Optional, but must be a valid number with country code when provided.
    contact_phone: z
      .string()
      .refine((val) => !val || isValidPhoneNumber(val), {
        error: t('form.validation.phoneInvalid'),
      })
      .nullish(),
    // Optional, but must be a valid email when provided (backend requires email format).
    contact_email: z
      .string()
      .refine((val) => !val || z.email().safeParse(val).success, {
        error: t('form.validation.emailInvalid'),
      })
      .nullish(),
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
    published: true,
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
          published: currentClassified.status !== 'closed',
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
        // Send `status` only when the publish toggle actually changed, so a plain save never
        // clobbers `moderation`/`archived` states the owner didn't touch. Re-publishing a closed
        // listing goes back to `moderation` (not straight to `active`); the backend also
        // re-moderates an `active` listing on any content edit (handled server-side).
        const wasPublished = currentClassified.status !== 'closed';
        await updateClassified(currentClassified.id, {
          ...base,
          availability: data.availability,
          ...(data.published !== wasPublished && {
            status: data.published ? 'moderation' : 'closed',
          }),
        });
        toast.success(t('toast.updated'));
      } else {
        const created = await createClassified({
          ...base,
          images: imageIds.map((file_id, i) => ({ file_id, position: i, is_primary: i === 0 })),
        });
        // Copy follows the real status the API returned, so it stays correct whether or not the
        // backend moderation gate is deployed yet.
        toast.success(created.status === 'moderation' ? t('toast.sentToModeration') : t('toast.created'));
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

          <Field.Phone
            name="contact_phone"
            label={t('form.fields.contactPhone')}
            defaultCountry="RU"
          />
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

        {/* New listings go through moderation before they are published publicly. */}
        {!currentClassified && (
          <Typography variant="caption" sx={{ mt: 3, display: 'block', color: 'text.secondary' }}>
            {t('form.createModerationHint')}
          </Typography>
        )}

        <Stack
          direction="row"
          sx={{
            mt: currentClassified ? 3 : 1,
            alignItems: 'center',
            justifyContent: currentClassified ? 'space-between' : 'flex-end',
          }}
        >
          {/* Publish/withdraw toggle — re-publishing or editing a published listing goes back to
              moderation; only an admin can set it `active` directly. */}
          {currentClassified && (
            <Box>
              <Field.Switch name="published" label={t('form.fields.published')} />
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                {t('form.publishModerationHint')}
              </Typography>
            </Box>
          )}

          <Button type="submit" variant="contained" loading={isSubmitting}>
            {currentClassified ? t('form.submitUpdate') : t('form.submitCreate')}
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}
