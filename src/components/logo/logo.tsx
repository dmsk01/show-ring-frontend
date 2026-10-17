'use client';

import type { LinkProps } from '@mui/material/Link';

import { useId } from 'react';
import { mergeClasses } from 'minimal-shared/utils';

import Link from '@mui/material/Link';
import { styled, useTheme } from '@mui/material/styles';

import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { logoClasses } from './classes';

// ----------------------------------------------------------------------

export type LogoProps = LinkProps & {
  isSingle?: boolean;
  disabled?: boolean;
};

export function Logo({
  sx,
  disabled,
  className,
  href = '/',
  isSingle = true,
  ...other
}: LogoProps) {
  const theme = useTheme();
  const { t } = useTranslate('common');

  const uniqueId = useId();

  const TEXT_PRIMARY = theme.vars.palette.text.primary;
  const PRIMARY_LIGHT = theme.vars.palette.primary.light;
  const PRIMARY_MAIN = theme.vars.palette.primary.main;
  const PRIMARY_DARKER = theme.vars.palette.primary.dark;

  /*
    * OR using local (public folder)
    *
    const singleLogo = (
      <img
        alt="Single logo"
        src={`${CONFIG.assetsDir}/logo/logo-single.svg`}
        width="100%"
        height="100%"
      />
    );

    const fullLogo = (
      <img
        alt="Full logo"
        src={`${CONFIG.assetsDir}/logo/logo-full.svg`}
        width="100%"
        height="100%"
      />
    );
    *
    */

  // Знак BisShow: наградная розетка выставки — кольцо с двумя лентами.
  const mark = (
    <>
      <path
        fill={PRIMARY_DARKER}
        d="M196 420 L140 504 L196 484 L222 512 L262 440 Z M316 420 L372 504 L316 484 L290 512 L250 440 Z"
      />
      <circle
        cx="256"
        cy="236"
        r="168"
        stroke={`url(#${`${uniqueId}-ring`})`}
        strokeWidth="72"
        fill="none"
      />
      <circle cx="256" cy="236" r="56" fill={PRIMARY_MAIN} />
    </>
  );

  const ringGradient = (
    <defs>
      <linearGradient
        id={`${uniqueId}-ring`}
        x1="256"
        y1="32"
        x2="256"
        y2="440"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor={PRIMARY_LIGHT} />
        <stop offset="1" stopColor={PRIMARY_MAIN} />
      </linearGradient>
    </defs>
  );

  const singleLogo = (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {ringGradient}
      {mark}
    </svg>
  );

  const fullLogo = (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 1620 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {ringGradient}
      {mark}
      <text
        x="580"
        y="330"
        textLength="1000"
        lengthAdjust="spacingAndGlyphs"
        fill={TEXT_PRIMARY}
        fontSize="240"
        fontWeight="800"
        fontFamily="inherit"
      >
        BisShow
      </text>
    </svg>
  );

  return (
    <LogoRoot
      component={RouterLink}
      href={href}
      aria-label={t('a11y.home')}
      underline="none"
      className={mergeClasses([logoClasses.root, className])}
      sx={[
        {
          width: 40,
          height: 40,
          ...(!isSingle && { width: 114, height: 36 }),
          ...(disabled && { pointerEvents: 'none' }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {isSingle ? singleLogo : fullLogo}
    </LogoRoot>
  );
}

// ----------------------------------------------------------------------

const LogoRoot = styled(Link)(() => ({
  flexShrink: 0,
  color: 'transparent',
  display: 'inline-flex',
  verticalAlign: 'middle',
}));
