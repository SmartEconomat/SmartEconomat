import { Box, Button, Stack, Typography } from "@mui/material";

interface WelcomePageProps {
  onContinue: () => void;
}

export function WelcomePage({ onContinue }: WelcomePageProps) {
  return (
    <Box
      component="section"
      sx={{
        width: "100%",
        maxWidth: 860,
        mx: "auto",
        py: { xs: 0.25, md: 1 },
        textAlign: "center",
      }}
    >
      <Typography
        variant="h4"
        component="h2"
        gutterBottom
        sx={{
          fontWeight: 700,
          letterSpacing: "-0.02em",
          mb: 1,
          fontSize: { xs: "1.85rem", md: "2.1rem" },
        }}
      >
        Bienvenida
      </Typography>
      <Typography
        color="text.secondary"
        sx={{ lineHeight: 1.68, fontSize: { xs: "1rem", md: "1.08rem" } }}
      >
        Este wizard valida host, genera configuración segura y despliega
        SmartEconomat con Docker Compose. Ninguna acción destructiva se ejecuta
        sin confirmación explícita.
      </Typography>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ mt: 2.75, justifyContent: "center" }}
      >
        <Button
          variant="contained"
          onClick={onContinue}
          sx={{
            width: { xs: "100%", sm: "auto" },
            py: 1,
            px: 3.2,
            fontWeight: 700,
            letterSpacing: "0.01em",
          }}
        >
          Iniciar instalación guiada
        </Button>
      </Stack>
    </Box>
  );
}
