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
  return (
    <Box component="section">
      <Typography variant="h5" component="h2" gutterBottom>
        Instalación finalizada
      </Typography>
      <Typography color="text.secondary">
        {snapshot
          ? `${snapshot.state} · ${snapshot.message}`
          : "No hay snapshot final disponible."}
      </Typography>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ mt: 2 }}
      >
        <Button variant="contained" onClick={onOpenPanel}>
          Abrir panel local
        </Button>
        <Button variant="outlined" onClick={onRestart}>
          Reintentar instalación
        </Button>
      </Stack>
    </Box>
  );
}
