import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';

// ----------------------------------------------------------------------

type Props = { variant: 'notifications' | 'socials' };

const NOTIFICATION_ITEMS = ['Новые сообщения', 'Результаты шоу', 'Объявления'];
const SOCIAL_ITEMS = ['Instagram', 'Facebook', 'VK', 'Telegram'];

export function ProfilePlaceholder({ variant }: Props) {
  const isNotifications = variant === 'notifications';

  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Alert severity="info">Раздел появится после поддержки на сервере.</Alert>

        {isNotifications
          ? NOTIFICATION_ITEMS.map((label) => (
              <FormControlLabel
                key={label}
                disabled
                control={<Switch />}
                label={label}
                sx={{ m: 0, justifyContent: 'space-between' }}
              />
            ))
          : SOCIAL_ITEMS.map((label) => (
              <TextField key={label} disabled label={label} placeholder="https://" />
            ))}

        <Button disabled variant="contained" sx={{ ml: 'auto' }}>
          Сохранить
        </Button>
      </Stack>
    </Card>
  );
}
