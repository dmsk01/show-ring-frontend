'use client';

import type { ReferenceTypeConfig } from './reference-config';
import type { ReferenceRecord } from 'src/actions/admin-reference';

import * as z from 'zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { useTranslate } from 'src/locales';
import { createReference, updateReference, useReferenceList } from 'src/actions/admin-reference';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { ANIMAL_TYPES_LIST_URL } from './reference-config';

// ----------------------------------------------------------------------

type FormValues = Record<string, unknown>;

function getReferenceSchema(config: ReferenceTypeConfig, t: (key: string, opts?: Record<string, unknown>) => string) {
  const shape: Record<string, z.ZodType> = {};
  config.fields.forEach((f) => {
    if (f.kind === 'switch') {
      shape[f.name] = z.boolean();
    } else {
      const fieldLabel = t(`reference.types.${config.key}.fields.${f.name}`);
      shape[f.name] = f.required
        ? z.string().min(1, { error: t('reference.form.validation.required', { field: fieldLabel }) })
        : z.string();
    }
  });
  return z.object(shape);
}

function buildDefaults(config: ReferenceTypeConfig, item?: ReferenceRecord): FormValues {
  const values: FormValues = {};
  config.fields.forEach((f) => {
    const raw = item?.[f.name];
    if (f.kind === 'switch') values[f.name] = Boolean(raw);
    else values[f.name] = raw == null ? '' : String(raw);
  });
  return values;
}

type Props = {
  config: ReferenceTypeConfig;
  currentItem?: ReferenceRecord;
  open: boolean;
  onClose: () => void;
};

export function ReferenceFormDialog({ config, currentItem, open, onClose }: Props) {
  const { t } = useTranslate(['admin', 'common']);
  const { items: animalTypes } = useReferenceList(ANIMAL_TYPES_LIST_URL);

  const schema = useMemo(() => getReferenceSchema(config, t), [config, t]);

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(config),
    values: currentItem ? buildDefaults(config, currentItem) : undefined,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload: Record<string, unknown> = {};
      config.fields.forEach((f) => {
        const v = data[f.name];
        if (f.kind === 'switch') payload[f.name] = Boolean(v);
        else if (f.kind === 'number') payload[f.name] = v ? Number(v) : f.required ? Number(v) : null;
        else payload[f.name] = v || (f.required ? v : null);
      });

      if (currentItem) {
        await updateReference(config.adminUrl, config.listUrl, currentItem.id, payload);
        toast.success(t('reference.toast.updated'));
      } else {
        await createReference(config.adminUrl, config.listUrl, payload);
        toast.success(t('reference.toast.created'));
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('reference.toast.saveFailed'));
    }
  });

  const typeLabel = t(`reference.types.${config.key}.label`).toLowerCase();
  const dialogTitle = currentItem
    ? `${t('reference.form.titleEdit')} ${typeLabel}`
    : `${t('reference.form.titleCreate')} ${typeLabel}`;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>{dialogTitle}</DialogTitle>

        <DialogContent>
          <Box sx={{ pt: 1, gap: 2.5, display: 'flex', flexDirection: 'column' }}>
            {config.fields.map((f) => {
              const fieldLabel = t(`reference.types.${config.key}.fields.${f.name}`);
              if (f.kind === 'switch') {
                return <Field.Switch key={f.name} name={f.name} label={fieldLabel} />;
              }
              if (f.kind === 'animalType') {
                return (
                  <Field.Select key={f.name} name={f.name} label={fieldLabel}>
                    <MenuItem value="">—</MenuItem>
                    {animalTypes.map((opt) => (
                      <MenuItem key={opt.id} value={opt.id}>
                        {opt.name}
                      </MenuItem>
                    ))}
                  </Field.Select>
                );
              }
              return (
                <Field.Text
                  key={f.name}
                  name={f.name}
                  label={fieldLabel}
                  type={f.kind === 'number' ? 'number' : 'text'}
                />
              );
            })}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button color="inherit" variant="outlined" onClick={onClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {currentItem ? t('common:actions.save') : t('common:actions.create')}
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
