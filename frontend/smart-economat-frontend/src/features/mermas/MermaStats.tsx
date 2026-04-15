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
import BrokenImageOutlinedIcon from '@mui/icons-material/BrokenImageOutlined';
import { useTranslation } from 'react-i18next';

/**
 * Props for the {@link MermaStatsView} component.
 */
interface MermaStatsProps {
  /** Aggregated merma statistics, or null while loading. */
  stats: MermaStats | null;
  /** Whether statistics data is currently being fetched. */
  isLoading?: boolean;
}

/**
 * Displays aggregated merma (waste/loss) statistics including totals and a
 * breakdown by motivo (reason) shown as labelled progress bars.
 *
 * Renders a loading indicator while data is being fetched and nothing when
 * stats are null after loading.
 *
 * @param {MermaStatsProps} props - Component props.
 * @returns JSX rendered statistics panel, a progress bar, or null.
 * @example
 * <MermaStats stats={mermaStats} isLoading={isLoading} />
 */
const MermaStatsView: React.FC<MermaStatsProps> = ({ stats, isLoading }) => {
  const { t } = useTranslation();

  /** Localised labels keyed by MotivoMerma enum value. */
  const MOTIVO_LABELS: Record<string, string> = {
    [MotivoMerma.ROTURA]: t('merma.form.motivoOpciones.roturaEnvase'),
    [MotivoMerma.DETERIORO]: t('merma.form.motivoOpciones.deterioroCaducidad'),
    [MotivoMerma.HURTO]: t('merma.form.motivoOpciones.hurto'),
    [MotivoMerma.ERROR_PREPARACION]: t(
      'merma.form.motivoOpciones.errorPreparacion'
    ),
    [MotivoMerma.OTROS]: t('merma.form.motivoOpciones.otros'),
  };

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
                  <BrokenImageOutlinedIcon />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('merma.stats.totalPerdidas')}
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
                  <BrokenImageOutlinedIcon />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('merma.stats.totalRegistros')}
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
        {t('merma.stats.distribucionPorMotivo')}
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
              {t('merma.stats.sinDatos')}
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default MermaStatsView;
