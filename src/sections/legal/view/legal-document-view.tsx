'use client';

import type { LegalDocumentKey } from '../documents';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { LEGAL_DOCUMENTS } from '../documents';

// ----------------------------------------------------------------------

const RELATED = [
  { title: 'Пользовательское соглашение', href: paths.legal.terms },
  { title: 'Политика конфиденциальности', href: paths.legal.privacy },
  { title: 'Согласие на обработку ПДн', href: paths.legal.consent },
  { title: 'Согласие на распространение ПДн', href: paths.legal.publicConsent },
];

// ----------------------------------------------------------------------

type Props = {
  // Ключ, а не сам документ: JSX документов собирается на клиенте и не
  // сериализуется через границу server → client component.
  documentKey: LegalDocumentKey;
};

export function LegalDocumentView({ documentKey }: Props) {
  const doc = LEGAL_DOCUMENTS[documentKey];
  const pathname = usePathname();
  const activeId = useActiveSection(doc.sections.map((s) => s.id));

  const navContent = (
    <>
      <Typography variant="overline" sx={{ color: 'text.disabled' }}>
        Документы
      </Typography>
      <Stack spacing={0.5} sx={{ mt: 1, mb: 3 }}>
        {RELATED.map((item) => {
          const current = pathname === item.href;
          return (
            <Link
              key={item.href}
              component={RouterLink}
              href={item.href}
              underline="none"
              aria-current={current ? 'page' : undefined}
              sx={{
                typography: 'body2',
                color: current ? 'primary.main' : 'text.secondary',
                fontWeight: current ? 'fontWeightSemiBold' : 'fontWeightRegular',
              }}
            >
              {item.title}
            </Link>
          );
        })}
      </Stack>

      <Typography variant="overline" sx={{ color: 'text.disabled' }}>
        Содержание
      </Typography>
      <Stack component="ol" spacing={0.75} sx={{ mt: 1, p: 0, listStyle: 'none' }}>
        {doc.sections.map((section, index) => (
          <li key={section.id}>
            <Link
              href={`#${section.id}`}
              underline="hover"
              sx={{
                display: 'block',
                typography: 'body2',
                color: activeId === section.id ? 'text.primary' : 'text.secondary',
                fontWeight: activeId === section.id ? 'fontWeightSemiBold' : 'fontWeightRegular',
              }}
            >
              {index + 1}. {section.title}
            </Link>
          </li>
        ))}
      </Stack>
    </>
  );

  return (
    <Container component="article" sx={{ pt: { xs: 5, md: 8 }, pb: { xs: 8, md: 12 } }}>
      <Box
        sx={{
          gap: { xs: 4, md: 6 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '280px 1fr' },
        }}
      >
        {/* Оглавление: на десктопе липкая колонка, в печать не попадает. */}
        <Box
          component="nav"
          aria-label="Оглавление"
          sx={{
            display: { xs: 'none', md: 'block' },
            displayPrint: 'none',
            alignSelf: 'start',
            position: 'sticky',
            top: 96,
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
          }}
        >
          {navContent}
        </Box>

        <Box sx={{ minWidth: 0, maxWidth: 820 }}>
          <Typography component="h1" variant="h3">
            {doc.title}
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ mt: 1.5, mb: 3, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
          >
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Редакция от {doc.revision}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="solar:printer-minimalistic-bold" />}
              onClick={() => window.print()}
              sx={{ displayPrint: 'none', alignSelf: { xs: 'flex-start', sm: 'center' } }}
            >
              Распечатать / PDF
            </Button>
          </Stack>

          {/* На мобильном оглавление сворачивается, чтобы не вытеснять текст с первого экрана. */}
          <Box
            component="details"
            sx={{
              display: { md: 'none' },
              displayPrint: 'none',
              mb: 3,
              px: 2,
              py: 1.5,
              borderRadius: 1.5,
              bgcolor: 'background.neutral',
              '& > summary': { cursor: 'pointer', typography: 'subtitle2' },
              '&[open] > summary': { mb: 2 },
            }}
          >
            <summary>Содержание и другие документы</summary>
            {navContent}
          </Box>

          <Box sx={{ color: 'text.secondary', typography: 'body1' }}>{doc.lead}</Box>

          <Divider sx={{ my: 4 }} />

          {doc.sections.map((section, index) => (
            <Box
              key={section.id}
              component="section"
              id={section.id}
              // Отступ под липкую шапку при переходе по якорю.
              sx={{ scrollMarginTop: 96, mb: 5 }}
            >
              <Typography component="h2" variant="h5" sx={{ mb: 2 }}>
                {index + 1}. {section.title}
              </Typography>
              {section.content}
            </Box>
          ))}
        </Box>
      </Box>
    </Container>
  );
}

// ----------------------------------------------------------------------

/** Подсветка текущего раздела в оглавлении по мере прокрутки. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join('|');

  useEffect(() => {
    const elements = key
      .split('|')
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (!elements.length || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-96px 0px -65% 0px' }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [key]);

  return active;
}
