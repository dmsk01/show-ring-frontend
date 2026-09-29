import { Stack, Avatar, AvatarGroup } from 'show-ring-ds';

// Use the theme's `color` prop (not sx bgcolor) - it sets a matching readable text color.
export const Initials = () => (
  <Stack direction="row" spacing={2} alignItems="center">
    <Avatar sx={{ width: 32, height: 32 }}>АС</Avatar>
    <Avatar color="primary">МК</Avatar>
    <Avatar color="info" sx={{ width: 56, height: 56 }}>
      ИП
    </Avatar>
    <Avatar color="secondary" variant="rounded">
      СЗ
    </Avatar>
  </Stack>
);

export const Group = () => (
  <AvatarGroup max={4}>
    <Avatar color="primary">А</Avatar>
    <Avatar color="info">Б</Avatar>
    <Avatar color="warning">В</Avatar>
    <Avatar color="error">Г</Avatar>
    <Avatar>Д</Avatar>
    <Avatar>Е</Avatar>
  </AvatarGroup>
);
