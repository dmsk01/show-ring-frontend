'use client';

import type { EditorProps } from '../editor';

import dynamic from 'next/dynamic';
import { Controller, useFormContext } from 'react-hook-form';

// tiptap + lowlight весят ~1,3 МБ: статический импорт через объект Field тянул
// их на все страницы с формами, включая вход (ревью 2026-10-09, FE-23).
// Редактор нужен только в блоге — грузим его по требованию и только в браузере.
const Editor = dynamic(() => import('../editor').then((mod) => mod.Editor), { ssr: false });

// ----------------------------------------------------------------------

export type RHFEditorProps = EditorProps & {
  name: string;
};

export function RHFEditor({ name, helperText, ...other }: RHFEditorProps) {
  const {
    control,
    formState: { isSubmitSuccessful },
  } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Editor
          {...field}
          error={!!error}
          helperText={error?.message ?? helperText}
          resetValue={isSubmitSuccessful}
          {...other}
        />
      )}
    />
  );
}
