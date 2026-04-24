import { Box, Button, Stack, Typography } from "@mui/material";

import type { InstallerStateSnapshot } from "@shared/contracts";

interface FinishPageProps {
  snapshot: InstallerStateSnapshot | null;
  onOpenPanel: () => void;
  onRestart: () => void;
}

export function FinishPage({
  snapshot,
  onOpenPanel,
  onRestart,
}: FinishPageProps) {
  const isSuccess =
    snapshot?.state === "DONE" || snapshot?.state === "DONE_WITH_WARNINGS";

  return (
    <Box
      component="section"
      sx={{
        width: "100%",
        maxWidth: 820,
        mx: "auto",
        textAlign: "center",
      }}
    >
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 0.75 }}>
        {isSuccess ? "Instalación finalizada" : "Instalación con incidencias"}
      </Typography>
      <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
        {snapshot
          ? `${snapshot.state} · ${snapshot.message}`
          : "No hay snapshot final disponible."}
      </Typography>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ mt: 2.75, justifyContent: "center", alignItems: "center" }}
      >
        <Button
          variant="contained"
          onClick={onOpenPanel}
          disabled={!isSuccess}
          sx={{ minWidth: 220 }}
        >
          Abrir panel de control local
        </Button>
        <Button variant="outlined" onClick={onRestart} sx={{ minWidth: 220 }}>
          Reintentar instalación
        </Button>
      </Stack>
    </Box>
  );
}
