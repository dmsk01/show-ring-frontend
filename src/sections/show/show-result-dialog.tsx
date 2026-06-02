'use client';

import type { ReferenceRecord } from 'src/actions/admin-reference';
import type { IShowEntry, IShowResult } from 'src/types/show-result';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { createShowResult, updateShowResult } from 'src/actions/show-result';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const ResultSchema = z.object({
  grade_id: z.string().nullable(),
  placement: z.string().nullable(),
  critique: z.string().nullable(),
});

type ResultSchemaType = z.infer<typeof ResultSchema>;

type Props = {
  showId: string;
  entry: IShowEntry;
  result?: IShowResult;
  gradeOptions: ReferenceRecord[];
  open: boolean;
  onClose: () => void;
};

export function ShowResultDialog({ showId, entry, result, gradeOptions, open, onClose }: Props) {
  const methods = useForm<ResultSchemaType>({
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
        toast.success('Result updated!');
      } else {
        await createShowResult(showId, { show_entry_id: entry.id, ...payload });
        toast.success('Result saved!');
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Result — catalog #{entry.catalog_number ?? '—'}</DialogTitle>

        <DialogContent>
          <Box sx={{ pt: 1, gap: 2.5, display: 'flex', flexDirection: 'column' }}>
            <Field.Select name="grade_id" label="Grade">
              <MenuItem value="">—</MenuItem>
              {gradeOptions.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.name}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Text name="placement" label="Placement" type="number" />
            <Field.Text name="critique" label="Critique" multiline rows={3} />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button color="inherit" variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            Save
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
