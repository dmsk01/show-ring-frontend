import { Button, Stack, Iconify } from 'show-ring-ds';

export const Variants = () => (
  <Stack direction="row" spacing={2} alignItems="center">
    <Button variant="contained">Записаться</Button>
    <Button variant="outlined">Подробнее</Button>
    <Button variant="soft">В избранное</Button>
    <Button variant="text">Отмена</Button>
  </Stack>
);

export const Colors = () => (
  <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
    <Button variant="contained" color="inherit">Inherit</Button>
    <Button variant="contained" color="primary">Primary</Button>
    <Button variant="contained" color="secondary">Secondary</Button>
    <Button variant="contained" color="info">Info</Button>
    <Button variant="contained" color="success">Success</Button>
    <Button variant="contained" color="warning">Warning</Button>
    <Button variant="contained" color="error">Удалить</Button>
  </Stack>
);

export const Sizes = () => (
  <Stack direction="row" spacing={2} alignItems="center">
    <Button variant="contained" size="small">Small</Button>
    <Button variant="contained" size="medium">Medium</Button>
    <Button variant="contained" size="large">Large</Button>
  </Stack>
);

export const WithIcons = () => (
  <Stack direction="row" spacing={2} alignItems="center">
    <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />}>
      Добавить собаку
    </Button>
    <Button variant="outlined" color="inherit" endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}>
      Все выставки
    </Button>
  </Stack>
);

export const States = () => (
  <Stack direction="row" spacing={2} alignItems="center">
    <Button variant="contained" disabled>Регистрация закрыта</Button>
    <Button variant="contained" loading>Сохранение</Button>
    <Button variant="soft" color="error">Отменить заявку</Button>
  </Stack>
);
