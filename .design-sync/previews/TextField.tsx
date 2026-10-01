import { Stack, Iconify, MenuItem, TextField, InputAdornment } from 'show-ring-ds';

export const Basic = () => (
  <Stack spacing={2.5} sx={{ width: 360 }}>
    <TextField label="Кличка" defaultValue="Арчибальд" />
    <TextField label="Номер РКФ" placeholder="RKF 1234567" helperText="Как в родословной" />
    <TextField label="Описание" multiline rows={3} defaultValue="Спокойный, дружелюбный, отлично двигается в ринге." />
  </Stack>
);

export const Select = () => (
  <Stack spacing={2.5} sx={{ width: 360 }}>
    <TextField select label="Класс" defaultValue="open">
      <MenuItem value="junior">Юниоров</MenuItem>
      <MenuItem value="open">Открытый</MenuItem>
      <MenuItem value="champion">Чемпионов</MenuItem>
    </TextField>
  </Stack>
);

export const Adornments = () => (
  <Stack spacing={2.5} sx={{ width: 360 }}>
    <TextField
      placeholder="Поиск по кличке или породе"
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        },
      }}
    />
    <TextField
      label="Взнос"
      defaultValue="2500"
      slotProps={{ input: { endAdornment: <InputAdornment position="end">₽</InputAdornment> } }}
    />
  </Stack>
);

export const States = () => (
  <Stack spacing={2.5} sx={{ width: 360 }}>
    <TextField label="E-mail" defaultValue="owner@mail" error helperText="Некорректный адрес" />
    <TextField label="Дата рождения" defaultValue="12.03.2022" disabled />
    <TextField label="Размер" size="small" defaultValue="Small" />
  </Stack>
);
