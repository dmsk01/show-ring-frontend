'use client';

import type { LandingLang, LandingContent } from './content';

import { useMemo, useState, useContext, createContext } from 'react';

import ButtonBase from '@mui/material/ButtonBase';

import { landingContent } from './content';

// ----------------------------------------------------------------------

type LandingContextValue = {
  lang: LandingLang;
  setLang: (lang: LandingLang) => void;
  t: LandingContent;
};

const LandingContext = createContext<LandingContextValue | undefined>(undefined);

export function useLanding() {
  const ctx = useContext(LandingContext);
  if (!ctx) throw new Error('useLanding must be used within LandingProvider');
  return ctx;
}

type Props = { children: React.ReactNode };

export function LandingProvider({ children }: Props) {
  const [lang, setLang] = useState<LandingLang>('ru');

  const value = useMemo(() => ({ lang, setLang, t: landingContent[lang] }), [lang]);

  return <LandingContext value={value}>{children}</LandingContext>;
}

// ----------------------------------------------------------------------

const LANGS: LandingLang[] = ['ru', 'en'];

export function LandingLangToggle({ sx }: { sx?: object }) {
  const { lang, setLang } = useLanding();

  return (
    <ButtonBase
      sx={[
        (theme) => ({
          p: 0.5,
          gap: 0.5,
          borderRadius: 5,
          display: 'inline-flex',
          border: `solid 1px ${theme.vars.palette.divider}`,
          bgcolor: 'background.paper',
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      component="div"
    >
      {LANGS.map((code) => {
        const active = code === lang;
        return (
          <ButtonBase
            key={code}
            onClick={() => setLang(code)}
            sx={(theme) => ({
              px: 1.25,
              py: 0.25,
              borderRadius: 5,
              fontSize: 13,
              fontWeight: 700,
              typography: 'caption',
              color: active ? theme.vars.palette.primary.contrastText : 'text.secondary',
              bgcolor: active ? 'primary.main' : 'transparent',
            })}
          >
            {code.toUpperCase()}
          </ButtonBase>
        );
      })}
    </ButtonBase>
  );
}
