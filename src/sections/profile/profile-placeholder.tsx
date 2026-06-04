'use client';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

// ----------------------------------------------------------------------

const SOCIAL_ITEMS = ['Instagram', 'Facebook', 'VK', 'Telegram'];

export function ProfilePlaceholder() {
  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Alert severity="info">Раздел появится после поддержки на сервере.</Alert>

        {SOCIAL_ITEMS.map((label) => (
          <TextField key={label} disabled label={label} placeholder="https://" />
        ))}

        <Button disabled variant="contained" sx={{ ml: 'auto' }}>
          Сохранить
        </Button>
      </Stack>
    </Card>
  );
}
