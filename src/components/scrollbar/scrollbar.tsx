'use client';

import type { ScrollbarProps } from './types';

import SimpleBar from 'simplebar-react';
import { mergeClasses } from 'minimal-shared/utils';

import { styled } from '@mui/material/styles';

import { useTranslate } from 'src/locales';

import { scrollbarClasses } from './classes';

// ----------------------------------------------------------------------

export function Scrollbar({
  sx,
  ref,
  children,
  className,
  slotProps,
  fillContent = true,
  ...other
}: ScrollbarProps) {
  const { t } = useTranslate('common');

  return (
    <ScrollbarRoot
      scrollableNodeProps={{ ref }}
      clickOnTrack={false}
      // simplebar по умолчанию озвучивает область как «scrollable content».
      ariaLabel={t('a11y.scrollArea')}
      fillContent={fillContent}
      className={mergeClasses([scrollbarClasses.root, className])}
      sx={[
        {
          '& .simplebar-wrapper': slotProps?.wrapperSx as React.CSSProperties,
          '& .simplebar-content-wrapper': slotProps?.contentWrapperSx as React.CSSProperties,
          '& .simplebar-content': slotProps?.contentSx as React.CSSProperties,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {children}
    </ScrollbarRoot>
  );
}

// ----------------------------------------------------------------------

const ScrollbarRoot = styled(SimpleBar, {
  shouldForwardProp: (prop: string) => !['fillContent', 'sx'].includes(prop),
})<Pick<ScrollbarProps, 'fillContent'>>(({ fillContent }) => ({
  minWidth: 0,
  minHeight: 0,
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  ...(fillContent && {
    '& .simplebar-content': {
      display: 'flex',
      flex: '1 1 auto',
      minHeight: '100%',
      flexDirection: 'column',
    },
  }),
}));
