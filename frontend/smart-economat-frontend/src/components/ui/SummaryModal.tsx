import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Stack,
  Paper,
  Collapse,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InventoryIcon from '@mui/icons-material/InventoryOutlined';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCartOutlined';
import LocalShippingIcon from '@mui/icons-material/LocalShippingOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmberOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Spinner from './Spinner';
import StatusChip from './StatusChip';
import { fetchProductos } from '../../services/producto.service';
import { fetchPedidos } from '../../services/pedido.service';
import { fetchProveedores } from '../../services/proveedor.service';
import { Producto } from '../../services/producto.types';
import { EstadoPedido, Pedido } from '../../services/pedido.types';
import { Proveedor } from '../../services/proveedor.types';
import { fetchIncidencias } from '../../services/incidencia.service';
import {
  EstadoReclamacion,
  Incidencia,
  TipoDiferencia,
} from '../../services/incidencia.types';
import { fetchAlertasStock } from '../../services/inventario.service';
import type { AlertaStock } from '../../services/inventario.types';
import { formatPedidoListNumber } from '../../features/pedidos/utils/pedidoFormatters';

export type SummaryModalType =
  | 'productos'
  | 'pedidos'
  | 'incidencias'
  | 'stock'
  | 'proveedores';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: SummaryModalType | null;
  title: string;
}

interface SummaryProducto extends Producto {
  stockActual?: number;
  stockMinimo?: number;
  precioVenta?: number;
  categoria?: {
    nombre?: string;
  };
}

type SummaryItem =
  | SummaryProducto
  | Pedido
  | Proveedor
  | Incidencia
  | AlertaStock;

const isPedido = (item: SummaryItem): item is Pedido => 'fechaPedido' in item;

const isProveedor = (item: SummaryItem): item is Proveedor =>
  !('fechaPedido' in item) && 'contacto' in item;

const isIncidencia = (item: SummaryItem): item is Incidencia =>
  'pedidoId' in item && 'lineas' in item;

const isAlertaStock = (item: SummaryItem): item is AlertaStock =>
  'nombreProducto' in item && 'cantidadActual' in item;

const isSummaryProducto = (item: SummaryItem): item is SummaryProducto =>
  !isPedido(item) &&
  !isProveedor(item) &&
  !isIncidencia(item) &&
  !isAlertaStock(item);

const SUMMARY_PAGE_SIZE = 50;
const DASHBOARD_PENDING_ORDER_STATES = [
  EstadoPedido.PENDIENTE_DE_APROBACION,
  EstadoPedido.POR_RECEPCIONAR,
  EstadoPedido.PARCIAL,
  EstadoPedido.INCIDENCIA,
] as const;

const tipoDiferenciaLabel = (
  t: (key: string) => string
): Record<TipoDiferencia, string> => ({
  FALTANTE: t('modal.summary.incidencias.faltante'),
  EXCESO: t('modal.summary.incidencias.exceso'),
  DEFECTUOSO: t('modal.summary.incidencias.defectuoso'),
});

const estadoReclamacionLabel = (
  t: (key: string) => string
): Record<EstadoReclamacion, string> => ({
  PENDIENTE: t('modal.summary.incidencias.pendiente'),
  RECLAMADO: t('modal.summary.incidencias.reclamado'),
  ABONADO: t('modal.summary.incidencias.abonado'),
  REENVIADO: t('modal.summary.incidencias.reenviado'),
});

const decimalFormatter = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function normalizeNumericValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return null;
}

function formatDecimalOrFallback(value: unknown, fallback = 'N/D'): string {
  const normalized = normalizeNumericValue(value);
  if (normalized == null) return fallback;
  return decimalFormatter.format(normalized);
}

function formatCompactId(value: string | null | undefined): string {
  if (!value) {
    return 'N/D';
  }

  return value.substring(0, 8);
}

const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SummaryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedIncidenciaId, setExpandedIncidenciaId] = useState<
    string | null
  >(null);

  const fetchAllPedidosByEstado = useCallback(
    async (estado: EstadoPedido): Promise<Pedido[]> => {
      const firstPage = await fetchPedidos(1, SUMMARY_PAGE_SIZE, '', estado);
      const allPedidos = [...firstPage.data];

      if (firstPage.totalPages <= 1) {
        return allPedidos;
      }

      const remainingPages = await Promise.all(
        Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
          fetchPedidos(index + 2, SUMMARY_PAGE_SIZE, '', estado)
        )
      );

      remainingPages.forEach((page) => {
        allPedidos.push(...page.data);
      });

      return allPedidos;
    },
    []
  );

  const fetchDashboardPendingPedidos = useCallback(async (): Promise<
    Pedido[]
  > => {
    const pagesByStatus = await Promise.all(
      DASHBOARD_PENDING_ORDER_STATES.map((estado) =>
        fetchAllPedidosByEstado(estado)
      )
    );

    const dedupedPedidos = new Map<string, Pedido>();
    pagesByStatus.flat().forEach((pedido) => {
      dedupedPedidos.set(pedido.id, pedido);
    });

    return Array.from(dedupedPedidos.values()).sort(
      (left, right) =>
        new Date(right.fechaPedido).getTime() -
        new Date(left.fechaPedido).getTime()
    );
  }, [fetchAllPedidosByEstado]);

  const fetchAllIncidencias = useCallback(async (): Promise<Incidencia[]> => {
    const firstPage = await fetchIncidencias({
      page: 1,
      limit: SUMMARY_PAGE_SIZE,
      resuelta: false,
    });

    const incidencias = [...firstPage.data];

    if (firstPage.totalPages <= 1) {
      return incidencias.sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime()
      );
    }

    const remainingPages = await Promise.all(
      Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
        fetchIncidencias({
          page: index + 2,
          limit: SUMMARY_PAGE_SIZE,
          resuelta: false,
        })
      )
    );

    remainingPages.forEach((page) => {
      incidencias.push(...page.data);
    });

    return incidencias.sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  }, []);

  const loadData = useCallback(async () => {
    if (!type) {
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);
    setExpandedIncidenciaId(null);
    try {
      let result: SummaryItem[] = [];
      if (type === 'productos') {
        const res = await fetchProductos(1, 50);
        result = res.data as SummaryProducto[];
      } else if (type === 'pedidos') {
        result = await fetchDashboardPendingPedidos();
      } else if (type === 'incidencias') {
        result = await fetchAllIncidencias();
      } else if (type === 'stock') {
        result = await fetchAlertasStock();
      } else if (type === 'proveedores') {
        const res = await fetchProveedores(1, 50);
        result = res.data;
      }
      setData(result);
    } catch (err) {
      console.error('Error loading summary data:', err);
      setError(t('modal.summary.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [fetchAllIncidencias, fetchDashboardPendingPedidos, type, t]);

  useEffect(() => {
    if (isOpen && type) {
      void loadData();
    } else {
      setData([]);
      setError(null);
    }
  }, [isOpen, type, loadData]);

  const getIcon = () => {
    switch (type) {
      case 'productos':
        return <InventoryIcon color="primary" />;
      case 'pedidos':
        return <ShoppingCartIcon color="warning" />;
      case 'incidencias':
        return <ErrorOutlineIcon color="error" />;
      case 'stock':
        return <WarningAmberIcon color="error" />;
      case 'proveedores':
        return <LocalShippingIcon color="info" />;
      default:
        return null;
    }
  };

  const pendingPedidoSummary = useMemo(() => {
    if (type !== 'pedidos') {
      return null;
    }

    const pedidos = data.filter(isPedido);
    const byStatus = DASHBOARD_PENDING_ORDER_STATES.map((estado) => ({
      estado,
      total: pedidos.filter((pedido) => pedido.estado === estado).length,
    })).filter((entry) => entry.total > 0);

    return byStatus;
  }, [data, type]);

  const getButtonLabel = () => {
    if (!type)
      return t('modal.summary.verTodos', { title: title.toLowerCase() });

    const labels: Record<SummaryModalType, string> = {
      productos: t('modal.summary.btn.productos'),
      pedidos: t('modal.summary.btn.pedidos'),
      incidencias: t('modal.summary.btn.incidencias'),
      stock: t('modal.summary.btn.stock'),
      proveedores: t('modal.summary.btn.proveedores'),
    };

    return (
      labels[type] ||
      t('modal.summary.verTodos', { title: title.toLowerCase() })
    );
  };

  const handleSeeAll = () => {
    onClose();
    switch (type) {
      case 'productos':
        navigate('/productos');
        break;
      case 'pedidos':
        // Redirigir a mis pedidos pendientes
        navigate('/pedidos?tab=0&ownStatus=pendientes');
        break;
      case 'incidencias':
        // Redirigir a incidencias por resolver
        navigate('/incidencias?resolucion=por_resolver');
        break;
      case 'stock':
        // Redirigir a inventario con filtro de stock bajo
        navigate('/inventario?filter=stockBajo');
        break;
      case 'proveedores':
        navigate('/proveedores');
        break;
      default:
        break;
    }
  };

  const handleToggleIncidencia = (incidenciaId: string) => {
    setExpandedIncidenciaId((current) =>
      current === incidenciaId ? null : incidenciaId
    );
  };

  const renderItem = (item: SummaryItem) => {
    if (type === 'stock' && isAlertaStock(item)) {
      const stockLabel = `${formatDecimalOrFallback(item.cantidadActual)} / ${formatDecimalOrFallback(item.cantidadMinima)} ${item.unidad || t('modal.summary.und')}`;

      return (
        <ListItem key={item.id} sx={{ px: 0 }}>
          <ListItemIcon>
            <WarningAmberIcon color="error" />
          </ListItemIcon>
          <ListItemText
            primary={item.nombreProducto}
            secondaryTypographyProps={{ component: 'div' }}
            secondary={
              <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                {item.proveedorNombre && (
                  <Typography variant="caption" color="text.secondary">
                    {item.proveedorNombre}
                  </Typography>
                )}
                {item.ubicacionNombre && (
                  <Typography variant="caption" color="text.secondary">
                    {item.ubicacionNombre}
                  </Typography>
                )}
                <Chip
                  label={stockLabel}
                  size="small"
                  variant="outlined"
                  color="error"
                />
              </Stack>
            }
          />
        </ListItem>
      );
    }

    if (type === 'productos' && isSummaryProducto(item)) {
      const stockActual = normalizeNumericValue(item.stockActual);
      const stockMinimo = normalizeNumericValue(item.stockMinimo);
      const stockLabel =
        stockActual != null
          ? `${formatDecimalOrFallback(stockActual)} ${item.unidad || t('modal.summary.und')}`
          : t('modal.summary.nd');
      const isLowStock =
        stockActual != null &&
        stockMinimo != null &&
        stockActual <= stockMinimo;

      return (
        <ListItem key={item.id} sx={{ px: 0 }}>
          <ListItemIcon>
            <InventoryIcon />
          </ListItemIcon>
          <ListItemText
            primary={item.nombre}
            secondaryTypographyProps={{ component: 'div' }}
            secondary={
              <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {item.categoria?.nombre || t('modal.summary.sinCategoria')}
                </Typography>
                <Chip
                  label={stockLabel}
                  size="small"
                  variant="outlined"
                  color={isLowStock ? 'error' : 'default'}
                />
              </Stack>
            }
          />
          <Typography variant="body2" fontWeight={600}>
            {item.precioVenta != null
              ? `${formatDecimalOrFallback(item.precioVenta, '-')}€`
              : '-'}
          </Typography>
        </ListItem>
      );
    }

    if (type === 'pedidos' && isPedido(item)) {
      return (
        <ListItem key={item.id} sx={{ px: 0 }}>
          <ListItemIcon>
            <ShoppingCartIcon />
          </ListItemIcon>
          <ListItemText
            primary={`${t('modal.summary.pedido')} #${formatPedidoListNumber(item)}`}
            secondaryTypographyProps={{ component: 'div' }}
            secondary={
              <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {new Date(item.fechaPedido).toLocaleDateString()}
                </Typography>
                <StatusChip status={item.estado} size="small" />
              </Stack>
            }
          />
          <Typography variant="body2" fontWeight={600}>
            {item.costeTotal}€
          </Typography>
        </ListItem>
      );
    }

    if (type === 'incidencias' && isIncidencia(item)) {
      const isExpanded = expandedIncidenciaId === item.id;
      const pedidoLabel = formatCompactId(item.pedidoId);
      const lineas = Array.isArray(item.lineas) ? item.lineas : [];

      return (
        <Paper
          key={item.id}
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Stack spacing={1.5}>
            <Stack
              direction="row"
              spacing={2}
              alignItems="flex-start"
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Pedido #{pedidoLabel}
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                  useFlexGap
                  sx={{ mt: 0.75 }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {new Date(item.createdAt).toLocaleDateString('es-ES')}
                  </Typography>
                  <Chip
                    size="small"
                    color={item.resuelta ? 'success' : 'warning'}
                    label={
                      item.resuelta
                        ? t('modal.summary.incidencias.resuelta')
                        : t('modal.summary.incidencias.pendiente')
                    }
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`${lineas.length} ${t('modal.summary.incidencias.lineas', { count: lineas.length })}`}
                  />
                </Stack>
              </Box>

              <Button
                size="small"
                variant="text"
                onClick={() => handleToggleIncidencia(item.id)}
                endIcon={
                  <ExpandMoreIcon
                    sx={{
                      transform: isExpanded ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                }
                sx={{ alignSelf: 'center' }}
              >
                {isExpanded
                  ? t('modal.summary.incidencias.ocultarResumen')
                  : t('modal.summary.incidencias.verResumen')}
              </Button>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {t('modal.summary.proveedor')}:{' '}
              {item.proveedorNombre || t('modal.summary.sinProveedor')}
            </Typography>

            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Stack spacing={1.5} sx={{ pt: 0.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('modal.summary.incidencias.observacionesRecepcion')}
                  </Typography>
                  <Typography variant="body2">
                    {item.observacionesRecepcion ||
                      t('modal.summary.incidencias.sinObservaciones')}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 1 }}
                  >
                    {t('modal.summary.incidencias.detalleIncidencia')}
                  </Typography>
                  <Stack spacing={1}>
                    {lineas.map((linea) => (
                      <Paper
                        key={linea.id}
                        variant="outlined"
                        sx={{ p: 1.5, borderRadius: 1.5 }}
                      >
                        <Stack spacing={0.75}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            spacing={1}
                          >
                            <Typography variant="body2" fontWeight={700}>
                              {linea.nombreProducto}
                            </Typography>
                            <Chip
                              size="small"
                              color="error"
                              label={
                                tipoDiferenciaLabel(t)[linea.tipoDiferencia]
                              }
                            />
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {t('modal.summary.incidencias.esperado')}:{' '}
                            {linea.cantidadEsperada} ·{' '}
                            {t('modal.summary.incidencias.recibido')}:{' '}
                            {linea.cantidadRecibida} ·{' '}
                            {t('modal.summary.incidencias.diferencia')}:{' '}
                            {linea.diferencia}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t('modal.summary.incidencias.reclamacion')}:{' '}
                            {estadoReclamacionLabel(t)[linea.estadoReclamacion]}
                          </Typography>
                          {linea.observaciones ? (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {t('modal.summary.incidencias.nota')}:{' '}
                              {linea.observaciones}
                            </Typography>
                          ) : null}
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Collapse>
          </Stack>
        </Paper>
      );
    }

    if (type === 'proveedores' && isProveedor(item)) {
      return (
        <ListItem key={item.id} sx={{ px: 0 }}>
          <ListItemIcon>
            <LocalShippingIcon />
          </ListItemIcon>
          <ListItemText
            primary={item.nombre}
            secondary={item.contacto || t('modal.summary.sinContacto')}
          />
          <Chip
            label={
              item.productos?.length
                ? `${item.productos.length} ${t('modal.summary.productosCount', { count: item.productos.length })}`
                : t('modal.summary.proveedor')
            }
            size="small"
          />
        </ListItem>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}
      >
        {getIcon()}
        <Typography variant="h6" component="span" fontWeight={700}>
          {title}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 2 }}>
        {loading ? (
          <Box py={8} display="flex" justifyContent="center">
            <Spinner />
          </Box>
        ) : error ? (
          <Box py={4} textAlign="center">
            <Typography color="error">{error}</Typography>
          </Box>
        ) : data.length === 0 ? (
          <Box py={4} textAlign="center">
            <Typography color="text.secondary">
              {t('modal.summary.empty')}
            </Typography>
          </Box>
        ) : (
          <>
            {pendingPedidoSummary && pendingPedidoSummary.length > 0 ? (
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
                sx={{ mb: 2 }}
              >
                {pendingPedidoSummary.map((entry) => (
                  <Chip
                    key={entry.estado}
                    size="small"
                    variant="outlined"
                    label={`${entry.total} ${entry.estado.replace('_', ' ')}`}
                  />
                ))}
              </Stack>
            ) : null}

            <List disablePadding>
              {data.slice(0, 10).map((item, index) => (
                <React.Fragment key={'id' in item ? item.id : index}>
                  {renderItem(item)}
                  {type !== 'incidencias' &&
                    index < Math.min(data.length, 10) - 1 && (
                      <Divider component="li" />
                    )}
                </React.Fragment>
              ))}
            </List>
          </>
        )}
      </DialogContent>
      {data.length > 0 && !loading && (
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSeeAll}
            sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
          >
            {getButtonLabel()}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default SummaryModal;
