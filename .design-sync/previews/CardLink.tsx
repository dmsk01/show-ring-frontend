import { Card, Stack, Label, MetaRow, CardLink, SEX_COLOR, cardActionableSx } from 'show-ring-ds';

// CardLink stretches its hit area over the whole Card - pair it with cardActionableSx.
export const ClickableCard = () => (
  <Card sx={[cardActionableSx, { p: 2.5, width: 320 }]}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
      <CardLink href="#" variant="subtitle1">
        Арчибальд Северная Звезда
      </CardLink>
      <Label color={SEX_COLOR.male}>Кобель</Label>
    </Stack>
    <Stack spacing={1}>
      <MetaRow icon="solar:bone-bold-duotone">Самоед</MetaRow>
      <MetaRow icon="solar:calendar-date-bold">12.03.2022</MetaRow>
    </Stack>
  </Card>
);
