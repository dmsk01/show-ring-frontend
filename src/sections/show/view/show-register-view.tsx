'use client';

import type { IDogItem } from 'src/types/dog';
import type { IShowItem } from 'src/types/show';
import type { IShowEntry } from 'src/types/show-entry';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { useGetShow } from 'src/actions/show';
import { useGetMyDogs } from 'src/actions/dog';
import { createShowEntry, useMyShowEntries, useAvailableClasses } from 'src/actions/show-entry';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

import { canRegisterForShow } from '../show-utils';

// ----------------------------------------------------------------------

type Props = { id: string };

export function ShowRegisterView({ id }: Props) {
  const { t } = useTranslate(['show', 'common']);
  const { show, showLoading } = useGetShow(id);
  const { dogs, dogsLoading, dogsEmpty } = useGetMyDogs();
  const { entries } = useMyShowEntries(id);

  if (showLoading || dogsLoading) return <LoadingScreen />;

  if (!show) {
    return (
      <Container sx={{ pt: { xs: 8, md: 12 }, pb: 10 }}>
        <Typography>{t('detail.notFound')}</Typography>
      </Container>
    );
  }

  const canRegister = canRegisterForShow(show.status, show.registration_deadline);

  return (
    <Container sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 }, maxWidth: 720 }}>
      <Stack spacing={1} sx={{ mb: 4 }}>
        <Button
          component={RouterLink}
          href={paths.showcase.show(id)}
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          sx={{ alignSelf: 'flex-start' }}
          color="inherit"
        >
          {show.name}
        </Button>
        <Typography variant="h4">{t('register.heading')}</Typography>
      </Stack>

      {!canRegister ? (
        <Alert severity="info">{t('register.unavailable')}</Alert>
      ) : dogsEmpty ? (
        <EmptyContent
          filled
          title={t('register.noDogs.title')}
          description={t('register.noDogs.description')}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.dogs.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              sx={{ mt: 3 }}
            >
              {t('register.noDogs.action')}
            </Button>
          }
          sx={{ py: 8 }}
        />
      ) : (
        <RegisterForm show={show} dogs={dogs} entries={entries} />
      )}
    </Container>
  );
}

// ----------------------------------------------------------------------

type FormProps = {
  show: IShowItem;
  dogs: IDogItem[];
  entries: IShowEntry[];
};

function RegisterForm({ show, dogs, entries }: FormProps) {
  const { t } = useTranslate(['show', 'common']);
  const router = useRouter();

  const RegisterSchema = useMemo(
    () =>
      z.object({
        dog_id: z.string().min(1, { error: t('register.validation.dogRequired') }),
        show_class_id: z.string().min(1, { error: t('register.validation.classRequired') }),
        notes: z.string().nullable(),
      }),
    [t]
  );

  type RegisterSchemaType = z.infer<typeof RegisterSchema>;

  const methods = useForm<RegisterSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(RegisterSchema),
    defaultValues: { dog_id: '', show_class_id: '', notes: null },
  });

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const dogId = watch('dog_id');
  const classId = watch('show_class_id');

  const { classes, classesLoading } = useAvailableClasses(show.id, dogId || undefined);

  // При смене собаки сбрасываем выбранный класс (классы зависят от собаки).
  useEffect(() => {
    setValue('show_class_id', '');
  }, [dogId, setValue]);

  // Уже записанные пары собака↔класс — чтобы не плодить дубли.
  const registeredPairs = useMemo(
    () => new Set(entries.map((e) => `${e.dog_id}:${e.show_class_id}`)),
    [entries]
  );
  const isDuplicate = !!dogId && !!classId && registeredPairs.has(`${dogId}:${classId}`);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await createShowEntry(show.id, {
        dog_id: data.dog_id,
        show_class_id: data.show_class_id,
        notes: data.notes || null,
      });
      toast.success(t('register.toast.success'));
      router.push(paths.showcase.show(show.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('register.toast.failed'));
    }
  });

  const noClasses = !!dogId && !classesLoading && classes.length === 0;

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
        {entries.length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('register.myEntries')}
            </Typography>
            <Stack spacing={0.5} sx={{ mb: 2 }}>
              {entries.map((entry) => {
                const dog = dogs.find((d) => d.id === entry.dog_id);
                return (
                  <Typography key={entry.id} variant="body2" sx={{ color: 'text.secondary' }}>
                    • {dog?.name ?? entry.dog_id}
                    {entry.catalog_number != null ? ` — №${entry.catalog_number}` : ''}
                  </Typography>
                );
              })}
            </Stack>
            <Divider sx={{ borderStyle: 'dashed', mb: 3 }} />
          </>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Field.Select name="dog_id" label={t('register.fields.dog')}>
            <MenuItem value="">—</MenuItem>
            {dogs.map((dog) => (
              <MenuItem key={dog.id} value={dog.id}>
                {dog.name}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Select
            name="show_class_id"
            label={t('register.fields.class')}
            disabled={!dogId || classesLoading || classes.length === 0}
            helperText={
              !dogId
                ? t('register.fields.classHint')
                : noClasses
                  ? t('register.noClasses')
                  : undefined
            }
          >
            <MenuItem value="">—</MenuItem>
            {classes.map((cls) => (
              <MenuItem key={cls.id} value={cls.id}>
                {cls.name}
                {cls.requires_documents ? ` — ${t('register.requiresDocuments')}` : ''}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Text name="notes" label={t('register.fields.notes')} multiline rows={2} />
        </Box>

        {isDuplicate && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {t('register.duplicate')}
          </Alert>
        )}

        <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            loading={isSubmitting}
            disabled={isDuplicate}
            startIcon={<Iconify icon="solar:user-plus-bold" />}
          >
            {t('register.submit')}
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}
