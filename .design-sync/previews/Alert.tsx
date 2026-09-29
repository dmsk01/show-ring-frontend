import { Alert, Stack, Button, AlertTitle } from 'show-ring-ds';

export const Severities = () => (
  <Stack spacing={1.5} sx={{ maxWidth: 520 }}>
    <Alert severity="info">Регистрация на выставку закроется 15 октября.</Alert>
    <Alert severity="success">Заявка подтверждена организатором.</Alert>
    <Alert severity="warning">Не загружена копия родословной.</Alert>
    <Alert severity="error">Не удалось оплатить взнос. Попробуйте ещё раз.</Alert>
  </Stack>
);

export const Variants = () => (
  <Stack spacing={1.5} sx={{ maxWidth: 520 }}>
    <Alert variant="filled" severity="success">Заявка отправлена</Alert>
    <Alert variant="outlined" severity="warning">Срок оплаты истекает завтра</Alert>
  </Stack>
);

export const WithTitleAndAction = () => (
  <Alert
    severity="warning"
    sx={{ maxWidth: 520 }}
    action={
      <Button color="inherit" size="small">
        Загрузить
      </Button>
    }
  >
    <AlertTitle>Нужны документы</AlertTitle>
    Для участия в классе чемпионов приложите копию диплома.
  </Alert>
);
