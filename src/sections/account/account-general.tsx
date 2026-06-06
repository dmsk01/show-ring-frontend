'use client';

import type { TFunction } from 'i18next';

import * as z from 'zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { fData } from 'src/utils/format-number';

import { useTranslate } from 'src/locales';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

import { useMockedUser } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export const getAccountGeneralSchema = (t: TFunction) =>
  z.object({
    displayName: z.string().min(1, { error: t('validation.nameRequired') }),
    email: schemaUtils.email(),
    photoURL: schemaUtils.file({ error: t('validation.avatarRequired') }),
    phoneNumber: schemaUtils.phoneNumber({ isValid: isValidPhoneNumber }),
    country: schemaUtils.nullableInput(z.string().min(1, { error: t('validation.countryRequired') }), {
      error: t('validation.countryRequired'),
    }),
    address: z.string().min(1, { error: t('validation.addressRequired') }),
    state: z.string().min(1, { error: t('validation.stateRequired') }),
    city: z.string().min(1, { error: t('validation.cityRequired') }),
    zipCode: z.string().min(1, { error: t('validation.zipCodeRequired') }),
    about: z.string().min(1, { error: t('validation.aboutRequired') }),
    // Not required
    isPublic: z.boolean(),
  });

export type UpdateUserSchemaType = z.infer<ReturnType<typeof getAccountGeneralSchema>>;

// ----------------------------------------------------------------------

export function AccountGeneral() {
  const { t } = useTranslate('account');
  const { user } = useMockedUser();

  const schema = useMemo(() => getAccountGeneralSchema(t), [t]);

  const currentUser: UpdateUserSchemaType = {
    displayName: user?.displayName,
    email: user?.email,
    photoURL: user?.photoURL,
    phoneNumber: user?.phoneNumber,
    country: user?.country,
    address: user?.address,
    state: user?.state,
    city: user?.city,
    zipCode: user?.zipCode,
    about: user?.about,
    isPublic: user?.isPublic,
  };

  const defaultValues: UpdateUserSchemaType = {
    displayName: '',
    email: '',
    photoURL: null,
    phoneNumber: '',
    country: null,
    address: '',
    state: '',
    city: '',
    zipCode: '',
    about: '',
    isPublic: false,
  };

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(schema),
    defaultValues,
    values: currentUser,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(t('toast.updated'));
      console.info('DATA', data);
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              pt: 10,
              pb: 5,
              px: 3,
              textAlign: 'center',
            }}
          >
            <Field.UploadAvatar
              name="photoURL"
              maxSize={3145728}
              helperText={
                <Typography
                  variant="caption"
                  sx={{
                    mt: 3,
                    mx: 'auto',
                    display: 'block',
                    textAlign: 'center',
                    color: 'text.disabled',
                  }}
                >
                  {t('general.allowedFormats')}
                  <br /> {t('general.maxSize', { size: fData(3145728) })}
                </Typography>
              }
            />

            <Field.Switch
              name="isPublic"
              labelPlacement="start"
              label={t('general.publicProfile')}
              sx={{ mt: 5 }}
            />

            <Button variant="soft" color="error" sx={{ mt: 3 }}>
              {t('general.deleteUser')}
            </Button>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3 }}>
            <Box
              sx={{
                rowGap: 3,
                columnGap: 2,
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
              }}
            >
              <Field.Text name="displayName" label={t('general.fields.name')} />
              <Field.Text name="email" label={t('general.fields.email')} />
              <Field.Phone name="phoneNumber" label={t('general.fields.phone')} />
              <Field.Text name="address" label={t('general.fields.address')} />

              <Field.CountrySelect
                name="country"
                label={t('general.fields.country')}
                placeholder={t('general.fields.countryPlaceholder')}
              />

              <Field.Text name="state" label={t('general.fields.state')} />
              <Field.Text name="city" label={t('general.fields.city')} />
              <Field.Text name="zipCode" label={t('general.fields.zipCode')} />
            </Box>

            <Stack spacing={3} sx={{ mt: 3, alignItems: 'flex-end' }}>
              <Field.Text name="about" multiline rows={4} label={t('general.fields.about')} />

              <Button type="submit" variant="contained" loading={isSubmitting}>
                {t('common:actions.save')}
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
