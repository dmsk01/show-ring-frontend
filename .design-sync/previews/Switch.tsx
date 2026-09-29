import { Stack, Switch, FormControlLabel } from 'show-ring-ds';

export const Settings = () => (
  <Stack>
    <FormControlLabel control={<Switch defaultChecked />} label="Уведомлять о новых выставках" />
    <FormControlLabel control={<Switch />} label="Показывать питомник в каталоге" />
    <FormControlLabel control={<Switch disabled defaultChecked />} label="E-mail подтверждён" />
  </Stack>
);

export const Colors = () => (
  <Stack direction="row" spacing={1} alignItems="center">
    <Switch defaultChecked />
    <Switch defaultChecked color="info" />
    <Switch defaultChecked color="warning" />
    <Switch defaultChecked color="error" />
    <Switch defaultChecked size="small" />
  </Stack>
);
