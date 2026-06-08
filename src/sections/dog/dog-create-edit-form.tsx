'use client';

import type { TFunction } from 'i18next';
import type { IDogItem } from 'src/types/dog';

import * as z from 'zod';
import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { fileUrl, uploadFile } from 'src/actions/file';
import { useGetBreeds, useGetKennels } from 'src/actions/reference';
import { createDog, updateDog, useGetDogs, addDogImages } from 'src/actions/dog';

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
    photos: z.array(z.union([z.string(), z.file()])),
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

  // Parents must match sex: fathers are males, mothers are females. Exclude self.
  const maleDogs = useMemo(
    () => dogs.filter((dog) => dog.id !== currentDog?.id && dog.sex === 'male'),
    [dogs, currentDog?.id]
  );
  const femaleDogs = useMemo(
    () => dogs.filter((dog) => dog.id !== currentDog?.id && dog.sex === 'female'),
    [dogs, currentDog?.id]
  );

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
    photos: [],
  };

  // Existing images (avatar first), shown as preview URLs in the upload field.
  const existingPhotoUrls = currentDog
    ? [currentDog.avatar_file_id, ...currentDog.photo_file_ids]
        .filter((v, i, arr): v is string => !!v && arr.indexOf(v) === i)
        .map((fid) => fileUrl(fid))
    : [];

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
          photos: existingPhotoUrls,
        }
      : undefined,
  });

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const photos = watch('photos');
  const fatherId = watch('father_id');
  const motherId = watch('mother_id');

  // Clear a parent selection that no longer matches the allowed sex (e.g. left
  // over from before the lists loaded) so we never submit an out-of-range value.
  useEffect(() => {
    if (!dogs.length) return;
    if (fatherId && !maleDogs.some((dog) => dog.id === fatherId)) {
      setValue('father_id', '');
    }
    if (motherId && !femaleDogs.some((dog) => dog.id === motherId)) {
      setValue('mother_id', '');
    }
  }, [dogs.length, fatherId, motherId, maleDogs, femaleDogs, setValue]);

  const handleRemovePhoto = useCallback(
    (inputFile: File | string) => {
      setValue(
        'photos',
        photos.filter((file) => file !== inputFile),
        { shouldValidate: true }
      );
    },
    [photos, setValue]
  );

  const handleRemoveAllPhotos = useCallback(() => {
    setValue('photos', [], { shouldValidate: true });
  }, [setValue]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const { photos: photoValues, ...rest } = data;
      const payload = {
        ...rest,
        kennel_id: rest.kennel_id || null,
        father_id: rest.father_id || null,
        mother_id: rest.mother_id || null,
        // Backend expects a plain date (YYYY-MM-DD); the picker stores a full ISO string.
        date_of_birth: rest.date_of_birth ? dayjs(rest.date_of_birth).format('YYYY-MM-DD') : null,
      };

      const dog = currentDog
        ? await updateDog(currentDog.id, payload)
        : await createDog(payload);

      // Newly dropped files (strings are already-attached previews — skip them).
      const newFiles = photoValues.filter((p): p is File => p instanceof File);
      if (newFiles.length) {
        const uploaded = await Promise.all(newFiles.map((file) => uploadFile(file)));
        // Make the first photo the avatar only when the dog has none yet.
        const hasAvatar = !!dog.avatar_file_id;
        await addDogImages(
          dog.id,
          uploaded.map((f, i) => ({
            file_id: f.id,
            position: i,
            is_primary: !hasAvatar && i === 0,
          }))
        );
      }

      toast.success(currentDog ? t('toast.updated') : t('toast.created'));
      // Land on the dog we just saved so its data/photos are immediately visible.
      router.push(paths.dashboard.dogs.details(dog.id));
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
            {maleDogs.map((dog) => (
              <MenuItem key={dog.id} value={dog.id}>
                {dog.name}
              </MenuItem>
            ))}
          </Field.Select>
          <Field.Select name="mother_id" label={t('form.fields.mother')}>
            <MenuItem value="">—</MenuItem>
            {femaleDogs.map((dog) => (
              <MenuItem key={dog.id} value={dog.id}>
                {dog.name}
              </MenuItem>
            ))}
          </Field.Select>
          <Field.DatePicker
            name="date_of_birth"
            label={t('form.fields.dateOfBirth')}
            format="DD.MM.YYYY"
          />
          <Field.Text name="color" label={t('form.fields.color')} />
          <Field.Text name="rkf_number" label={t('form.fields.rkfNumber')} />
          <Field.Text name="tattoo" label={t('form.fields.tattoo')} />
          <Field.Text name="microchip" label={t('form.fields.microchip')} />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Field.Text name="description" label={t('form.fields.description')} multiline rows={3} />
        </Box>

        <Stack spacing={1.5} sx={{ mt: 3 }}>
          <Typography variant="subtitle2">{t('form.fields.photos')}</Typography>
          <Field.Upload
            multiple
            name="photos"
            maxSize={5242880}
            onRemove={handleRemovePhoto}
            onRemoveAll={handleRemoveAllPhotos}
          />
        </Stack>

        <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {currentDog ? t('form.submitUpdate') : t('form.submitCreate')}
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}
