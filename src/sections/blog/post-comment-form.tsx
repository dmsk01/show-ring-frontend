'use client';

import type { TFunction } from 'i18next';

import * as z from 'zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export const getCommentSchema = (t: TFunction) =>
  z.object({
    comment: z.string().min(1, { error: t('form.validation.commentRequired') }),
  });

export type CommentSchemaType = z.infer<ReturnType<typeof getCommentSchema>>;

// ----------------------------------------------------------------------

export function PostCommentForm() {
  const { t } = useTranslate(['blog', 'common']);

  const schema = useMemo(() => getCommentSchema(t), [t]);

  const defaultValues: CommentSchemaType = {
    comment: '',
  };

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      reset();
      console.info('DATA', data);
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
        <Field.Text
          name="comment"
          placeholder={t('comments.placeholder')}
          multiline
          rows={4}
        />

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <IconButton>
              <Iconify icon="solar:gallery-add-bold" />
            </IconButton>

            <IconButton>
              <Iconify icon="eva:attach-2-fill" />
            </IconButton>

            <IconButton>
              <Iconify icon="eva:smiling-face-fill" />
            </IconButton>
          </Box>

          <Button type="submit" variant="contained" loading={isSubmitting}>
            {t('comments.postComment')}
          </Button>
        </Box>
      </Box>
    </Form>
  );
}
