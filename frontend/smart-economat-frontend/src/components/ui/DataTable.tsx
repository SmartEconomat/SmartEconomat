import React, { ReactNode, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Box,
    Pagination,
    Stack,
    Select,
    MenuItem,
    FormControl,
    ToggleButtonGroup,
    ToggleButton,
    SelectChangeEvent,
    Grid,
    TableSortLabel,
    IconButton
} from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Spinner from './Spinner';

export interface Column<T> {
    id: keyof T | string;
    label: string;
    render?: (row: T) => ReactNode;
    align?: 'inherit' | 'left' | 'center' | 'right' | 'justify';
    hideOnMobile?: boolean;
    sortable?: boolean;
}

export interface DataTableProps<T> {
    /** Configuración de columnas de la tabla. */
    columns: Column<T>[];
    /** Array de datos a mostrar. */
    data: T[];
    /** Indica si los datos están cargando. */
    isLoading?: boolean;
    /** Componente personalizado o string para mostrar cuando no hay datos. */
    emptyStateMessage?: ReactNode;
    /** Configuración para paginación opcional. */
    pagination?: {
        currentPage: number;
        totalPages: number;
        onPageChange: (event: React.ChangeEvent<unknown>, page: number) => void;
        pageSize?: number;
        onPageSizeChange?: (event: SelectChangeEvent<number>) => void;
        pageSizeOptions?: number[];
    };
    /** Callback para renderizar botones de acciones al final de la fila. */
    renderActions?: (row: T) => ReactNode;
    /** String que se usará para generar la columna extra de acciones. */
    actionsLabel?: string;
    /** Alineación de la columna de acciones. */
    actionsAlign?: 'inherit' | 'left' | 'center' | 'right' | 'justify';
    /** Función para renderizar un item en vista de cuadrícula (mosaico) */
    renderGridItem?: (row: T) => ReactNode;
    /** Modo de vista por defecto (list o grid). Si renderGridItem existe, se puede cambiar */
    defaultViewMode?: 'list' | 'grid';
    /** Configuración actual de ordenamiento */
    sortConfig?: {
        key: keyof T | string;
        direction: 'asc' | 'desc';
    };
    /** Función disparada al clickear la cabecera de una columna ordenable */
    onSort?: (key: keyof T | string) => void;
}

/**
 * Componente genérico para mostrar listas tabulares de datos
 * con soporte para estado de carga, paginación, acciones y vista en mosaico.
 */
export function DataTable<T extends Record<string, any>>({
    columns,
    data,
    isLoading = false,
    emptyStateMessage = 'No hay datos disponibles.',
    pagination,
    renderActions,
    actionsLabel = 'Acciones',
    actionsAlign = 'center',
    renderGridItem,
    defaultViewMode = 'list',
    sortConfig,
    onSort,
}: DataTableProps<T>) {
    const colSpanCount = columns.length + (renderActions ? 1 : 0);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(defaultViewMode);

    const hasTopBarControls = (pagination?.onPageSizeChange && pagination?.pageSizeOptions) || renderGridItem;

    const handleViewModeChange = (
        event: React.MouseEvent<HTMLElement>,
        newMode: 'list' | 'grid',
    ) => {
        if (newMode !== null) {
            setViewMode(newMode);
        }
    };

    return (
        <Box sx={{ width: '100%', mb: 2 }}>
            <Paper elevation={0} sx={{ p: 2, mb: 0 }}>
                {hasTopBarControls && (
                    <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
                        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                            {renderGridItem && (
                                <ToggleButtonGroup
                                    value={viewMode}
                                    exclusive
                                    onChange={handleViewModeChange}
                                    aria-label="modo de vista"
                                    size="small"
                                >
                                    <ToggleButton value="list" aria-label="vista de lista">
                                        <ViewListIcon />
                                    </ToggleButton>
                                    <ToggleButton value="grid" aria-label="vista de mosaico">
                                        <ViewModuleIcon />
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            )}

                            {viewMode === 'grid' && onSort && columns.some(c => c.sortable) && (
                                <Box display="flex" alignItems="center" gap={1}>
                                    <FormControl size="small" variant="outlined">
                                        <Select
                                            value={sortConfig?.key || ""}
                                            onChange={(e) => {
                                                if (e.target.value !== sortConfig?.key) onSort(e.target.value as string);
                                            }}
                                            displayEmpty
                                            sx={{ minWidth: 140 }}
                                        >
                                            <MenuItem value="" disabled>Ordenar por...</MenuItem>
                                            {columns.filter(c => c.sortable).map(c => (
                                                <MenuItem key={String(c.id)} value={String(c.id)}>{c.label}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            if (sortConfig?.key) onSort(sortConfig.key);
                                        }}
                                        disabled={!sortConfig?.key}
                                        title={sortConfig?.direction === 'desc' ? 'Descendente (Z-A)' : 'Ascendente (A-Z)'}
                                        color="primary"
                                        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                                    >
                                        {sortConfig?.direction === 'desc' ? <ArrowDownwardIcon fontSize="small" /> : <ArrowUpwardIcon fontSize="small" />}
                                    </IconButton>
                                </Box>
                            )}
                        </Box>
                        {pagination?.onPageSizeChange && pagination?.pageSizeOptions && (
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2" color="text.secondary">Mostrar:</Typography>
                                <FormControl size="small" variant="outlined">
                                    <Select
                                        value={pagination.pageSize || 10}
                                        onChange={pagination.onPageSizeChange}
                                    >
                                        {pagination.pageSizeOptions.map(option => (
                                            <MenuItem key={option} value={option}>{option}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        )}
                    </Box>
                )}
            </Paper>

            {viewMode === 'list' || !renderGridItem ? (
                <TableContainer component={Paper} elevation={0} sx={{ mt: hasTopBarControls ? -2 : 0 }}>
                    <Table sx={{ minWidth: { xs: '100%', md: 650 } }} aria-label="data table">
                        <TableHead>
                            <TableRow>
                                {columns.map((column) => (
                                    <TableCell
                                        key={String(column.id)}
                                        align={column.align || 'left'}
                                        sx={{
                                            fontWeight: 'bold',
                                            display: column.hideOnMobile ? { xs: 'none', md: 'table-cell' } : undefined
                                        }}
                                        sortDirection={sortConfig?.key === column.id ? sortConfig.direction : false}
                                    >
                                        {column.sortable ? (
                                            <TableSortLabel
                                                active={sortConfig?.key === column.id}
                                                direction={sortConfig?.key === column.id ? sortConfig.direction : 'asc'}
                                                onClick={() => onSort && onSort(column.id)}
                                            >
                                                {column.label}
                                            </TableSortLabel>
                                        ) : (
                                            column.label
                                        )}
                                    </TableCell>
                                ))}
                                {renderActions && (
                                    <TableCell align={actionsAlign} sx={{ fontWeight: 'bold' }}>
                                        {actionsLabel}
                                    </TableCell>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {/* ESTADO CARGANDO */}
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={colSpanCount} align="center" sx={{ py: 6 }}>
                                        <Spinner size="md" color="primary" />
                                        <Typography sx={{ mt: 2 }} color="text.secondary">Cargando datos...</Typography>
                                    </TableCell>
                                </TableRow>
                            )}

                            {/* ESTADO VACÍO (Si no carga y no hay datos) */}
                            {!isLoading && data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={colSpanCount} align="center" sx={{ py: 6 }}>
                                        {typeof emptyStateMessage === 'string' ? (
                                            <Typography color="text.secondary">{emptyStateMessage}</Typography>
                                        ) : (
                                            emptyStateMessage
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}

                            {!isLoading && data.length > 0 && data.map((row, rowIndex) => (
                                <TableRow key={`row-${rowIndex}`} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    {columns.map((column) => (
                                        <TableCell
                                            key={String(column.id)}
                                            align={column.align || 'left'}
                                            sx={{ display: column.hideOnMobile ? { xs: 'none', md: 'table-cell' } : undefined }}
                                        >
                                            {column.render ? column.render(row) : (row[column.id as keyof T] as ReactNode)}
                                        </TableCell>
                                    ))}
                                    {renderActions && (
                                        <TableCell align={actionsAlign}>
                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                justifyContent={actionsAlign === 'right' ? 'flex-end' : actionsAlign === 'center' ? 'center' : 'flex-start'}
                                            >
                                                {renderActions(row)}
                                            </Stack>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Grid container spacing={3}>
                    {isLoading && (
                        <Grid size={{ xs: 12 }}>
                            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={6}>
                                <Spinner size="md" color="primary" />
                                <Typography sx={{ mt: 2 }} color="text.secondary">Cargando datos...</Typography>
                            </Box>
                        </Grid>
                    )}
                    {!isLoading && data.length === 0 && (
                        <Grid size={{ xs: 12 }}>
                            <Box display="flex" justifyContent="center" py={6}>
                                {typeof emptyStateMessage === 'string' ? (
                                    <Typography color="text.secondary">{emptyStateMessage}</Typography>
                                ) : (
                                    emptyStateMessage
                                )}
                            </Box>
                        </Grid>
                    )}
                    {!isLoading && data.length > 0 && data.map((row, index) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={`grid-item-${index}`}>
                            {renderGridItem(row)}
                        </Grid>
                    ))}
                </Grid>
            )}

            {pagination && pagination.totalPages > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                        count={pagination.totalPages}
                        page={pagination.currentPage}
                        onChange={pagination.onPageChange}
                        color="primary"
                    />
                </Box>
            )}
        </Box>
    );
}

export default DataTable;
