import { Stack, Typography, LinearProgress, CircularProgress } from 'show-ring-ds';

export const Determinate = () => (
  <Stack spacing={2} sx={{ width: 360 }}>
    <Typography variant="body2">Заполнено мест в ринге: 72%</Typography>
    <LinearProgress variant="determinate" value={72} />
    <LinearProgress variant="determinate" value={40} color="warning" />
    <LinearProgress variant="determinate" value={95} color="error" />
  </Stack>
);

export const Loading = () => (
  <Stack direction="row" spacing={3} alignItems="center" sx={{ width: 360 }}>
    <CircularProgress />
    <CircularProgress color="info" size={28} />
    <LinearProgress variant="buffer" value={60} valueBuffer={80} sx={{ flex: 1 }} />
  </Stack>
);
