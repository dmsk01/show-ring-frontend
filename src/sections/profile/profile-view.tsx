'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetMe, updateMyProfile, useGetMyProfile } from 'src/actions/account';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

type ProfileSchemaType = z.infer<typeof ProfileSchema>;

const ProfileSchema = z.object({
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  patronymic: z.string().nullable(),
  country: z.string().nullable(),
});

export function ProfileView() {
  const { me, meLoading } = useGetMe();
  const { profile, profileLoading } = useGetMyProfile();

  const methods = useForm<ProfileSchemaType>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: { first_name: '', last_name: '', patronymic: '', country: '' },
    values: profile
      ? {
          first_name: profile.first_name ?? '',
          last_name: profile.last_name ?? '',
          patronymic: profile.patronymic ?? '',
          country: profile.country ?? '',
        }
      : undefined,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await updateMyProfile({
        first_name: data.first_name || null,
        last_name: data.last_name || null,
        patronymic: data.patronymic || null,
        country: data.country || null,
      });
      toast.success('Profile updated!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    }
  });

  if (meLoading || profileLoading) return <LoadingScreen />;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="My profile"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Profile' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Account
            </Typography>
            <Stack spacing={1.5}>
              <Typography variant="body2">
                Email: <strong>{me?.email}</strong>
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">Email verified:</Typography>
                <Label color={me?.is_email_verified ? 'success' : 'warning'}>
                  {me?.is_email_verified ? 'Yes' : 'No'}
                </Label>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">Roles:</Typography>
                {me?.roles?.length ? (
                  me.roles.map((r) => (
                    <Label key={r.role} color="info">
                      {r.role}
                    </Label>
                  ))
                ) : (
                  <Typography variant="body2">—</Typography>
                )}
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3 }}>
            <Form methods={methods} onSubmit={onSubmit}>
              <Box
                sx={{
                  rowGap: 3,
                  columnGap: 2,
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                }}
              >
                <Field.Text name="first_name" label="First name" />
                <Field.Text name="last_name" label="Last name" />
                <Field.Text name="patronymic" label="Patronymic" />
                <Field.Text name="country" label="Country" />
              </Box>

              <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
                <Button type="submit" variant="contained" loading={isSubmitting}>
                  Save changes
                </Button>
              </Stack>
            </Form>
          </Card>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
