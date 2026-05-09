import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Alert,
  Button,
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';
import DataTable, { Column } from '../components/ui/DataTable';
import PageToolbar from '../components/ui/PageToolbar';
import MovimientoFilters from '../features/movimientos/MovimientoFilters';
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
import { usePermission } from '../store/auth.hooks'; // Original import path
import { PERMISSIONS } from '../sherlock-auth/permissions.constants';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getEnumLabel } from '../i18n/enumPresentation';
import {
  formatLocalizedDate,
  formatLocalizedDateTime,
  formatLocalizedTime,
} from '../utils/intlFormat';
import { useDataTable } from '../hooks/useDataTable';

type MovimientosLocationState = {
  prefillSearchTerm?: string;
  prefillTypes?: TipoMovimiento[];
};

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
  const [data, setData] = useState<Movimiento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemToView, setItemToView] = useState<Movimiento | null>(null);

  const {
    searchTerm,
    filters: tableFilters,
    onPageChange,
    onSort,
    onFilter,
    onSearchChange,
    queryParams,
    sortConfig,
    paginationProps,
    totalItems,
    syncPaginationFromResponse,
  } = useDataTable({
    sortBy: 'createdAt',
    order: 'desc',
    filters: {
      types: [],
      startDate: null,
      endDate: null,
    },
  });

  useEffect(() => {
    const routeState = location.state as MovimientosLocationState | null;
    if (!routeState) {
      return;
    }

    const prefillSearchTerm = routeState.prefillSearchTerm?.trim();
    if (prefillSearchTerm) {
      onSearchChange(prefillSearchTerm);
    }

    if (
      Array.isArray(routeState.prefillTypes) &&
      routeState.prefillTypes.length
    ) {
      onFilter('types', routeState.prefillTypes);
    }

    onPageChange(null, 1);
    navigate(location.pathname, { replace: true, state: null });
  }, [
    location.pathname,
    location.state,
    navigate,
    onFilter,
    onPageChange,
    onSearchChange,
  ]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dataLoad = await fetchMovimientos({
        page: queryParams.page,
        limit: queryParams.limit,
        searchTerm: queryParams.searchTerm,
        type:
          (tableFilters.types as TipoMovimiento[])?.length > 0
            ? (tableFilters.types as TipoMovimiento[])
            : undefined,
        startDate: (tableFilters.startDate as string) || undefined,
        endDate: (tableFilters.endDate as string) || undefined,
        sortBy: queryParams.sortBy as string,
        sortOrder: queryParams.order.toUpperCase() as 'ASC' | 'DESC',
      });

      setData(dataLoad.data);
      syncPaginationFromResponse(dataLoad);
    } catch (err: unknown) {
      syncPaginationFromResponse({ total: 0, data: [] });
      const message =
        err instanceof Error ? err.message : t('movimientos.error');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [queryParams, tableFilters, syncPaginationFromResponse, t]);

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
              {formatLocalizedDate(row.createdAt)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatLocalizedTime(row.createdAt)}
            </Typography>
          </Box>
        ),
        sortable: true,
        sortType: 'date',
        responsiveDisplay: { xs: 'table-cell', sm: 'table-cell' },
      },
      {
        id: 'tipo',
        label: t('movimientos.columns.tipo'),
        render: (row: Movimiento) => (
          <Tooltip title={getEnumLabel(t, 'movimientoTipo', row.tipo)}>
            <StatusChip
              status={row.tipo}
              label={getEnumLabel(t, 'movimientoTipo', row.tipo)}
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
        sortable: true,
        sortType: 'string',
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

  const detailSections = useMemo(() => {
    if (!itemToView) return [];

    return [
      {
        title: t('movimientos.detalle.general'),
        fields: [
          {
            label: t('movimientos.columns.tipo'),
            value: getEnumLabel(t, 'movimientoTipo', itemToView.tipo),
          },
          {
            label: t('movimientos.columns.cantidad'),
            value:
              itemToView.cantidad > 0
                ? `+${itemToView.cantidad}`
                : itemToView.cantidad.toString(),
          },
          {
            label: t('movimientos.columns.fecha'),
            value: formatLocalizedDateTime(itemToView.createdAt),
          },
        ],
      },
      {
        title: t('movimientos.detalle.contexto'),
        fields: [
          {
            label: t('movimientos.detalle.productoDescripcion'),
            value:
              getMovimientoNombreProducto(itemToView) ||
              itemToView.descripcion ||
              '—',
            fullWidth: true,
          },
          {
            label: t('movimientos.columns.usuario'),
            value: getMovimientoUsuarioDisplayName(itemToView.usuario),
          },
        ],
      },
      {
        title: t('movimientos.detalle.seguimiento'),
        fields: [
          {
            label: t('movimientos.detalle.lote'),
            value: itemToView.inventario?.lote || '—',
          },
          {
            label: t('movimientos.detalle.origenEntidad'),
            value: itemToView.entidad || '—',
          },
          {
            label: t('movimientos.detalle.idEntidad'),
            value: itemToView.entidadId || '—',
            fullWidth: true,
          },
        ],
      },
    ];
  }, [itemToView, t]);

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
          {t('movimientos.verDistribucion')}
        </Button>
      );
    }

    return null;
  }, [itemToView, navigate, t]);

  return (
    <Box data-testid="movimientos-vista-principal">
      <PageToolbar
        id="movimientos-toolbar"
        title={t('movimientos.titulo')}
        totalItems={totalItems}
        totalItemsLabel={t('movimientos.totalItemsLabel')}
        searchValue={searchTerm}
        onSearchChange={onSearchChange}
        filters={
          <Box id="movimientos-filters">
            <MovimientoFilters
              filters={{
                types: (tableFilters.types as TipoMovimiento[]) || [],
                startDate: (tableFilters.startDate as string) || null,
                endDate: (tableFilters.endDate as string) || null,
              }}
              onChange={(newFilters) => {
                onFilter('types', newFilters.types);
                onFilter('startDate', newFilters.startDate);
                onFilter('endDate', newFilters.endDate);
              }}
            />
          </Box>
        }
      />

      {!isLoading && error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <DataTable
        id="movimientos-table"
        columns={columns}
        data={data}
        isLoading={isLoading}
        onRowClick={setItemToView}
        onSort={onSort}
        sortConfig={sortConfig}
        filters={tableFilters}
        onFilter={onFilter}
        pagination={paginationProps}
        getRowAriaLabel={(row: Movimiento) =>
          t('movimientos.actions.ariaVerDetalle', {
            producto: getMovimientoNombreProducto(row),
          })
        }
        emptyStateMessage={
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <HistoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('movimientos.empty.noMovimientos')}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 400, mx: 'auto' }}
            >
              {searchTerm ||
              ((tableFilters.types as TipoMovimiento[]) || []).length > 0 ||
              tableFilters.startDate ||
              tableFilters.endDate
                ? t('movimientos.empty.noResultados')
                : t('movimientos.empty.noRegistros')}
            </Typography>
          </Box>
        }
      />
      <DetailModal
        isOpen={!!itemToView}
        onClose={() => setItemToView(null)}
        title={t('movimientos.detalle.titulo')}
        subtitle={t('movimientos.detalle.id', { id: itemToView?.id || '' })}
        size="md"
        sections={detailSections}
        actions={detailActions}
      />
    </Box>
  );
};

export default Movimientos;
