import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Alert,
  Button,
  useTheme,
  alpha,
  Tooltip,
  IconButton,
  Stack,
} from '@mui/material';
import DataTable, { Column } from '../components/ui/DataTable';
import PageToolbar from '../components/ui/PageToolbar';
import { useTranslation } from 'react-i18next';
import MovimientoFilters, {
  MovimientoFiltersState,
} from '../features/movimientos/MovimientoFilters';
import {
  getMovimientoUsuarioDisplayName,
  getMovimientoUsuarioInitial,
} from '../features/movimientos/movimiento-formatters';
import { Movimiento, TipoMovimiento } from '../services/movimiento.types';
import { fetchMovimientos } from '../services/movimiento.service';
import StatusChip from '../components/ui/StatusChip';
import DetailModal from '../components/ui/DetailModal';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import HistoryIcon from '@mui/icons-material/History';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ConstructionIcon from '@mui/icons-material/Construction';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { usePermission } from '../store/auth.hooks'; // Original import path
import { PERMISSIONS } from '../sherlock-auth/permissions.constants';
import { useLocation, useNavigate } from 'react-router-dom';

type MovimientosLocationState = {
  prefillSearchTerm?: string;
  prefillTypes?: TipoMovimiento[];
};

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1).replace(/_/g, ' ');

const getMovimientoNombreProducto = (row: Movimiento) => {
  return (
    row.productoProveedor?.producto?.nombre ||
    row.inventario?.productoProveedor?.producto?.nombre ||
    '—'
  );
};

const Movimientos: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const canList = usePermission(PERMISSIONS.movimientos.listar);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (canList === false) {
      navigate('/');
    }
  }, [canList, navigate]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [data, setData] = useState<Movimiento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemToView, setItemToView] = useState<Movimiento | null>(null);
  const [filters, setFilters] = useState<MovimientoFiltersState>({
    types: [],
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    const routeState = location.state as MovimientosLocationState | null;
    if (!routeState) {
      return;
    }

    const prefillSearchTerm = routeState.prefillSearchTerm?.trim();
    if (prefillSearchTerm) {
      setSearchTerm(prefillSearchTerm);
    }

    if (
      Array.isArray(routeState.prefillTypes) &&
      routeState.prefillTypes.length
    ) {
      setFilters((current) => ({
        ...current,
        types: routeState.prefillTypes || current.types,
      }));
    }

    setPage(1);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dataLoad = await fetchMovimientos({
        page,
        limit: pageSize,
        searchTerm,
        type: filters.types.length > 0 ? filters.types : undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });

      setData(dataLoad.data);
      setTotalItems(dataLoad.total);
      setTotalPages(dataLoad.totalPages);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error desconocido al cargar movimientos.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchTerm, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getMovementIcon = (tipo: TipoMovimiento) => {
    switch (tipo) {
      case TipoMovimiento.ENTRADA:
      case TipoMovimiento.ENTRADA_COMPRA:
      case TipoMovimiento.ENTRADA_DISTRIBUCION:
        return <ArrowUpwardIcon sx={{ fontSize: 16 }} />;
      case TipoMovimiento.SALIDA:
      case TipoMovimiento.SALIDA_ELABORACION:
      case TipoMovimiento.SALIDA_DISTRIBUCION:
        return <ArrowDownwardIcon sx={{ fontSize: 16 }} />;
      case TipoMovimiento.AJUSTE:
        return <ConstructionIcon sx={{ fontSize: 16 }} />;
      case TipoMovimiento.PEDIDO:
        return <ShoppingBagIcon sx={{ fontSize: 16 }} />;
      default:
        return <SyncAltIcon sx={{ fontSize: 16 }} />;
    }
  };

  const columns: Column<Movimiento>[] = useMemo(
    () => [
      {
        id: 'createdAt',
        label: t('movimientos.columns.fecha'),
        render: (row: Movimiento) => (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {new Date(row.createdAt).toLocaleDateString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(row.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>
          </Box>
        ),
        responsiveDisplay: { xs: 'table-cell', sm: 'table-cell' },
      },
      {
        id: 'tipo',
        label: t('movimientos.columns.tipo'),
        render: (row: Movimiento) => (
          <Tooltip title={capitalize(row.tipo)}>
            <StatusChip
              status={row.tipo}
              icon={getMovementIcon(row.tipo)}
              variant="outlined"
              sx={{
                fontWeight: 500,
                px: 1,
                minWidth: 100,
                '& .MuiChip-label': { px: 1 },
                '& .MuiChip-icon': { ml: 0, color: 'inherit' },
              }}
            />
          </Tooltip>
        ),
      },
      {
        id: 'cantidad',
        label: t('movimientos.columns.cantidad'),
        render: (row: Movimiento) => {
          const isNegative =
            row.tipo === TipoMovimiento.SALIDA ||
            row.tipo === TipoMovimiento.SALIDA_ELABORACION ||
            row.tipo === TipoMovimiento.SALIDA_DISTRIBUCION;
          return (
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: isNegative ? 'error.main' : 'success.main',
              }}
            >
              {isNegative ? '-' : '+'}
              {row.cantidad}
            </Typography>
          );
        },
        align: 'right',
      },
      {
        id: 'producto',
        label: t('movimientos.columns.descripcion'),
        render: (row: Movimiento) => (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {getMovimientoNombreProducto(row)}
            </Typography>
            {row.descripcion && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {row.descripcion}
              </Typography>
            )}
          </Box>
        ),
        responsiveDisplay: { xs: 'none', md: 'table-cell' },
      },
      {
        id: 'usuario',
        label: t('movimientos.columns.usuario'),
        render: (row: Movimiento) => {
          const displayName = getMovimientoUsuarioDisplayName(row.usuario);

          return (
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                }}
              >
                {getMovimientoUsuarioInitial(row.usuario)}
              </Box>
              <Typography variant="body2">{displayName}</Typography>
            </Box>
          );
        },
        responsiveDisplay: { xs: 'none', sm: 'table-cell' },
      },
    ],
    [theme, t]
  );

  const handleViewClick = (row: Movimiento) => {
    setItemToView(row);
  };

  const renderActions = (row: Movimiento) => (
    <Stack direction="row" spacing={0.5} justifyContent="center">
      <Tooltip title="Ver detalle">
        <IconButton
          onClick={() => handleViewClick(row)}
          size="small"
          aria-label="Ver detalle"
          id="btn-ver-detalle-movimiento"
          sx={{ color: 'text.secondary' }}
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );

  const detailSections = useMemo(() => {
    if (!itemToView) return [];

    return [
      {
        title: 'Información General',
        fields: [
          { label: 'Tipo', value: capitalize(itemToView.tipo) },
          {
            label: 'Cantidad',
            value:
              itemToView.cantidad > 0
                ? `+${itemToView.cantidad}`
                : itemToView.cantidad.toString(),
          },
          {
            label: 'Fecha',
            value: new Date(itemToView.createdAt).toLocaleString(),
          },
        ],
      },
      {
        title: 'Contexto',
        fields: [
          {
            label: 'Producto / Descripción',
            value:
              getMovimientoNombreProducto(itemToView) ||
              itemToView.descripcion ||
              '—',
            fullWidth: true,
          },
          {
            label: 'Usuario',
            value: getMovimientoUsuarioDisplayName(itemToView.usuario),
          },
        ],
      },
      {
        title: 'Seguimiento',
        fields: [
          { label: 'Lote', value: itemToView.inventario?.lote || '—' },
          { label: 'Origen (Entidad)', value: itemToView.entidad || '—' },
          {
            label: 'ID Entidad',
            value: itemToView.entidadId || '—',
            fullWidth: true,
          },
        ],
      },
    ];
  }, [itemToView, t]);

  // 't' no es necesario como dependencia si no cambia en runtime
  const detailActions = useMemo(() => {
    if (!itemToView?.entidadId) {
      return null;
    }
    if (String(itemToView.entidad || '').toLowerCase() === 'distribucion') {
      return (
        <Button
          variant="outlined"
          onClick={() => {
            navigate('/distribucion', {
              state: {
                prefillSearchTerm: itemToView.entidadId,
                openDetailDistribucionId: itemToView.entidadId,
              },
            });
            setItemToView(null);
          }}
        >
          {t('movimientos.detail.actions.viewDistribucion')}
        </Button>
      );
    }

    return null;
  }, [itemToView, navigate, t]);

  return (
    <Box>
      <PageToolbar
        id="movimientos-toolbar"
        title={t('movimientos.title')}
        totalItems={totalItems}
        totalItemsLabel={t('movimientos.totalLabel')}
        searchValue={searchTerm}
        searchPlaceholder={t('movimientos.searchPlaceholder')}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setPage(1);
        }}
        filters={
          <Box id="movimientos-filters">
            <MovimientoFilters
              filters={filters}
              onChange={(newFilters) => {
                setFilters(newFilters);
                setPage(1);
              }}
            />
          </Box>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <DataTable
        id="movimientos-table"
        columns={columns}
        data={data}
        isLoading={isLoading}
        renderActions={renderActions}
        emptyStateMessage={
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <HistoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('movimientos.empty.title')}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 400, mx: 'auto' }}
            >
              {searchTerm ||
              filters.types.length > 0 ||
              filters.startDate ||
              filters.endDate
                ? t('movimientos.empty.noResults')
                : t('movimientos.empty.noData')}
            </Typography>
          </Box>
        }
        pagination={{
          currentPage: page,
          totalPages: totalPages,
          onPageChange: (_, newPage) => setPage(newPage),
          pageSize: pageSize,
          onPageSizeChange: (e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          },
        }}
      />
      <DetailModal
        isOpen={!!itemToView}
        onClose={() => setItemToView(null)}
        title={t('movimientos.detail.title')}
        subtitle={`${t('movimientos.detail.id')}: ${itemToView?.id || ''}`}
        size="md"
        sections={detailSections}
        actions={detailActions}
      />
    </Box>
  );
};

export default Movimientos;
