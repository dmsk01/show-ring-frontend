import {
  Card,
  Label,
  Stack,
  Button,
  MetaRow,
  CardLink,
  CardHeader,
  CardContent,
  STATUS_TONE,
  cardActionableSx,
} from 'show-ring-ds';

export const ShowCard = () => (
  <Card sx={[cardActionableSx, { p: 3, maxWidth: 360 }]}>
    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
      <CardLink href="#" variant="subtitle1">
        Кубок Москвы 2026
      </CardLink>
      <Label color={STATUS_TONE.active}>Регистрация открыта</Label>
    </Stack>
    <Stack spacing={1}>
      <MetaRow icon="solar:calendar-date-bold">12 – 13 октября 2026</MetaRow>
      <MetaRow icon="mingcute:location-fill">Москва, Россия</MetaRow>
      <MetaRow icon="solar:wad-of-money-bold">2 500 ₽</MetaRow>
    </Stack>
  </Card>
);

export const WithHeader = () => (
  <Card sx={{ maxWidth: 420 }}>
    <CardHeader
      title="Документы выставки"
      subheader="Каталог и дипломы"
      action={<Button size="small">Сформировать</Button>}
    />
    <CardContent>
      <Stack spacing={1}>
        <MetaRow icon="solar:calendar-date-bold">Каталог участников · 10 октября</MetaRow>
        <MetaRow icon="solar:users-group-rounded-bold">128 участников</MetaRow>
      </Stack>
    </CardContent>
  </Card>
);
