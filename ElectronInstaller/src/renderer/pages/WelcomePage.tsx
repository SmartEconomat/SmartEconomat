import { Box, Button, Stack, Typography } from "@mui/material";

interface WelcomePageProps {
  onContinue: () => void;
}

export function WelcomePage({ onContinue }: WelcomePageProps) {
  return (
    <Box component="section">
      <Typography variant="h5" component="h2" gutterBottom>
        Bienvenida
      </Typography>
      <Typography color="text.secondary">
        Este wizard valida host, genera configuración segura y despliega
        SmartEconomat con Docker Compose. Ninguna acción destructiva se ejecuta
        sin confirmación explícita.
      </Typography>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ mt: 2 }}
      >
        <Button
          variant="contained"
          onClick={onContinue}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          Iniciar instalación guiada
        </Button>
      </Stack>
    </Box>
  );
}
