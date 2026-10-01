import { Stack, MetaRow, SEX_COLOR } from 'show-ring-ds';

export const Neutral = () => (
  <Stack spacing={1}>
    <MetaRow icon="solar:calendar-date-bold">12 – 13 октября 2026</MetaRow>
    <MetaRow icon="mingcute:location-fill">Москва, Россия</MetaRow>
    <MetaRow icon="solar:wad-of-money-bold">2 500 ₽</MetaRow>
    <MetaRow icon="solar:users-group-rounded-bold">3 заявки</MetaRow>
  </Stack>
);

export const SemanticAccent = () => (
  <Stack direction="row" spacing={2}>
    <MetaRow icon="solar:bone-bold-duotone">Самоед</MetaRow>
    <MetaRow icon="solar:men-bold" iconColor={`${SEX_COLOR.male}.main`}>
      Кобель
    </MetaRow>
    <MetaRow icon="solar:women-bold" iconColor={`${SEX_COLOR.female}.main`}>
      Сука
    </MetaRow>
  </Stack>
);
