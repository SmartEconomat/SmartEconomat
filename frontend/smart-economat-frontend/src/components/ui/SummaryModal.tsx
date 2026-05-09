import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Incidencia } from '../../services/incidencia.types';
import { fetchAlertasStock } from '../../services/inventario.service';
import type { AlertaStock } from '../../services/inventario.types';
import { formatPedidoListNumber } from '../../features/pedidos/utils/pedidoFormatters';
import { useTranslation } from 'react-i18next';
import { getEnumLabel } from '../../i18n/enumPresentation';
import { formatLocalizedDate, getResolvedLocale } from '../../utils/intlFormat';

/** Alias público (SummaryModalType) para simplificar payloads o props en smart-economat-frontend (SPA). */
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
const SUMMARY_MAX_FETCH_PAGES = 5;
const DASHBOARD_PENDING_ORDER_STATES = [
  EstadoPedido.PENDIENTE_DE_APROBACION,
  EstadoPedido.POR_RECEPCIONAR,
  EstadoPedido.PARCIAL,
  EstadoPedido.INCIDENCIA,
] as const;

function normalizeNumericValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return null;
}

function formatDecimalOrFallback(value: unknown, fallback = 'N/D'): string {
  const normalized = normalizeNumericValue(value);
  if (normalized == null) return fallback;
  return new Intl.NumberFormat(getResolvedLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(normalized);
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
      const cappedTotalPages = Math.min(
        firstPage.totalPages,
        SUMMARY_MAX_FETCH_PAGES
      );

      if (firstPage.totalPages > SUMMARY_MAX_FETCH_PAGES) {
        console.warn(
          `SummaryModal: pedidos limitado a ${SUMMARY_MAX_FETCH_PAGES} páginas para evitar sobrecarga.`
        );
      }

      if (cappedTotalPages <= 1) {
        return allPedidos;
      }

      const remainingPages = await Promise.all(
        Array.from({ length: cappedTotalPages - 1 }, (_, index) =>
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
    const cappedTotalPages = Math.min(
      firstPage.totalPages,
      SUMMARY_MAX_FETCH_PAGES
    );

    if (firstPage.totalPages > SUMMARY_MAX_FETCH_PAGES) {
      console.warn(
        `SummaryModal: incidencias limitado a ${SUMMARY_MAX_FETCH_PAGES} páginas para evitar sobrecarga.`
      );
    }

    if (cappedTotalPages <= 1) {
      return incidencias.sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime()
      );
    }

    const remainingPages = await Promise.all(
      Array.from({ length: cappedTotalPages - 1 }, (_, index) =>
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
        const res = await fetchProductos(1, 50, '', [], 'createdAt', 'desc');
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
      setError(t('resumen.errorCarga'));
    } finally {
      setLoading(false);
    }
  }, [fetchAllIncidencias, fetchDashboardPendingPedidos, t, type]);

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
      return t('resumen.verTodosFallback', { title: title.toLowerCase() });

    const labels: Record<SummaryModalType, string> = {
      productos: t('resumen.verTodos.productos'),
      pedidos: t('resumen.verTodos.pedidos'),
      incidencias: t('resumen.verTodos.incidencias'),
      stock: t('resumen.verTodos.stock'),
      proveedores: t('resumen.verTodos.proveedores'),
    };

    return (
      labels[type] ||
      t('resumen.verTodosFallback', { title: title.toLowerCase() })
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
      const stockLabel = `${formatDecimalOrFallback(item.cantidadActual)} / ${formatDecimalOrFallback(item.cantidadMinima)} ${item.unidad || 'und'}`;

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
          ? `${formatDecimalOrFallback(stockActual)} ${item.unidad || 'und'}`
          : 'N/D';
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
                  {item.categoria?.nombre ||
                    t('dashboard.summary.sinCategoria')}
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
            primary={`Pedido #${formatPedidoListNumber(item)}`}
            secondaryTypographyProps={{ component: 'div' }}
            secondary={
              <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {formatLocalizedDate(item.fechaPedido)}
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
                    {formatLocalizedDate(item.createdAt)}
                  </Typography>
                  <Chip
                    size="small"
                    color={item.resuelta ? 'success' : 'warning'}
                    label={
                      item.resuelta
                        ? t('resumen.incidencias.resuelta')
                        : t('resumen.incidencias.pendiente')
                    }
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={t('resumen.incidencias.lineas', {
                      count: lineas.length,
                    })}
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
                  ? t('resumen.incidencias.ocultarResumen')
                  : t('resumen.incidencias.verResumen')}
              </Button>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {t('resumen.incidencias.proveedor')}:{' '}
              {item.proveedorNombre || t('resumen.incidencias.sinProveedor')}
            </Typography>

            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Stack spacing={1.5} sx={{ pt: 0.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('resumen.incidencias.observacionesRecepcion')}
                  </Typography>
                  <Typography variant="body2">
                    {item.observacionesRecepcion ||
                      t('resumen.incidencias.sinObservaciones')}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 1 }}
                  >
                    {t('resumen.incidencias.detalle')}
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
                              label={getEnumLabel(
                                t,
                                'tipoDiferencia',
                                linea.tipoDiferencia
                              )}
                            />
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {t('resumen.incidencias.lineaResumen', {
                              esperado: linea.cantidadPedida,
                              recibido: linea.cantidadRecibida,
                              diferencia: linea.diferencia,
                            })}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t('resumen.incidencias.reclamacion')}:{' '}
                            {getEnumLabel(
                              t,
                              'estadoReclamacion',
                              linea.estadoReclamacion
                            )}
                          </Typography>
                          {linea.observaciones ? (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {t('resumen.incidencias.nota')}:{' '}
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
            secondary={item.contacto || t('resumen.proveedores.sinContacto')}
          />
          <Chip
            label={
              item.productos?.length
                ? t('resumen.proveedores.productosCount', {
                    count: item.productos.length,
                  })
                : t('resumen.proveedores.proveedor')
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
              {t('resumen.sinElementos')}
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
                    label={`${entry.total} ${getEnumLabel(t, 'pedidoEstado', entry.estado)}`}
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
