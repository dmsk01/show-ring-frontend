import { Tab, Box, Tabs, Label, Iconify } from 'show-ring-ds';

export const Basic = () => (
  <Box sx={{ width: 520 }}>
    <Tabs value="info">
      <Tab value="info" label="Информация" />
      <Tab value="results" label="Результаты" />
      <Tab value="pedigree" label="Родословная" />
      <Tab value="photos" label="Фото" />
    </Tabs>
  </Box>
);

export const WithIconsAndCounts = () => (
  <Box sx={{ width: 520 }}>
    <Tabs value="all">
      <Tab value="all" label="Все" iconPosition="end" icon={<Label>24</Label>} />
      <Tab value="open" label="Открыта" iconPosition="end" icon={<Label color="success">8</Label>} />
      <Tab value="closed" label="Закрыта" iconPosition="end" icon={<Label color="warning">3</Label>} />
      <Tab value="calendar" icon={<Iconify icon="solar:calendar-date-bold" />} iconPosition="start" label="Календарь" />
    </Tabs>
  </Box>
);
