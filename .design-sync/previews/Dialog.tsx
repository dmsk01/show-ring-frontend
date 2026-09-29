import {
  Box,
  Button,
  Dialog,
  TextField,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
} from 'show-ring-ds';

// Rendered in place (no portal, no backdrop, no enter transition) so the open
// state is visible inside the preview card. In a real screen use plain <Dialog open={...}>.
export const Form = () => (
  <Box sx={{ position: 'relative', width: 520, height: 320 }}>
    <Dialog
      open
      fullWidth
      maxWidth="xs"
      disablePortal
      hideBackdrop
      disableAutoFocus
      disableEnforceFocus
      disableScrollLock
      transitionDuration={0}
      sx={{ position: 'absolute' }}
    >
      <DialogTitle>Записать на выставку</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Кубок Москвы · 12 октября 2026
        </Typography>
        <TextField fullWidth label="Собака" defaultValue="Арчибальд Северная Звезда" />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit">
          Отмена
        </Button>
        <Button variant="contained">Записать</Button>
      </DialogActions>
    </Dialog>
  </Box>
);
