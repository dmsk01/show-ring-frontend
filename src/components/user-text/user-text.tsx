import type { TypographyProps } from '@mui/material/Typography';

import { Fragment } from 'react';

import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

export type UserTextProps = Omit<TypographyProps, 'children'> & {
  children: string | null | undefined;
};

/**
 * Простой текст, введённый пользователем (описания собак и объявлений):
 * пустая строка — граница абзаца, перенос — <br/>. Никакого HTML/markdown —
 * React экранирует текст сам. Для HTML редактора блога — <Markdown>.
 */
export function UserText({ children, sx, ...other }: UserTextProps) {
  const paragraphs = (children ?? '')
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <Typography
      component="div"
      variant="body1"
      sx={[{ '& p': { m: 0, mb: 1.5 } }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    >
      {paragraphs.map((paragraph, index) => (
        <p key={index}>
          {paragraph.split('\n').map((line, lineIndex) => (
            <Fragment key={lineIndex}>
              {lineIndex > 0 && <br />}
              {line}
            </Fragment>
          ))}
        </p>
      ))}
    </Typography>
  );
}
