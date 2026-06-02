'use client';

import type { IClassifiedItem } from 'src/types/classified';

import * as z from 'zod';
import { useState } from 'react';
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

import { fileUrl } from 'src/actions/file';
import { useGetBreeds } from 'src/actions/reference';
import { createClassified, updateClassified } from 'src/actions/classified';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { CLASSIFIED_CATEGORIES, CLASSIFIED_PRICE_KINDS } from 'src/types/classified';

import { ClassifiedImagesUpload } from './classified-images-upload';

// ----------------------------------------------------------------------

export type ClassifiedSchemaType = z.infer<typeof ClassifiedSchema>;

export const ClassifiedSchema = z.object({
  category: z.enum(['puppy_sale', 'adult_sale', 'mating', 'handler', 'grooming', 'other']),
  title: z.string().min(1, { error: 'Title is required!' }),
  description: z.string().min(1, { error: 'Description is required!' }),
  price_kind: z.enum(['fixed', 'free', 'negotiable']),
  breed_id: z.string().nullable(),
  price: z.string().nullable(),
  city: z.string().nullable(),
  contact_phone: z.string().nullable(),
  contact_email: z.string().nullable(),
});

type Props = { currentClassified?: IClassifiedItem };

export function ClassifiedCreateEditForm({ currentClassified }: Props) {
  const router = useRouter();
  const { breeds } = useGetBreeds();

  const [imageIds, setImageIds] = useState<string[]>([]);

  const defaultValues: ClassifiedSchemaType = {
    category: 'puppy_sale',
    title: '',
    description: '',
    price_kind: 'fixed',
    breed_id: '',
    price: null,
    city: null,
    contact_phone: null,
    contact_email: null,
  };

  const methods = useForm<ClassifiedSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(ClassifiedSchema),
    defaultValues,
    values: currentClassified
      ? {
          category: currentClassified.category,
          title: currentClassified.title,
          description: currentClassified.description,
          price_kind: currentClassified.price_kind,
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
        await updateClassified(currentClassified.id, base);
        toast.success('Update success!');
      } else {
        await createClassified({
          ...base,
          images: imageIds.map((file_id, i) => ({ file_id, position: i, is_primary: i === 0 })),
        });
        toast.success('Create success!');
      }
      router.push(paths.dashboard.classifieds.root);
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
          <Field.Select name="category" label="Category">
            {CLASSIFIED_CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c.replace('_', ' ')}
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

          <Field.Text name="title" label="Title" />
          <Field.Text name="city" label="City" />

          <Field.Select name="price_kind" label="Price kind">
            {CLASSIFIED_PRICE_KINDS.map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </Field.Select>
          <Field.Text name="price" label="Price" type="number" />

          <Field.Text name="contact_phone" label="Contact phone" />
          <Field.Text name="contact_email" label="Contact email" />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Field.Text name="description" label="Description" multiline rows={4} />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Images
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
                  No images.
                </Typography>
              )}
            </Box>
          ) : (
            <ClassifiedImagesUpload value={imageIds} onChange={setImageIds} />
          )}
        </Box>

        <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {currentClassified ? 'Save changes' : 'Create classified'}
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}
