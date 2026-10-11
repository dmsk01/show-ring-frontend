'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { MaintenanceIllustration } from 'src/assets/illustrations';

// ----------------------------------------------------------------------

export function MaintenanceView() {
  const { t } = useTranslate('common');

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
      <Typography variant="h3" component="h1" sx={{ mb: 2 }}>
        {t('errorPages.maintenanceTitle')}
      </Typography>

      <Typography sx={{ color: 'text.secondary' }}>{t('errorPages.maintenanceText')}</Typography>

      <MaintenanceIllustration sx={{ my: { xs: 5, sm: 10 } }} />

      <Button component={RouterLink} href="/" size="large" variant="contained">
        {t('errorPages.goHome')}
      </Button>
    </Box>
  );
}
