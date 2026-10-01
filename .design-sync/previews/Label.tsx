import { Stack, Label, Iconify, STATUS_TONE, PRIORITY_TONE } from 'show-ring-ds';

export const StatusTones = () => (
  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
    <Label color={STATUS_TONE.neutral}>Черновик</Label>
    <Label color={STATUS_TONE.pending}>На модерации</Label>
    <Label color={STATUS_TONE.active}>Регистрация открыта</Label>
    <Label color={STATUS_TONE.progress}>Идёт выставка</Label>
    <Label color={STATUS_TONE.danger}>Отменена</Label>
  </Stack>
);

export const Variants = () => (
  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
    <Label variant="soft" color="success">Soft</Label>
    <Label variant="filled" color="success">Filled</Label>
    <Label variant="outlined" color="success">Outlined</Label>
    <Label variant="inverted" color="success">Inverted</Label>
  </Stack>
);

export const Priority = () => (
  <Stack direction="row" spacing={1}>
    <Label color={PRIORITY_TONE.low}>Низкий</Label>
    <Label color={PRIORITY_TONE.normal}>Обычный</Label>
    <Label color={PRIORITY_TONE.high}>Высокий</Label>
    <Label color={PRIORITY_TONE.urgent}>Срочный</Label>
  </Stack>
);

export const WithIcon = () => (
  <Stack direction="row" spacing={1}>
    <Label color="success" variant="filled" startIcon={<Iconify icon="solar:verified-check-bold" />}>
      Проверенный питомник
    </Label>
    <Label color="info" startIcon={<Iconify icon="solar:men-bold" />}>Кобель</Label>
    <Label color="secondary" startIcon={<Iconify icon="solar:women-bold" />}>Сука</Label>
  </Stack>
);
