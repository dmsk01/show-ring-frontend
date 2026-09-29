import { Card, Button, Iconify, CardHeader, IconButton } from 'show-ring-ds';

export const TitleAndAction = () => (
  <Card sx={{ maxWidth: 420, pb: 3 }}>
    <CardHeader
      title="Родословная"
      subheader="4 поколения"
      action={
        <IconButton>
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>
      }
    />
  </Card>
);

export const WithButton = () => (
  <Card sx={{ maxWidth: 420, pb: 3 }}>
    <CardHeader
      title="Мои заявки"
      action={
        <Button size="small" variant="soft">
          Все
        </Button>
      }
    />
  </Card>
);
