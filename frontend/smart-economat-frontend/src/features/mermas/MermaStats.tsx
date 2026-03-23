import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import { MermaStats, MotivoMerma } from '../../services/merma.types';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InventoryIcon from '@mui/icons-material/Inventory';

interface MermaStatsProps {
  stats: MermaStats | null;
  isLoading?: boolean;
}

const MOTIVO_LABELS: Record<string, string> = {
  [MotivoMerma.ROTURA]: 'Rotura de envase',
  [MotivoMerma.DETERIORO]: 'Deterioro / Caducidad',
  [MotivoMerma.HURTO]: 'Hurto / Pérdida',
  [MotivoMerma.ERROR_PREPARACION]: 'Error de preparación',
  [MotivoMerma.OTROS]: 'Otros motivos',
};

const MermaStatsView: React.FC<MermaStatsProps> = ({ stats, isLoading }) => {
  if (isLoading) return <LinearProgress />;
  if (!stats) return null;

  const totalCantidad = stats.porMotivo.reduce(
    (acc, curr) => acc + Number(curr.totalCantidad),
    0
  );
  const totalRegistros = stats.porMotivo.reduce(
    (acc, curr) => acc + Number(curr.totalRegistros),
    0
  );

  return (
    <Box mb={4}>
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  p={1.5}
                  borderRadius={1.5}
                  bgcolor="error.light"
                  color="white"
                >
                  <WarningAmberIcon />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Pérdidas (Cantidad)
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {totalCantidad.toFixed(2)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  p={1.5}
                  borderRadius={1.5}
                  bgcolor="warning.light"
                  color="white"
                >
                  <InventoryIcon />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Registros de Merma
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {totalRegistros}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" fontWeight={600} mb={2}>
        Distribución por Motivo
      </Typography>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Stack spacing={3}>
          {stats.porMotivo.map((m) => (
            <Box key={m.motivo}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" fontWeight={500}>
                  {MOTIVO_LABELS[m.motivo] || m.motivo}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Number(m.totalCantidad).toFixed(2)} (
                  {((Number(m.totalCantidad) / totalCantidad) * 100).toFixed(1)}
                  %)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(Number(m.totalCantidad) / totalCantidad) * 100}
                color={m.motivo === MotivoMerma.HURTO ? 'error' : 'warning'}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          ))}
          {stats.porMotivo.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              No hay datos registrados.
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default MermaStatsView;
