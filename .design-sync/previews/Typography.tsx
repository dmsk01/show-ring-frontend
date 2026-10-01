import { Stack, Typography } from 'show-ring-ds';

export const Headings = () => (
  <Stack spacing={1}>
    <Typography variant="h1">Выставка «Кубок Москвы»</Typography>
    <Typography variant="h2">Результаты ринга</Typography>
    <Typography variant="h3">Питомник «Северная звезда»</Typography>
    <Typography variant="h4">Мои собаки</Typography>
    <Typography variant="h5">Документы выставки</Typography>
    <Typography variant="h6">Расписание рингов</Typography>
  </Stack>
);

export const Body = () => (
  <Stack spacing={1.5} sx={{ maxWidth: 560 }}>
    <Typography variant="subtitle1">Регистрация открыта до 15 октября</Typography>
    <Typography variant="subtitle2">Сертификатная выставка ранга CAC</Typography>
    <Typography variant="body1">
      Выставка проводится по правилам РКФ. К участию допускаются собаки с родословной,
      зарегистрированной в РКФ или признанной FCI организации.
    </Typography>
    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
      Оплата взноса производится после подтверждения заявки организатором.
    </Typography>
    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
      Обновлено 27 сентября 2026
    </Typography>
    <Typography variant="overline" sx={{ color: 'text.secondary' }}>
      Класс открытый
    </Typography>
  </Stack>
);
