'use client';

import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

export function ContactForm({ sx, ...other }: BoxProps) {
  const { t } = useTranslate(['contact', 'common']);

  return (
    <Box sx={sx} {...other}>
      <Typography variant="h3">{t('form.title')}</Typography>
      <Box
        sx={{
          my: 5,
          gap: 3,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <TextField fullWidth label={t('common:form.name')} />
        <TextField fullWidth label={t('common:form.email')} />
        <TextField fullWidth label={t('common:form.subject')} />
        <TextField fullWidth label={t('common:form.message')} multiline rows={4} />
      </Box>

      <Button size="large" variant="contained">
        {t('common:form.submit')}
      </Button>
    </Box>
  );
}
