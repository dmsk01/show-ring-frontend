'use client';

import type { TFunction } from 'i18next';
import type { IPostItem } from 'src/types/blog';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useCallback } from 'react';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { _tags } from 'src/_mock';
import { useTranslate } from 'src/locales';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

import { PostDetailsPreview } from './post-details-preview';

// ----------------------------------------------------------------------

export const getPostSchema = (t: TFunction) =>
  z.object({
    title: z.string().min(1, { error: t('form.validation.titleRequired') }),
    description: z.string().min(1, { error: t('form.validation.descriptionRequired') }),
    content: schemaUtils.editor().min(100, { error: t('form.validation.contentMin') }),
    coverUrl: schemaUtils.file({ error: t('form.validation.coverRequired') }),
    tags: z.string().array().min(2, { error: t('form.validation.tagsMin') }),
    metaKeywords: z.string().array().min(1, { error: t('form.validation.metaKeywordsRequired') }),
    // Not required
    metaTitle: z.string(),
    metaDescription: z.string(),
  });

export type PostCreateSchemaType = z.infer<ReturnType<typeof getPostSchema>>;

// ----------------------------------------------------------------------

type Props = {
  currentPost?: IPostItem;
};

export function PostCreateEditForm({ currentPost }: Props) {
  const router = useRouter();
  const { t } = useTranslate(['blog', 'common']);

  const showPreview = useBoolean();
  const openDetails = useBoolean(true);
  const openProperties = useBoolean(true);

  const schema = useMemo(() => getPostSchema(t), [t]);

  const defaultValues: PostCreateSchemaType = {
    title: '',
    description: '',
    content: '',
    coverUrl: null,
    tags: [],
    metaKeywords: [],
    metaTitle: '',
    metaDescription: '',
  };

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(schema),
    defaultValues,
    values: currentPost,
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = methods;

  const values = watch();

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      reset();
      showPreview.onFalse();
      toast.success(currentPost ? t('toast.updated') : t('toast.created'));
      router.push(paths.dashboard.post.root);
      console.info('DATA', data);
    } catch (error) {
      console.error(error);
    }
  });

  const handleRemoveFile = useCallback(() => {
    setValue('coverUrl', null);
  }, [setValue]);

  const renderCollapseButton = (value: boolean, onToggle: () => void) => (
    <IconButton onClick={onToggle}>
      <Iconify icon={value ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'} />
    </IconButton>
  );

  const renderDetails = () => (
    <Card>
      <CardHeader
        title={t('form.details.title')}
        subheader={t('form.details.subheader')}
        action={renderCollapseButton(openDetails.value, openDetails.onToggle)}
        sx={{ mb: 3 }}
      />

      <Collapse in={openDetails.value}>
        <Divider />

        <Stack spacing={3} sx={{ p: 3 }}>
          <Field.Text name="title" label={t('form.details.postTitle')} />

          <Field.Text name="description" label={t('form.details.description')} multiline rows={3} />

          <Stack spacing={1.5}>
            <Typography variant="subtitle2">{t('form.details.content')}</Typography>
            <Field.Editor name="content" sx={{ maxHeight: 480 }} />
          </Stack>

          <Stack spacing={1.5}>
            <Typography variant="subtitle2">{t('form.details.cover')}</Typography>
            <Field.Upload name="coverUrl" maxSize={3145728} onDelete={handleRemoveFile} />
          </Stack>
        </Stack>
      </Collapse>
    </Card>
  );

  const renderProperties = () => (
    <Card>
      <CardHeader
        title={t('form.properties.title')}
        subheader={t('form.properties.subheader')}
        action={renderCollapseButton(openProperties.value, openProperties.onToggle)}
        sx={{ mb: 3 }}
      />

      <Collapse in={openProperties.value}>
        <Divider />

        <Stack spacing={3} sx={{ p: 3 }}>
          <Field.Autocomplete
            name="tags"
            label={t('form.properties.tags')}
            placeholder={t('form.properties.tagsPlaceholder')}
            multiple
            freeSolo
            disableCloseOnSelect
            options={_tags.map((option) => option)}
            getOptionLabel={(option) => option}
            slotProps={{
              chip: { color: 'info' },
            }}
          />

          <Field.Text name="metaTitle" label={t('form.properties.metaTitle')} />

          <Field.Text
            name="metaDescription"
            label={t('form.properties.metaDescription')}
            fullWidth
            multiline
            rows={3}
          />

          <Field.Autocomplete
            name="metaKeywords"
            label={t('form.properties.metaKeywords')}
            placeholder={t('form.properties.metaKeywordsPlaceholder')}
            multiple
            freeSolo
            disableCloseOnSelect
            options={_tags.map((option) => option)}
            getOptionLabel={(option) => option}
            slotProps={{
              chip: { color: 'info' },
            }}
          />

          <FormControlLabel
            label={t('form.properties.enableComments')}
            control={<Switch defaultChecked slotProps={{ input: { id: 'comments-switch' } }} />}
          />
        </Stack>
      </Collapse>
    </Card>
  );

  const renderActions = () => (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      <FormControlLabel
        label={t('form.properties.publish')}
        control={<Switch defaultChecked slotProps={{ input: { id: 'publish-switch' } }} />}
        sx={{ pl: 3, flexGrow: 1 }}
      />

      <div>
        <Button color="inherit" variant="outlined" size="large" onClick={showPreview.onTrue}>
          {t('form.preview')}
        </Button>

        <Button
          type="submit"
          variant="contained"
          size="large"
          loading={isSubmitting}
          sx={{ ml: 2 }}
        >
          {!currentPost ? t('form.submitCreate') : t('form.submitUpdate')}
        </Button>
      </div>
    </Box>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={5} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        {renderDetails()}
        {renderProperties()}
        {renderActions()}
      </Stack>

      <PostDetailsPreview
        isValid={isValid}
        onSubmit={onSubmit}
        title={values.title}
        open={showPreview.value}
        content={values.content}
        onClose={showPreview.onFalse}
        coverUrl={values.coverUrl}
        isSubmitting={isSubmitting}
        description={values.description}
      />
    </Form>
  );
}
