'use client';

import type { Breakpoint } from '@mui/material/styles';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import { styled } from '@mui/material/styles';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { _socials } from 'src/_mock';
import { useTranslate } from 'src/locales';

import { Logo } from 'src/components/logo';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const SUPPORT_EMAIL = 'support@showring.app';

const FooterRoot = styled('footer')(({ theme }) => ({
  position: 'relative',
  backgroundColor: theme.vars.palette.background.default,
}));

export type FooterProps = React.ComponentProps<typeof FooterRoot>;

export function Footer({
  sx,
  layoutQuery = 'md',
  ...other
}: FooterProps & { layoutQuery?: Breakpoint }) {
  const { t } = useTranslate('footer');

  const linkSections = [
    {
      headline: t('nav.title'),
      children: [
        { name: t('nav.home'), href: '/' },
        { name: t('nav.kennels'), href: paths.showcase.kennels },
        { name: t('nav.animals'), href: paths.showcase.animals },
        { name: t('nav.shows'), href: paths.showcase.shows },
      ],
    },
    {
      headline: t('info.title'),
      children: [
        { name: t('info.about'), href: paths.about },
        { name: t('info.contact'), href: paths.contact },
        { name: t('info.faqs'), href: paths.faqs },
      ],
    },
  ];

  return (
    <FooterRoot sx={sx} {...other}>
      <Divider />

      <Container
        sx={(theme) => ({
          pb: 5,
          pt: 10,
          textAlign: 'center',
          [theme.breakpoints.up(layoutQuery)]: { textAlign: 'unset' },
        })}
      >
        <Logo />

        <Grid
          container
          sx={[
            (theme) => ({
              mt: 3,
              justifyContent: 'center',
              [theme.breakpoints.up(layoutQuery)]: { justifyContent: 'space-between' },
            }),
          ]}
        >
          <Grid size={{ xs: 12, [layoutQuery]: 3 }}>
            <Typography
              variant="body2"
              sx={(theme) => ({
                mx: 'auto',
                maxWidth: 280,
                [theme.breakpoints.up(layoutQuery)]: { mx: 'unset' },
              })}
            >
              {t('description')}
            </Typography>

            <Box
              sx={(theme) => ({
                mt: 3,
                mb: 5,
                display: 'flex',
                justifyContent: 'center',
                [theme.breakpoints.up(layoutQuery)]: { mb: 0, justifyContent: 'flex-start' },
              })}
            >
              {_socials.map((social) => (
                <IconButton key={social.label}>
                  {social.value === 'twitter' && <Iconify icon="socials:twitter" />}
                  {social.value === 'facebook' && <Iconify icon="socials:facebook" />}
                  {social.value === 'instagram' && <Iconify icon="socials:instagram" />}
                  {social.value === 'linkedin' && <Iconify icon="socials:linkedin" />}
                </IconButton>
              ))}
            </Box>
          </Grid>

          <Grid size={{ xs: 12, [layoutQuery]: 6 }}>
            <Box
              sx={(theme) => ({
                gap: 5,
                display: 'flex',
                flexDirection: 'column',
                [theme.breakpoints.up(layoutQuery)]: { flexDirection: 'row' },
              })}
            >
              {linkSections.map((list) => (
                <Box
                  key={list.headline}
                  sx={(theme) => ({
                    gap: 2,
                    width: 1,
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'column',
                    [theme.breakpoints.up(layoutQuery)]: { alignItems: 'flex-start' },
                  })}
                >
                  <Typography component="div" variant="overline">
                    {list.headline}
                  </Typography>

                  {list.children.map((link) => (
                    <Link
                      key={link.name}
                      component={RouterLink}
                      href={link.href}
                      color="inherit"
                      variant="body2"
                    >
                      {link.name}
                    </Link>
                  ))}
                </Box>
              ))}

              <Box
                sx={(theme) => ({
                  gap: 2,
                  width: 1,
                  display: 'flex',
                  alignItems: 'center',
                  flexDirection: 'column',
                  [theme.breakpoints.up(layoutQuery)]: { alignItems: 'flex-start' },
                })}
              >
                <Typography component="div" variant="overline">
                  {t('legal.title')}
                </Typography>

                {(
                  [
                    { name: t('legal.privacy'), href: paths.legal.privacy },
                    { name: t('legal.terms'), href: paths.legal.terms },
                    { name: t('legal.consent'), href: paths.legal.consent },
                  ] as const
                ).map((link) => (
                  // Статические HTML в public/ — открываем в новой вкладке обычной ссылкой.
                  // Навигация в той же вкладке уводит из Next-SPA, и возврат «назад»
                  // оставляет пустой экран (App Router не восстанавливается из bfcache).
                  <Link
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener"
                    color="inherit"
                    variant="body2"
                  >
                    {link.name}
                  </Link>
                ))}
              </Box>

              <Box
                sx={(theme) => ({
                  gap: 2,
                  width: 1,
                  display: 'flex',
                  alignItems: 'center',
                  flexDirection: 'column',
                  [theme.breakpoints.up(layoutQuery)]: { alignItems: 'flex-start' },
                })}
              >
                <Typography component="div" variant="overline">
                  {t('contact.title')}
                </Typography>

                <Link href={`mailto:${SUPPORT_EMAIL}`} color="inherit" variant="body2">
                  {SUPPORT_EMAIL}
                </Link>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Typography variant="body2" sx={{ mt: 10 }}>
          © {new Date().getFullYear()} Show Ring. {t('rights')}
        </Typography>
      </Container>
    </FooterRoot>
  );
}
