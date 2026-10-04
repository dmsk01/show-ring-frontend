'use client';

import type { IconProps } from '@iconify/react';
import type { IconifyName } from './register-icons';

import { useId } from 'react';
import { Icon } from '@iconify/react';
import { mergeClasses } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';

import { iconifyClasses } from './classes';
import { allIconNames, registerIcons } from './register-icons';

// ----------------------------------------------------------------------

export type IconifyProps = React.ComponentProps<typeof IconRoot> &
  Omit<IconProps, 'icon'> & {
    icon: IconifyName;
  };

export function Iconify({ className, icon, width = 20, height, sx, ...other }: IconifyProps) {
  const uniqueId = useId();

  registerIcons();

  // Незарегистрированную иконку @iconify/react догрузил бы с api.iconify.design —
  // это запрос с IP посетителя на зарубежный сервер (трансграничная передача,
  // ст. 12 152-ФЗ; Политика обещает, что её нет). Поэтому вместо онлайн-загрузки —
  // пустое место того же размера и предупреждение разработчику.
  if (!allIconNames.includes(icon)) {
    console.warn(
      `Icon "${icon}" is not registered offline (src/components/iconify/icon-sets.ts) and is not rendered.`
    );
    return (
      <Box
        component="span"
        aria-hidden
        className={mergeClasses([iconifyClasses.root, className])}
        sx={[
          { width, height: height ?? width, flexShrink: 0, display: 'inline-flex' },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      />
    );
  }

  return (
    <IconRoot
      ssr
      id={uniqueId}
      icon={icon}
      className={mergeClasses([iconifyClasses.root, className])}
      sx={[
        {
          width,
          flexShrink: 0,
          height: height ?? width,
          display: 'inline-flex',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    />
  );
}

// ----------------------------------------------------------------------

const IconRoot = styled(Icon)``;
