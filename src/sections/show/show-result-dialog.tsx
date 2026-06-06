'use client';

import type { TFunction } from 'i18next';
import type { ReferenceRecord } from 'src/actions/admin-reference';
import type { IShowEntry, IShowResult } from 'src/types/show-result';

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
import { createShowResult, updateShowResult } from 'src/actions/show-result';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export function getShowResultSchema(_t: TFunction<['show', 'common']>) {
  return z.object({
    grade_id: z.string().nullable(),
    placement: z.string().nullable(),
    critique: z.string().nullable(),
  });
}

export type ShowResultSchemaType = z.infer<ReturnType<typeof getShowResultSchema>>;

type Props = {
  showId: string;
  entry: IShowEntry;
  result?: IShowResult;
  gradeOptions: ReferenceRecord[];
  open: boolean;
  onClose: () => void;
};

export function ShowResultDialog({ showId, entry, result, gradeOptions, open, onClose }: Props) {
  const { t } = useTranslate(['show', 'common']);

  const ResultSchema = useMemo(() => getShowResultSchema(t), [t]);

  const methods = useForm<ShowResultSchemaType>({
    resolver: zodResolver(ResultSchema),
    defaultValues: {
      grade_id: result?.grade_id ?? '',
      placement: result?.placement?.toString() ?? '',
      critique: result?.critique ?? '',
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        grade_id: data.grade_id || null,
        placement: data.placement ? Number(data.placement) : null,
        critique: data.critique || null,
      };

      if (result) {
        await updateShowResult(showId, result.id, payload);
        toast.success(t('toast.updated'));
      } else {
        await createShowResult(showId, { show_entry_id: entry.id, ...payload });
        toast.success(t('toast.created'));
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common:state.error'));
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>
          {t('resultDialog.title', { number: entry.catalog_number ?? '—' })}
        </DialogTitle>

        <DialogContent>
          <Box sx={{ pt: 1, gap: 2.5, display: 'flex', flexDirection: 'column' }}>
            <Field.Select name="grade_id" label={t('resultDialog.fields.grade')}>
              <MenuItem value="">—</MenuItem>
              {gradeOptions.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.name}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Text name="placement" label={t('resultDialog.fields.placement')} type="number" />
            <Field.Text name="critique" label={t('resultDialog.fields.critique')} multiline rows={3} />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button color="inherit" variant="outlined" onClick={onClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {t('common:actions.save')}
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
