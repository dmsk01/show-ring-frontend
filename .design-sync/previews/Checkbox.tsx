import { Radio, Stack, Checkbox, RadioGroup, FormControlLabel } from 'show-ring-ds';

export const Checkboxes = () => (
  <Stack>
    <FormControlLabel control={<Checkbox defaultChecked />} label="Согласен с правилами выставки" />
    <FormControlLabel control={<Checkbox />} label="Нужна парковка" />
    <FormControlLabel control={<Checkbox indeterminate />} label="Выбрать все заявки" />
    <FormControlLabel control={<Checkbox disabled />} label="Недоступно" />
  </Stack>
);

export const RadioOptions = () => (
  <RadioGroup defaultValue="male">
    <FormControlLabel value="male" control={<Radio />} label="Кобель" />
    <FormControlLabel value="female" control={<Radio />} label="Сука" />
  </RadioGroup>
);
