import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Alert, useTheme, alpha, Tooltip, IconButton } from '@mui/material';
import DataTable, { Column } from '../components/ui/DataTable';
import PageToolbar from '../components/ui/PageToolbar';
import MovimientoFilters, { MovimientoFiltersState } from '../features/movimientos/MovimientoFilters';
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
import { generateFriendlyId } from '../utils/friendlyId';

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1).replace(/_/g, ' ');

const Movimientos: React.FC = () => {
    const theme = useTheme();
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
        endDate: null
    });

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
                endDate: filters.endDate || undefined
            });

            setData(dataLoad.data);
            setTotalItems(dataLoad.total);
            setTotalPages(dataLoad.totalPages);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error desconocido al cargar movimientos.';
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
                return <ArrowUpwardIcon sx={{ fontSize: 16 }} />;
            case TipoMovimiento.SALIDA:
            case TipoMovimiento.SALIDA_ELABORACION:
                return <ArrowDownwardIcon sx={{ fontSize: 16 }} />;
            case TipoMovimiento.AJUSTE:
                return <ConstructionIcon sx={{ fontSize: 16 }} />;
            case TipoMovimiento.PEDIDO:
                return <ShoppingBagIcon sx={{ fontSize: 16 }} />;
            default:
                return <SyncAltIcon sx={{ fontSize: 16 }} />;
        }
    };

    const columns: Column<Movimiento>[] = useMemo(() => [
        {
            id: 'createdAt',
            label: 'Fecha',
            render: (row: Movimiento) => (
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {new Date(row.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                </Box>
            ),
            responsiveDisplay: { xs: 'table-cell', sm: 'table-cell' }
        },
        {
            id: 'tipo',
            label: 'Tipo',
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
                            '& .MuiChip-icon': { ml: 0, color: 'inherit' }
                        }}
                    />
                </Tooltip>
            ),
        },
        {
            id: 'cantidad',
            label: 'Cant.',
            render: (row: Movimiento) => {
                const isNegative = row.tipo === TipoMovimiento.SALIDA || row.tipo === TipoMovimiento.SALIDA_ELABORACION;
                return (
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 700,
                            color: isNegative ? 'error.main' : 'success.main'
                        }}
                    >
                        {isNegative ? '-' : '+'}{row.cantidad}
                    </Typography>
                );
            },
            align: 'right',
        },
        {
            id: 'producto',
            label: 'Descripción',
            render: (row: Movimiento) => (
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {row.productoProveedor?.producto?.nombre || row.inventario?.ipp?.ip?.nombre || '—'}
                    </Typography>
                    {row.descripcion && (
                        <Typography variant="caption" color="text.secondary" sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}>
                            {row.descripcion}
                        </Typography>
                    )}
                </Box>
            ),
            responsiveDisplay: { xs: 'none', md: 'table-cell' }
        },
        {
            id: 'usuario',
            label: 'Usuario',
            render: (row: Movimiento) => (
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
                            fontWeight: 700
                        }}
                    >
                        {row.usuario?.nombre?.charAt(0) || 'U'}
                    </Box>
                    <Typography variant="body2">
                        {row.usuario?.nombre || '—'}
                    </Typography>
                </Box>
            ),
            responsiveDisplay: { xs: 'none', sm: 'table-cell' }
        }
    ], [theme]);

    const handleViewClick = (row: Movimiento) => {
        setItemToView(row);
    };

    const renderActions = (row: Movimiento) => (
        <Tooltip title="Ver detalle">
            <IconButton onClick={() => handleViewClick(row)} size="small" aria-label="Ver detalle" sx={{ color: 'text.secondary' }}>
                <VisibilityIcon fontSize="small" />
            </IconButton>
        </Tooltip>
    );

    const detailSections = useMemo(() => {
        if (!itemToView) return [];

        return [
            {
                title: 'Información General',
                fields: [
                    { label: 'Tipo', value: capitalize(itemToView.tipo) },
                    { label: 'Cantidad', value: itemToView.cantidad > 0 ? `+${itemToView.cantidad}` : itemToView.cantidad.toString() },
                    { label: 'Fecha', value: new Date(itemToView.createdAt).toLocaleString() },
                ]
            },
            {
                title: 'Contexto',
                fields: [
                    { label: 'Producto / Descripción', value: itemToView.productoProveedor?.producto?.nombre || itemToView.inventario?.ipp?.ip?.nombre || itemToView.descripcion || '—', fullWidth: true },
                    { label: 'Usuario', value: itemToView.usuario?.nombre || '—' },
                ]
            },
            {
                title: 'Seguimiento',
                fields: [
                    { label: 'Lote', value: itemToView.inventario?.lote || '—' },
                    { label: 'Origen (Entidad)', value: itemToView.entidad || '—' },
                    { label: 'ID Entidad', value: itemToView.entidadId || '—', fullWidth: true },
                ]
            }
        ];
    }, [itemToView]);

    return (
        <Box>
            <PageToolbar
                title="Historial de Movimientos"
                totalItems={totalItems}
                totalItemsLabel="movimientos"
                searchValue={searchTerm}
                onSearchChange={(val) => {
                    setSearchTerm(val);
                    setPage(1);
                }}
                filters={
                    <MovimientoFilters
                        filters={filters}
                        onChange={(newFilters) => {
                            setFilters(newFilters);
                            setPage(1);
                        }}
                    />
                }
                pageSize={pageSize}
                onPageSizeChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                }}
            />

            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            <DataTable
                columns={columns}
                data={data}
                isLoading={isLoading}
                renderActions={renderActions}
                hideTopBar
                emptyStateMessage={
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                        <HistoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No hay movimientos
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                            {searchTerm || filters.types.length > 0 || filters.startDate || filters.endDate
                                ? 'No se encontraron movimientos que coincidan con los filtros seleccionados.'
                                : 'Aún no se han registrado alteraciones de inventario en el sistema.'}
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
                title="Detalle del Movimiento"
                subtitle={`ID: ${itemToView ? generateFriendlyId('movimiento', itemToView.id) : ''}`}
                size="md"
                sections={detailSections}
            />
        </Box>
    );
};

export default Movimientos;