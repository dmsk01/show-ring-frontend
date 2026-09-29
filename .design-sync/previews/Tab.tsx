import { Tab, Box, Tabs } from 'show-ring-ds';

// Tab only renders inside Tabs.
export const InTabs = () => (
  <Box sx={{ width: 420 }}>
    <Tabs value="upcoming">
      <Tab value="upcoming" label="Предстоящие" />
      <Tab value="past" label="Прошедшие" />
      <Tab value="drafts" label="Черновики" disabled />
    </Tabs>
  </Box>
);
