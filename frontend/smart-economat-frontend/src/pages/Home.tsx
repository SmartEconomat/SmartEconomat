import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  Stack,
  Button,
  Alert,
} from '@mui/material';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';

// Icons
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import InventoryIcon from '@mui/icons-material/InventoryOutlined';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCartOutlined';
import LocalShippingIcon from '@mui/icons-material/LocalShippingOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmberOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SwapHorizIcon from '@mui/icons-material/SwapHorizOutlined';
import LoginIcon from '@mui/icons-material/LoginOutlined';
import AssignmentIcon from '@mui/icons-material/AssignmentOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarTodayOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import Spinner from '../components/ui/Spinner';
import {
  fetchDashboardStats,
  DashboardStats,
  DashboardMovimiento,
} from '../services/dashboard.service';

// ─── MetricCard ─────────────────────────────────────────────────────────────

const MetricCard = ({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  color: string;
  subtitle?: React.ReactNode;
}) => (
  <Card
    elevation={0}
    sx={{
      height: '100%',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
    }}
  >
    <CardContent>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Box>
          <Typography
            color="text.secondary"
            variant="subtitle2"
            fontWeight={600}
            gutterBottom
          >
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            p: 1,
            borderRadius: 1.5,
            bgcolor: `${color}.light`,
            color: `${color}.main`,
            display: 'flex',
          }}
        >
          {icon}
        </Box>
      </Box>
      {subtitle && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

// ─── QuickAction ─────────────────────────────────────────────────────────────

const QuickAction = ({
  title,
  icon,
  color,
  onClick,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}) => (
  <Paper
    elevation={0}
    onClick={onClick}
    sx={{
      p: 2,
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      cursor: 'pointer',
      transition: 'all 0.2s',
      '&:hover': {
        borderColor: `${color}.main`,
        bgcolor: `${color}.50`,
        transform: 'translateY(-2px)',
      },
    }}
  >
    <Box
      sx={{
        display: 'flex',
        p: 1,
        borderRadius: 1,
        bgcolor: `${color}.main`,
        color: 'white',
      }}
    >
      {icon}
    </Box>
    <Typography variant="subtitle2" fontWeight={600}>
      {title}
    </Typography>
  </Paper>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tiempoRelativoCorto(fechaStr: string): string {
  const fecha = new Date(fechaStr);
  const ahora = new Date();
  const diffMs = ahora.getTime() - fecha.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `${diffMin}min`;
  if (diffH < 24) return `${diffH}h`;
  if (diffD === 1) return 'ayer';
  if (diffD < 7) return `${diffD}d`;
  return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function tipoActividadLabel(mov: DashboardMovimiento): string {
  const labels: Record<string, string> = {
    entrada: 'Se ha registrado una entrada de stock',
    salida: 'Se ha registrado una salida de stock',
    ajuste: 'Se ha realizado un ajuste de inventario',
    pedido: 'Se ha registrado un pedido',
    entrada_compra: 'Se ha registrado una recepción de compra',
  };
  const base = labels[mov.tipo] ?? `Se ha registrado actividad (${mov.tipo})`;
  if (mov.productoNombre) return `${base}: ${mov.productoNombre}`;
  if (mov.descripcion) return `${base}: ${mov.descripcion}`;
  return base;
}

const TIPO_ACTIVIDAD_CONFIG: Record<
  string,
  { color: string; icon: React.ReactNode }
> = {
  entrada: { color: 'success', icon: <InventoryIcon fontSize="small" /> },
  salida: { color: 'error', icon: <SwapHorizIcon fontSize="small" /> },
  ajuste: { color: 'warning', icon: <SwapHorizIcon fontSize="small" /> },
  pedido: { color: 'info', icon: <ShoppingCartIcon fontSize="small" /> },
  entrada_compra: { color: 'secondary', icon: <LoginIcon fontSize="small" /> },
};

function getActividadIcon(tipo: string): React.ReactNode {
  return (
    TIPO_ACTIVIDAD_CONFIG[tipo]?.icon ?? <AssignmentIcon fontSize="small" />
  );
}

function getActividadColor(tipo: string): string {
  return TIPO_ACTIVIDAD_CONFIG[tipo]?.color ?? 'info';
}

// ─── Home ─────────────────────────────────────────────────────────────────────

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardStats();
      // Ensure recent activity is ordered newest-first, same as the movements table
      if (data.movimientosRecientes) {
        data.movimientosRecientes = [...data.movimientosRecientes].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      setStats(data);
    } catch (err: unknown) {
      console.error('Error cargando datos del dashboard:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Error desconocido al cargar el dashboard.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // ── Derived values ──────────────────────────────────────────────────────

  const totalProductos = stats?.totalProductos ?? 0;
  const productosEsteMes = stats?.productosEsteMes ?? 0;
  const totalProveedores = stats?.totalProveedores ?? 0;
  const pedidosPendientes = stats?.pedidos?.pendientes ?? 0;
  const pedidosProcesarHoy = stats?.pedidos?.completadosHoy ?? 0;
  const incidenciasCount = stats?.pedidos?.incidencias ?? 0;
  const alertasStock = stats?.inventario?.itemsBajoStock ?? 0;
  const movimientos = stats?.movimientosRecientes ?? [];

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Hola, {user?.name || 'Administrador'} 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Aquí tienes un resumen del estado actual del economato.
        </Typography>
      </Box>

      {/* Error state */}
      {error && (
        <Alert
          severity="error"
          icon={<ErrorOutlineIcon />}
          action={
            <Button color="inherit" size="small" onClick={loadStats}>
              Reintentar
            </Button>
          }
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* Metrics */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            md: 'repeat(4, 1fr)',
          },
          gap: 3,
          mb: 4,
        }}
      >
        {/* Total Productos */}
        <Box>
          <MetricCard
            title="Total Productos"
            value={isLoading ? <Spinner size="sm" /> : totalProductos}
            icon={<InventoryIcon />}
            color="primary"
            subtitle={
              isLoading ? undefined : (
                <>
                  {productosEsteMes > 0 ? (
                    <TrendingUpIcon fontSize="small" color="success" />
                  ) : (
                    <TrendingFlatIcon fontSize="small" color="disabled" />
                  )}
                  {productosEsteMes > 0
                    ? `+${productosEsteMes} agregado${productosEsteMes !== 1 ? 's' : ''} este mes`
                    : 'Sin nuevos productos este mes'}
                </>
              )
            }
          />
        </Box>

        {/* Pedidos Pendientes */}
        <Box>
          <MetricCard
            title="Pedidos Pendientes"
            value={isLoading ? <Spinner size="sm" /> : pedidosPendientes}
            icon={<ShoppingCartIcon />}
            color="warning"
            subtitle={
              isLoading ? undefined : (
                <>
                  <CalendarTodayIcon fontSize="small" />
                  {pedidosProcesarHoy > 0
                    ? `${pedidosProcesarHoy} recibido${pedidosProcesarHoy !== 1 ? 's' : ''} hoy`
                    : 'Sin recepciones hoy'}
                </>
              )
            }
          />
        </Box>

        {/* Incidencias */}
        <Box>
          <MetricCard
            title="Incidencias"
            value={isLoading ? <Spinner size="sm" /> : incidenciasCount}
            icon={<ErrorOutlineIcon />}
            color="error"
            subtitle={
              isLoading ? undefined : (
                <>
                  <ErrorOutlineIcon fontSize="small" />
                  {incidenciasCount > 0
                    ? `${incidenciasCount} pedido${incidenciasCount !== 1 ? 's' : ''} con incidencias`
                    : 'Sin incidencias'}
                </>
              )
            }
          />
        </Box>

        {/* Proveedores */}
        <Box>
          <MetricCard
            title="Proveedores"
            value={isLoading ? <Spinner size="sm" /> : totalProveedores}
            icon={<LocalShippingIcon />}
            color="info"
            subtitle={
              isLoading ? undefined : (
                <>
                  <CheckCircleOutlineIcon fontSize="small" color="success" />
                  Catálogo actualizado
                </>
              )
            }
          />
        </Box>

        {/* Alertas de Stock */}
        <Box>
          <MetricCard
            title="Alertas de Stock"
            value={isLoading ? <Spinner size="sm" /> : alertasStock}
            icon={<WarningAmberIcon />}
            color="error"
            subtitle={
              isLoading ? undefined : (
                <>
                  <WarningAmberIcon
                    fontSize="small"
                    color={alertasStock > 0 ? 'error' : 'disabled'}
                  />
                  {alertasStock > 0
                    ? `${alertasStock} ítem${alertasStock !== 1 ? 's' : ''} bajo mínimo`
                    : 'Stock en niveles correctos'}
                </>
              )
            }
          />
        </Box>
      </Box>

      {/* Quick Actions & Recent Activity */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
          gap: 3,
        }}
      >
        {/* Acciones Rápidas */}
        <Box>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              height: '100%',
            }}
          >
            <Typography variant="h6" fontWeight={600} mb={3}>
              Acciones Rápidas
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              <Box>
                <QuickAction
                  title="Nuevo Pedido"
                  icon={<ShoppingCartIcon fontSize="small" />}
                  color="primary"
                  onClick={() => navigate('/pedidos')}
                />
              </Box>
              <Box>
                <QuickAction
                  title="Añadir Producto"
                  icon={<InventoryIcon fontSize="small" />}
                  color="secondary"
                  onClick={() => navigate('/productos')}
                />
              </Box>
              <Box>
                <QuickAction
                  title="Registrar Recepción"
                  icon={<AddCircleOutlineIcon fontSize="small" />}
                  color="success"
                  onClick={() => navigate('/recepcion')}
                />
              </Box>
              <Box>
                <QuickAction
                  title="Nueva Receta"
                  icon={<AssignmentIcon fontSize="small" />}
                  color="warning"
                  onClick={() => navigate('/recetas')}
                />
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Actividad Reciente */}
        <Box>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              height: '100%',
            }}
          >
            <Typography variant="h6" fontWeight={600} mb={3}>
              Actividad Reciente
            </Typography>

            {isLoading ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight={120}
              >
                <Spinner size="sm" />
              </Box>
            ) : movimientos.length === 0 ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight={120}
              >
                <Typography variant="body2" color="text.secondary">
                  No hay actividad reciente registrada.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={3}>
                {movimientos.map((mov) => (
                  <Box
                    key={mov.id}
                    display="flex"
                    gap={2}
                    alignItems="flex-start"
                  >
                    <Box
                      sx={{
                        color: `${getActividadColor(mov.tipo)}.main`,
                        display: 'flex',
                        flexShrink: 0,
                        mt: 0.25,
                      }}
                    >
                      {getActividadIcon(mov.tipo)}
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5 }}>
                        {tipoActividadLabel(mov)}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontWeight: 600,
                            bgcolor: 'action.hover',
                            px: 1,
                            py: 0.2,
                            borderRadius: 1,
                          }}
                        >
                          {tiempoRelativoCorto(mov.createdAt)}
                        </Typography>
                        {mov.usuario && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
                          >
                            <Box
                              component="span"
                              sx={{
                                width: 3,
                                height: 3,
                                borderRadius: '50%',
                                bgcolor: 'text.disabled',
                              }}
                            />
                            {mov.usuario.nombre || mov.usuario.username}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}

            <Box mt={3} textAlign="center">
              <Button
                variant="text"
                size="small"
                onClick={() => navigate('/movimientos')}
              >
                Ver todo el historial
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Home;
