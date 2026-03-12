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
  IconButton,
  Divider,
} from '@mui/material';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '@mui/material';
import DynamicFormModal from '../components/ui/DynamicFormModal';
import RecepcionWizard from '../components/recepcion/RecepcionWizard';
import { productoSchema, pedidoSchema, recetaSchema } from '../utils/schemas';
import { createProducto } from '../services/producto.service';
import { createPedido } from '../services/pedido.service';
import { createReceta } from '../services/receta.service';
import { fetchProveedores } from '../services/proveedor.service';
import { useToast } from '../store/ToastContext';

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
import NotificationsIcon from '@mui/icons-material/Notifications';

import Spinner from '../components/ui/Spinner';
import SummaryModal, { SummaryModalType } from '../components/ui/SummaryModal';
import {
  fetchDashboardStats,
  DashboardStats,
  DashboardMovimiento,
} from '../services/dashboard.service';
import MetricsCustomizer, { MetricDefinition } from '../components/dashboard/MetricsCustomizer';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';

// ─── MetricCard ─────────────────────────────────────────────────────────────

const MetricCard = ({
  title,
  value,
  icon,
  color,
  subtitle,
  onClick,
}: {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  color: string;
  subtitle?: React.ReactNode;
  onClick?: () => void;
}) => (
  <Card
    elevation={0}
    onClick={onClick}
    sx={{
      height: '100%',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': onClick ? {
        borderColor: `${color}.main`,
        transform: 'translateY(-4px)',
        boxShadow: `0 4px 20px -4px ${color === 'primary' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)'}`,
        '& .metric-icon-box': {
          transform: 'scale(1.1)',
        }
      } : {},
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
          className="metric-icon-box"
          sx={{
            p: 1,
            borderRadius: 1.5,
            bgcolor: `${color}.light`,
            color: `${color}.main`,
            display: 'flex',
            transition: 'transform 0.2s',
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

const AVAILABLE_METRICS: MetricDefinition[] = [
  { id: 'productos', label: 'Total Productos' },
  { id: 'pedidos', label: 'Pedidos Pendientes' },
  { id: 'incidencias', label: 'Incidencias' },
  { id: 'stock', label: 'Alertas de Stock' },
  { id: 'proveedores', label: 'Proveedores' },
  { id: 'notificaciones', label: 'Notificaciones' },
];

// ─── Home ─────────────────────────────────────────────────────────────────────

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  // Quick Action State
  const [quickActionTask, setQuickActionTask] = useState<null | 'product' | 'order' | 'reception' | 'recipe'>(null);
  const [isSavingQuickAction, setIsSavingQuickAction] = useState(false);
  const [proveedores, setProveedores] = useState<any[]>([]);

  // Summary Modal state
  const [summaryModal, setSummaryModal] = useState<{
    isOpen: boolean;
    type: SummaryModalType | null;
    title: string;
  }>({
    isOpen: false,
    type: null,
    title: '',
  });

  const openSummary = (type: SummaryModalType, title: string) => {
    setSummaryModal({ isOpen: true, type, title });
  };

  // Metrics Customization
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [visibleMetrics, setVisibleMetrics] = useState<string[]>(() => {
    const saved = localStorage.getItem('dashboard_visible_metrics');
    return saved ? JSON.parse(saved) : AVAILABLE_METRICS.map(m => m.id);
  });

  const handleUpdateVisibleMetrics = (newMetrics: string[]) => {
    setVisibleMetrics(newMetrics);
    localStorage.setItem('dashboard_visible_metrics', JSON.stringify(newMetrics));
  };

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

  useEffect(() => {
    if (quickActionTask === 'order') {
      const loadProveedores = async () => {
        try {
          const resp = await fetchProveedores(1, 100);
          setProveedores(resp.data);
        } catch (err) {
          console.error("Error loading proveedores for quick action", err);
        }
      };
      loadProveedores();
    }
  }, [quickActionTask]);

  const handleSaveQuickAction = async (formData: Record<string, any>) => {
    setIsSavingQuickAction(true);
    try {
      if (quickActionTask === 'product') {
        const payload = {
          ...formData,
          contenido: Number(formData.contenido),
          alergenos: Array.isArray(formData.alergenos) ? formData.alergenos : []
        };
        await createProducto(payload);
        toast.success('Producto añadido correctamente.');
      } else if (quickActionTask === 'order') {
        const payload: any = {
          proveedorId: formData.proveedorId,
          fechaEntrega: formData.fechaEntrega || undefined,
          pedidoProductos: Array.isArray(formData.pedidoProductos) ? formData.pedidoProductos.map((l: any) => ({
            productoId: l.productoId,
            cantidad: Number(l.cantidad)
          })) : []
        };
        await createPedido(payload);
        toast.success('Pedido creado correctamente.');
      } else if (quickActionTask === 'recipe') {
        const payload = {
          nombre: formData.nombre,
          instrucciones: formData.instrucciones,
          tiempo: formData.tiempo,
          dificultad: formData.dificultad,
          tiempoPreparacion: formData.tiempoPreparacion,
          ingredientes: Array.isArray(formData.ingredientes) ? formData.ingredientes.map((ing: any) => ({
            productoId: ing.productoId,
            cantidad: Number(ing.cantidad),
            unidad: ing.unidad
          })) : [],
        };
        await createReceta(payload);
        toast.success('Receta creada correctamente.');
      }
      setQuickActionTask(null);
      loadStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar la acción rápida.';
      toast.error(message);
    } finally {
      setIsSavingQuickAction(false);
    }
  };

  const currentPedidoSchema = pedidoSchema.map(field => {
    if (field.name === 'proveedorId') {
      return {
        ...field,
        options: proveedores.map(p => ({ value: p.id, label: p.nombre }))
      };
    }
    return field;
  });

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

      {/* Main Layout Grid: Main Content | Sidebar */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
          gap: 3,
        }}
      >
        {/* Main Column: Stats + Quick Actions */}
        {/* Columna Principal: Estadísticas y Acciones */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Header of section with customizer button */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 1.2 }}>
              ESTADÍSTICAS DEL NEGOCIO
            </Typography>
            <IconButton
              size="small"
              onClick={() => setIsCustomizerOpen(true)}
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Metrics Grid (KPIs) */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 3,
            }}
          >
            {/* Total Productos */}
            {visibleMetrics.includes('productos') && (
              <MetricCard
                title="Total Productos"
                value={isLoading ? <Spinner size="sm" /> : totalProductos}
                icon={<InventoryIcon />}
                color="primary"
                onClick={() => openSummary('productos', 'Listado de Productos')}
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
            )}

            {/* Pedidos Pendientes */}
            {visibleMetrics.includes('pedidos') && (
              <MetricCard
                title="Pedidos Pendientes"
                value={isLoading ? <Spinner size="sm" /> : pedidosPendientes}
                icon={<ShoppingCartIcon />}
                color="warning"
                onClick={() => openSummary('pedidos', 'Pedidos Pendientes')}
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
            )}

            {/* Incidencias */}
            {visibleMetrics.includes('incidencias') && (
              <MetricCard
                title="Incidencias"
                value={isLoading ? <Spinner size="sm" /> : incidenciasCount}
                icon={<ErrorOutlineIcon />}
                color="error"
                onClick={() => openSummary('incidencias', 'Listado de Incidencias')}
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
            )}

            {/* Alertas de Stock */}
            {visibleMetrics.includes('stock') && (
              <MetricCard
                title="Alertas de Stock"
                value={isLoading ? <Spinner size="sm" /> : alertasStock}
                icon={<WarningAmberIcon />}
                color="error"
                onClick={() => openSummary('stock', 'Productos Bajo Mínimo')}
                subtitle={
                  isLoading ? undefined : (
                    <>
                      <WarningAmberIcon
                        fontSize="small"
                        color={alertasStock > 0 ? 'error' : 'disabled'}
                      />
                      {alertasStock > 0
                        ? `${alertasStock} ítem${alertasStock !== 1 ? 's' : ''} bajo mínimo`
                        : 'Stock correcto'}
                    </>
                  )
                }
              />
            )}

            {/* Proveedores */}
            {visibleMetrics.includes('proveedores') && (
              <MetricCard
                title="Proveedores"
                value={isLoading ? <Spinner size="sm" /> : totalProveedores}
                icon={<LocalShippingIcon />}
                color="info"
                onClick={() => openSummary('proveedores', 'Nuestros Proveedores')}
                subtitle={
                  isLoading ? undefined : (
                    <>
                      <CheckCircleOutlineIcon fontSize="small" color="success" />
                      Catálogo actualizado
                    </>
                  )
                }
              />
            )}

            {/* Card de Notificaciones */}
            {visibleMetrics.includes('notificaciones') && (
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'primary.50'
                  }
                }}
              >
                <Stack spacing={1} alignItems="center">
                  <NotificationsIcon color="primary" />
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    notificaciones
                  </Typography>
                </Stack>
              </Card>
            )}
          </Box>

          {/* Acciones Rápidas */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
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
              <QuickAction
                title="Nuevo Pedido"
                icon={<ShoppingCartIcon fontSize="small" />}
                color="primary"
                onClick={() => setQuickActionTask('order')}
              />
              <QuickAction
                title="Añadir Producto"
                icon={<InventoryIcon fontSize="small" />}
                color="secondary"
                onClick={() => setQuickActionTask('product')}
              />
              <QuickAction
                title="Registrar Recepción"
                icon={<AddCircleOutlineIcon fontSize="small" />}
                color="success"
                onClick={() => setQuickActionTask('reception')}
              />
              <QuickAction
                title="Nueva Receta"
                icon={<AssignmentIcon fontSize="small" />}
                color="warning"
                onClick={() => setQuickActionTask('recipe')}
              />
            </Box>
          </Paper>
        </Box>

        {/* Sidebar Column: Recent Activity */}
        <Box>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography variant="h6" fontWeight={600} mb={3}>
              Actividad Reciente
            </Typography>

            <Box sx={{ flexGrow: 1 }}>
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
                        <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5, lineHeight: 1.2 }}>
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
            </Box>

            <Box mt={3} textAlign="center">
              <Button
                variant="text"
                size="small"
                onClick={() => navigate('/movimientos')}
                fullWidth
              >
                Ver todo el historial
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Summary Modal */}
      <SummaryModal
        isOpen={summaryModal.isOpen}
        type={summaryModal.type}
        title={summaryModal.title}
        onClose={() => setSummaryModal({ ...summaryModal, isOpen: false })}
      />

      {/* Metrics Customizer */}
      <MetricsCustomizer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        availableMetrics={AVAILABLE_METRICS}
        visibleMetrics={visibleMetrics}
        onUpdate={handleUpdateVisibleMetrics}
      />

      {/* Quick Action Modals */}
      <DynamicFormModal
        isOpen={quickActionTask === 'product'}
        onClose={() => setQuickActionTask(null)}
        title="Añadir Nuevo Producto"
        size="md"
        fields={productoSchema}
        initialData={{}}
        onSubmit={handleSaveQuickAction}
        isSubmitting={isSavingQuickAction}
      />

      <DynamicFormModal
        isOpen={quickActionTask === 'order'}
        onClose={() => setQuickActionTask(null)}
        title="Crear Nuevo Pedido"
        size="md"
        fields={currentPedidoSchema}
        initialData={{ estado: 'pendiente' }}
        onSubmit={handleSaveQuickAction}
        isSubmitting={isSavingQuickAction}
      />

      <DynamicFormModal
        isOpen={quickActionTask === 'recipe'}
        onClose={() => setQuickActionTask(null)}
        title="Crear Nueva Receta"
        size="md"
        fields={recetaSchema}
        initialData={{}}
        onSubmit={handleSaveQuickAction}
        isSubmitting={isSavingQuickAction}
      />

      <Dialog
        fullScreen
        open={quickActionTask === 'reception'}
        onClose={() => setQuickActionTask(null)}
      >
        <Box sx={{ p: 2, height: '100%', bgcolor: 'background.default' }}>
          <RecepcionWizard
            onClose={() => setQuickActionTask(null)}
            onSuccess={() => {
              setQuickActionTask(null);
              loadStats();
            }}
          />
        </Box>
      </Dialog>
    </Box>
  );
};

export default Home;
