'use client';

import type { IShowItem } from 'src/types/show';
import type { IShowEntry } from 'src/types/show-entry';

import * as z from 'zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useTranslate } from 'src/locales';
import { updateShowEntry, useAvailableClasses } from 'src/actions/show-entry';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { registeredClassIds } from './my-show-utils';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  show: IShowItem;
  entry: IShowEntry;
  entries: IShowEntry[];
};

export function MyShowEntryEditDialog({ open, onClose, show, entry, entries }: Props) {
  const { t } = useTranslate(['show', 'common']);

  const Schema = useMemo(
    () =>
      z.object({
        show_class_id: z.string().min(1, { error: t('register.validation.classRequired') }),
        notes: z.string().nullable(),
      }),
    [t]
  );
  type SchemaType = z.infer<typeof Schema>;

  const methods = useForm<SchemaType>({
    resolver: zodResolver(Schema),
    defaultValues: { show_class_id: entry.show_class_id, notes: entry.notes },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const { classes, classesLoading } = useAvailableClasses(show.id, entry.dog_id);
  const taken = registeredClassIds(entries, entry.dog_id, entry.id);

  // Значение Select по умолчанию — текущий класс записи, но `classes` грузятся
  // асинхронно: пока их нет (или если собака уже выросла из класса), значение
  // окажется «вне диапазона» опций → MUI-варнинг и молчаливый сброс. Держим
  // текущий класс как fallback-опцию, чтобы значение всегда было валидным.
  const hasCurrentClass = classes.some((cls) => cls.id === entry.show_class_id);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await updateShowEntry(show.id, entry.id, {
        show_class_id: data.show_class_id,
        notes: data.notes || null,
      });
      toast.success(t('myShows.toast.updated'));
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('myShows.toast.failed'));
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>{t('myShows.editDialog.title')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label={t('myShows.editDialog.dogReadonly')}
              value={entry.dog_name}
              disabled
            />
            <Field.Select
              name="show_class_id"
              label={t('myShows.editDialog.fields.class')}
              disabled={classesLoading}
            >
              {!hasCurrentClass && (
                <MenuItem value={entry.show_class_id}>{entry.class_name}</MenuItem>
              )}
              {classes.map((cls) => (
                <MenuItem key={cls.id} value={cls.id} disabled={taken.has(cls.id)}>
                  {cls.name}
                </MenuItem>
              ))}
            </Field.Select>
            <Field.Text
              name="notes"
              label={t('myShows.editDialog.fields.notes')}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={onClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {t('myShows.editDialog.submit')}
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
