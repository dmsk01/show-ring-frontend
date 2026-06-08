'use client';

import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ListItemButton from '@mui/material/ListItemButton';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const CATEGORY_ICONS = [
  `${CONFIG.assetsDir}/assets/icons/faqs/ic-account.svg`,
  `${CONFIG.assetsDir}/assets/icons/faqs/ic-package.svg`,
  `${CONFIG.assetsDir}/assets/icons/faqs/ic-delivery.svg`,
  `${CONFIG.assetsDir}/assets/icons/faqs/ic-assurances.svg`,
  `${CONFIG.assetsDir}/assets/icons/faqs/ic-payment.svg`,
  `${CONFIG.assetsDir}/assets/icons/faqs/ic-refund.svg`,
];

// ----------------------------------------------------------------------

export function FaqsCategory() {
  const { t } = useTranslate('faqs');

  const navOpen = useBoolean();

  const labels = t('categories', { returnObjects: true }) as string[];

  const categories = labels.map((label, index) => ({
    label,
    icon: CATEGORY_ICONS[index] ?? CATEGORY_ICONS[0],
  }));

  const renderMobile = () => (
    <>
      <Box
        sx={[
          (theme) => ({
            p: 2,
            top: 0,
            left: 0,
            width: 1,
            position: 'absolute',
            display: { xs: 'block', md: 'none' },
            borderBottom: `solid 1px ${theme.vars.palette.divider}`,
          }),
        ]}
      >
        <Button startIcon={<Iconify icon="solar:list-bold" />} onClick={navOpen.onTrue}>
          {t('categoriesLabel')}
        </Button>
      </Box>

      <Drawer open={navOpen.value} onClose={navOpen.onFalse}>
        <Box
          sx={{
            p: 1,
            gap: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
          }}
        >
          {categories.map((category) => (
            <ItemMobile key={category.label} category={category} />
          ))}
        </Box>
      </Drawer>
    </>
  );

  const renderDesktop = () => (
    <Box
      sx={{
        gap: 3,
        display: { xs: 'none', md: 'grid' },
        gridTemplateColumns: { md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' },
      }}
    >
      {categories.map((category) => (
        <ItemDesktop key={category.label} category={category} />
      ))}
    </Box>
  );

  return (
    <>
      {renderMobile()}
      {renderDesktop()}
    </>
  );
}

// ----------------------------------------------------------------------

type ItemProps = {
  category: { label: string; icon: string };
};

function ItemDesktop({ category }: ItemProps) {
  return (
    <Paper
      variant="outlined"
      sx={[
        (theme) => ({
          p: 3,
          borderRadius: 2,
          bgcolor: 'unset',
          cursor: 'pointer',
          textAlign: 'center',
          '&:hover': {
            bgcolor: 'background.paper',
            boxShadow: theme.vars.customShadows.z20,
          },
        }),
      ]}
    >
      <Box
        component="img"
        alt={category.icon}
        src={category.icon}
        sx={{
          mb: 2,
          width: 80,
          height: 80,
          mx: 'auto',
        }}
      />

      <Typography
        variant="subtitle2"
        sx={(theme) => ({
          ...theme.mixins.maxLine({ line: 2, persistent: theme.typography.subtitle2 }),
        })}
      >
        {category.label}
      </Typography>
    </Paper>
  );
}

// ----------------------------------------------------------------------

function ItemMobile({ category }: ItemProps) {
  return (
    <ListItemButton
      key={category.label}
      sx={[
        {
          py: 2,
          maxWidth: 140,
          borderRadius: 1,
          textAlign: 'center',
          alignItems: 'center',
          typography: 'subtitle2',
          flexDirection: 'column',
          justifyContent: 'center',
          bgcolor: 'background.neutral',
        },
      ]}
    >
      <Box
        component="img"
        alt={category.icon}
        src={category.icon}
        sx={{ width: 48, height: 48, mb: 1 }}
      />

      {category.label}
    </ListItemButton>
  );
}
