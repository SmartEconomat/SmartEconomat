import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
} from '@mui/material';
import { useAuth, usePermission, useAnyPermission } from '../store/auth.hooks';
import { PERMISSIONS } from '../sherlock-auth/permissions.constants';
import { useNavigate } from 'react-router-dom';
import DynamicFormModal from '../components/ui/DynamicFormModal';
import RecetaFormModal from '../features/recetas/RecetaFormModal';
import { buildRecetaPayload } from '../features/recetas/recetaForm.helpers';
import ProductoFormModal from '../features/productos/ProductoFormModal';
import { buildProductoPayload } from '../features/productos/productoForm.helpers';
import { getPedidoSchema } from '../features/pedidos/utils/pedidoSchema';
import { usePedidoActions } from '../features/pedidos/hooks/usePedidoActions';
import { PedidoFormValues } from '../features/pedidos/types/pedidos-ui.types';
import { createProducto } from '../services/producto.service';
import { createReceta } from '../services/receta.service';
import { Receta } from '../services/receta.types';
import { useToast } from '../store/toast.hooks';
import {
  AppNotification,
  fetchAppNotifications,
} from '../services/notifications.service';

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
import SettingsIcon from '@mui/icons-material/SettingsOutlined';

import Spinner from '../components/ui/Spinner';
import SummaryModal, { SummaryModalType } from '../components/ui/SummaryModal';
import {
  fetchDashboardStats,
  DashboardStats,
  DashboardMovimiento,
} from '../services/dashboard.service';
import MetricsCustomizer, {
  MetricDefinition,
} from '../components/dashboard/MetricsCustomizer';
import { eventBus, UI_EVENTS } from '../utils/eventBus';

// Stable references to avoid DynamicFormModal resetting form on re-render
const EMPTY_INITIAL_DATA: Record<string, unknown> = {};
const PEDIDO_NEW_INITIAL_DATA: Record<string, unknown> = {};

interface IngredienteFormValue {
  productoId: string;
  cantidad: number | string;
  unidad: string;
}

interface QuickActionFormData {
  contenido?: number | string;
  codigoBarras?: string;
  alergenos?: string[];
  nombre?: string;
  instrucciones?: string;
  tiempo?: Receta['tiempo'];
  dificultad?: Receta['dificultad'];
  tiempoPreparacion?: string;
  ingredientes?: IngredienteFormValue[];
  [key: string]: unknown;
}

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
      '&:hover': onClick
        ? {
            borderColor: `${color}.main`,
            transform: 'translateY(-4px)',
            boxShadow: `0 4px 20px -4px ${color === 'primary' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)'}`,
            '& .metric-icon-box': {
              transform: 'scale(1.1)',
            },
          }
        : {},
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
            color: 'common.white',
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
  { id: 'productos', label: 'dashboard.metrics.productos' },
  { id: 'pedidos', label: 'dashboard.metrics.pedidos' },
  { id: 'incidencias', label: 'dashboard.metrics.incidencias' },
  { id: 'stock', label: 'dashboard.metrics.stock' },
  { id: 'proveedores', label: 'dashboard.metrics.proveedores' },
  { id: 'notificaciones', label: 'dashboard.metrics.notificaciones' },
];

// ─── Home ─────────────────────────────────────────────────────────────────────

const Home: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  // Permissions from auth.hooks
  const canViewDashboard = usePermission(
    PERMISSIONS.dashboard.ver_estadisticas
  );
  const canListProductos = usePermission(PERMISSIONS.productos.listar);
  const canListPedidos = usePermission(PERMISSIONS.pedidos.listar);
  const canListIncidencias = usePermission(PERMISSIONS.incidencias.listar);
  const canListProveedores = usePermission(PERMISSIONS.proveedores.listar);
  const canListInventario = usePermission(PERMISSIONS.inventario.listar);
  const canCreatePedido = usePermission(PERMISSIONS.pedidos.crear);
  const canCreateProducto = usePermission(PERMISSIONS.productos.crear);
  const canCreateRecepcion = usePermission(PERMISSIONS.recepciones.crear);
  const canCreateReceta = usePermission(PERMISSIONS.recetas.crear);

  const canListUsers = usePermission(PERMISSIONS.usuarios.listar);
  const canReviewInventoryNotifications = useAnyPermission([
    PERMISSIONS.inventario.listar,
    PERMISSIONS.inventario.ver,
    'inventario:ver_alertas',
  ]);

  // Quick Action State
  const [quickActionTask, setQuickActionTask] = useState<
    null | 'product' | 'order' | 'reception' | 'recipe'
  >(null);
  const [isSavingQuickAction, setIsSavingQuickAction] = useState(false);

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
    return saved ? JSON.parse(saved) : AVAILABLE_METRICS.map((m) => m.id);
  });

  const handleUpdateVisibleMetrics = (newMetrics: string[]) => {
    setVisibleMetrics(newMetrics);
    localStorage.setItem(
      'dashboard_visible_metrics',
      JSON.stringify(newMetrics)
    );
  };

  const loadStats = useCallback(async () => {
    if (!canViewDashboard) {
      setStats(null);
      setIsLoading(false);
      setError('No tienes permisos para ver el dashboard.');
      return;
    }

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

      // 2. Notifications
      if (canListUsers || canReviewInventoryNotifications) {
        try {
          const notifs = await fetchAppNotifications({
            includePendingUsers: canListUsers,
            includeInventoryAlerts: canReviewInventoryNotifications,
          });
          setNotifications(notifs);
        } catch (nErr) {
          console.error('Error fetching notifications for home:', nErr);
        }
      }
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
  }, [canListUsers, canReviewInventoryNotifications, canViewDashboard]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const noOpDiscardDraft = useCallback(async () => {}, []);
  const { savePedido, isSaving: isSavingPedido } = usePedidoActions({
    reload: loadStats,
    discardDraft: noOpDiscardDraft,
  });

  const handleSavePedidoQuickAction = useCallback(
    async (formData: Record<string, unknown>) => {
      try {
        await savePedido(formData as PedidoFormValues);
        setQuickActionTask(null);
      } catch {
        // savePedido already shows toast on error
      }
    },
    [savePedido]
  );

  const handleSaveQuickAction = async (formData: QuickActionFormData) => {
    setIsSavingQuickAction(true);
    try {
      if (quickActionTask === 'product') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload = await buildProductoPayload(formData as any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await createProducto(payload as any);
        toast.success('Producto añadido correctamente.');
      } else if (quickActionTask === 'recipe') {
        const payload = await buildRecetaPayload(formData);
        await createReceta(payload);
        toast.success('Receta creada correctamente.');
      }
      setQuickActionTask(null);
      loadStats();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al guardar la acción rápida.';
      toast.error(message);
    } finally {
      setIsSavingQuickAction(false);
    }
  };

  const pedidoSchema = getPedidoSchema(null);

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
          {t('dashboard.welcome', { name: user?.name || 'Administrador' })}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('dashboard.summary')}
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Estadísticas del Economato */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={3}
            >
              <Typography variant="h6" fontWeight={600}>
                {t('dashboard.statsTitle')}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setIsCustomizerOpen(true)}
                sx={{
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main' },
                }}
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
              {visibleMetrics.includes('productos') && canListProductos && (
                <MetricCard
                  title={t('dashboard.metrics.productos')}
                  value={isLoading ? <Spinner size="sm" /> : totalProductos}
                  icon={<InventoryIcon />}
                  color="primary"
                  onClick={() =>
                    openSummary(
                      'productos',
                      t('dashboard.modals.productsSummary')
                    )
                  }
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
              {visibleMetrics.includes('pedidos') && canListPedidos && (
                <MetricCard
                  title={t('dashboard.metrics.pedidos')}
                  value={isLoading ? <Spinner size="sm" /> : pedidosPendientes}
                  icon={<ShoppingCartIcon />}
                  color="warning"
                  onClick={() =>
                    openSummary('pedidos', t('dashboard.modals.pndingOrders'))
                  }
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
              {visibleMetrics.includes('incidencias') && canListIncidencias && (
                <MetricCard
                  title={t('dashboard.metrics.incidencias')}
                  value={isLoading ? <Spinner size="sm" /> : incidenciasCount}
                  icon={<ErrorOutlineIcon />}
                  color="error"
                  onClick={() =>
                    openSummary(
                      'incidencias',
                      t('dashboard.modals.incidencesSummary')
                    )
                  }
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
              {visibleMetrics.includes('stock') && canListInventario && (
                <MetricCard
                  title={t('dashboard.metrics.stock')}
                  value={isLoading ? <Spinner size="sm" /> : alertasStock}
                  icon={<WarningAmberIcon />}
                  color="error"
                  onClick={() =>
                    openSummary('stock', t('dashboard.modals.stockAlerts'))
                  }
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
              {visibleMetrics.includes('proveedores') && canListProveedores && (
                <MetricCard
                  title={t('dashboard.metrics.proveedores')}
                  value={isLoading ? <Spinner size="sm" /> : totalProveedores}
                  icon={<LocalShippingIcon />}
                  color="info"
                  onClick={() =>
                    openSummary(
                      'proveedores',
                      t('dashboard.modals.suppliersSummary')
                    )
                  }
                  subtitle={
                    isLoading ? undefined : (
                      <>
                        <CheckCircleOutlineIcon
                          fontSize="small"
                          color="success"
                        />
                        Catálogo actualizado
                      </>
                    )
                  }
                />
              )}

              {/* Card de Notificaciones */}
              {visibleMetrics.includes('notificaciones') && (
                <MetricCard
                  title={t('dashboard.metrics.notificaciones')}
                  value={
                    isLoading ? (
                      <Spinner size="sm" />
                    ) : (
                      notifications.reduce((acc, curr) => acc + curr.count, 0)
                    )
                  }
                  icon={<NotificationsIcon />}
                  color={
                    notifications.some((n) => n.priority === 'urgent')
                      ? 'error'
                      : 'primary'
                  }
                  onClick={() =>
                    eventBus.emit(UI_EVENTS.OPEN_NOTIFICATION_CENTER)
                  }
                  subtitle={
                    isLoading ? undefined : (
                      <>
                        <NotificationsIcon fontSize="small" />
                        {notifications.length > 0
                          ? `${notifications.reduce((acc, curr) => acc + curr.count, 0)} acción${notifications.reduce((acc, curr) => acc + curr.count, 0) !== 1 ? 'es' : ''} pendiente${notifications.reduce((acc, curr) => acc + curr.count, 0) !== 1 ? 'es' : ''}`
                          : 'Sin notificaciones'}
                      </>
                    )
                  }
                />
              )}
            </Box>
          </Paper>

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
              {t('dashboard.quickActions')}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              {canCreatePedido && (
                <QuickAction
                  title={t('dashboard.actions.newOrder')}
                  icon={<ShoppingCartIcon fontSize="small" />}
                  color="primary"
                  onClick={() => setQuickActionTask('order')}
                />
              )}
              {canCreateProducto && (
                <QuickAction
                  title={t('dashboard.actions.addProduct')}
                  icon={<InventoryIcon fontSize="small" />}
                  color="secondary"
                  onClick={() => setQuickActionTask('product')}
                />
              )}
              {canCreateRecepcion && (
                <QuickAction
                  title={t('dashboard.actions.registerReception')}
                  icon={<AddCircleOutlineIcon fontSize="small" />}
                  color="success"
                  onClick={() => navigate('/recepciones')}
                />
              )}
              {canCreateReceta && (
                <QuickAction
                  title={t('dashboard.actions.newRecipe')}
                  icon={<AssignmentIcon fontSize="small" />}
                  color="warning"
                  onClick={() => setQuickActionTask('recipe')}
                />
              )}
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
              flexDirection: 'column',
            }}
          >
            <Typography variant="h6" fontWeight={600} mb={3}>
              {t('dashboard.recentActivity')}
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
                    {t('dashboard.noActivity')}
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
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{ mb: 0.5, lineHeight: 1.2 }}
                        >
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
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.75,
                              }}
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
                {t('common.viewHistory')}
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
      <ProductoFormModal
        isOpen={quickActionTask === 'product'}
        onClose={() => setQuickActionTask(null)}
        title={t('dashboard.modals.newProduct')}
        initialData={EMPTY_INITIAL_DATA}
        onSubmit={handleSaveQuickAction}
        isSubmitting={isSavingQuickAction}
      />

      <DynamicFormModal
        isOpen={quickActionTask === 'order'}
        onClose={() => setQuickActionTask(null)}
        title={t('dashboard.modals.newOrder')}
        size="lg"
        fields={pedidoSchema}
        initialData={PEDIDO_NEW_INITIAL_DATA}
        onSubmit={handleSavePedidoQuickAction}
        isSubmitting={isSavingPedido}
        requireConfirmation
        confirmationMessage={t('common.confirmAction')}
      />

      <RecetaFormModal
        isOpen={quickActionTask === 'recipe'}
        onClose={() => setQuickActionTask(null)}
        title={t('dashboard.modals.newRecipe')}
        initialData={EMPTY_INITIAL_DATA}
        onSubmit={handleSaveQuickAction}
        isSubmitting={isSavingQuickAction}
      />
    </Box>
  );
};

export default Home;
