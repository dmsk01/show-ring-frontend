'use client';

import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

// ----------------------------------------------------------------------
// Примитивы для текста правовых документов. Документы описываются JSX'ом
// из этих компонентов, чтобы типографика была одинаковой во всех четырёх.
// ----------------------------------------------------------------------

export type LegalSection = {
  /** Якорь в URL (#id) — стабилен между редакциями, на него ссылаются другие документы. */
  id: string;
  title: string;
  content: ReactNode;
};

export type LegalDocument = {
  title: string;
  revision: string;
  /** Абзац над оглавлением: что это за документ и как он соотносится с остальными. */
  lead: ReactNode;
  sections: LegalSection[];
};

// ----------------------------------------------------------------------

export function P({ children }: { children: ReactNode }) {
  return (
    <Typography variant="body1" sx={{ mb: 1.5, color: 'text.primary' }}>
      {children}
    </Typography>
  );
}

/** Нумерованный пункт: «3.2. Текст». Номер держим в тексте, а не в CSS — он цитируется в претензиях. */
export function Clause({ n, children }: { n: string; children: ReactNode }) {
  return (
    <Typography variant="body1" sx={{ mb: 1.5, color: 'text.primary' }}>
      <Box component="span" sx={{ fontWeight: 'fontWeightSemiBold', mr: 0.75 }}>
        {n}.
      </Box>
      {children}
    </Typography>
  );
}

export function Ul({ children }: { children: ReactNode }) {
  return (
    <Box component="ul" sx={{ pl: 3, mt: 0, mb: 2, typography: 'body1', '& > li': { mb: 0.75 } }}>
      {children}
    </Box>
  );
}

export function Li({ children }: { children: ReactNode }) {
  return <li>{children}</li>;
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={(theme) => ({
        my: 2,
        px: 2.5,
        py: 2,
        borderRadius: 1.5,
        typography: 'body2',
        bgcolor: 'background.neutral',
        borderLeft: `3px solid ${theme.vars.palette.primary.main}`,
      })}
    >
      {children}
    </Box>
  );
}

export function DocTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <Box sx={{ my: 2, overflowX: 'auto' }}>
      <Box
        component="table"
        sx={(theme) => ({
          width: 1,
          minWidth: 560,
          borderCollapse: 'collapse',
          typography: 'body2',
          '& th, & td': {
            p: 1.25,
            textAlign: 'left',
            verticalAlign: 'top',
            border: `1px solid ${theme.vars.palette.divider}`,
          },
          '& th': { bgcolor: 'background.neutral', fontWeight: 'fontWeightSemiBold' },
        })}
      >
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </Box>
    </Box>
  );
}

/**
 * Значение реквизита. `null` → заметная плашка «[заполнить: …]»:
 * незаполненный реквизит не должен выглядеть как готовый текст.
 */
export function Fill({ value, hint }: { value: string | null; hint: string }) {
  if (value) return <>{value}</>;

  return (
    <Box
      component="mark"
      title="Реквизит не заполнен: src/sections/legal/operator.ts"
      sx={{
        px: 0.5,
        borderRadius: 0.5,
        color: 'warning.darker',
        bgcolor: 'warning.lighter',
        typography: 'body2',
        fontFamily: 'monospace',
      }}
    >
      [заполнить: {hint}]
    </Box>
  );
}

/** Ссылка на другой правовой документ (или его раздел через #якорь). */
export function DocLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link component={RouterLink} href={href} underline="always">
      {children}
    </Link>
  );
}

export function MailLink({ email, hint }: { email: string | null; hint: string }) {
  if (!email) return <Fill value={null} hint={hint} />;

  return (
    <Link href={`mailto:${email}`} underline="always">
      {email}
    </Link>
  );
}
