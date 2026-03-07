/**
 * @fileoverview Componente genérico DataTable para la visualización de listas tabulares o mosaicos de datos.
 * Esta tabla es altamente personalizable, con soporte para paginación integrada, 
 * acciones por fila, cambio de vista dinámica (Grid/List) y ordenamiento de columnas.
 * Sirve como base para listados como Productos, Usuarios, o Proveedores en la aplicación.
 */

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
    IconButton,
    Skeleton,
} from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Spinner from './Spinner';

/**
 * Representa la configuración de una columna en la tabla.
 */
export interface Column<T> {
    /** Identificador único o key del objeto de la fila */
    id: keyof T | string;
    /** Etiqueta visual que va en el encabezado de la columna */
    label: string;
    /** Renderizado personalizado opcional para la celda. Si no se pasa, inyecta `row[id]` directamente */
    render?: (row: T) => ReactNode;
    /** Alineación del texto en la columna */
    align?: 'inherit' | 'left' | 'center' | 'right' | 'justify';
    /** Si es true, esta columna no se renderiza en pantallas pequeñas (xs) */
    hideOnMobile?: boolean;
    /** Control granular de visualización por breakpoint (MUI System object, ej: { xs: 'none', md: 'table-cell' }) */
    responsiveDisplay?: Record<string, string>;
    /** Si es true, la columna permite ordenar de manera ascendente/descendente */
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
    /** Modo de vista actual (controlado externamente) */
    viewMode?: 'list' | 'grid';
    /** Callback para cambiar modo de vista (controlado externamente) */
    onViewModeChange?: (mode: 'list' | 'grid') => void;
    /** Configuración actual de ordenamiento */
    sortConfig?: {
        key: keyof T | string;
        direction: 'asc' | 'desc';
    };
    /** Función disparada al clickear la cabecera de una columna ordenable */
    onSort?: (key: keyof T | string) => void;
    /** Componente opcional que se pintará a la izquierda en la cabecera (ej: botón Nuevo) */
    leftHeaderAction?: ReactNode;
    /** Componente opcional que se pintará a la derecha en la cabecera (ej: botón Nuevo) */
    rightHeaderAction?: ReactNode;
    /** Si es true, oculta la barra superior interna de la tabla (usado con PageToolbar externo) */
    hideTopBar?: boolean;
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
    leftHeaderAction,
    rightHeaderAction,
    hideTopBar = false,
    viewMode: controlledViewMode,
    onViewModeChange: onControlledViewModeChange,
}: DataTableProps<T>) {
    const colSpanCount = columns.length + (renderActions ? 1 : 0);
    const [internalViewMode, setInternalViewMode] = useState<'list' | 'grid'>(defaultViewMode);

    // Determinar qué modo usar (el prop controlado tiene prioridad)
    const viewMode = controlledViewMode || internalViewMode;

    const hasTopBarControls = !hideTopBar && ((pagination?.onPageSizeChange && pagination?.pageSizeOptions) || renderGridItem || leftHeaderAction || rightHeaderAction);
    const handleViewModeChange = (
        event: React.MouseEvent<HTMLElement>,
        newMode: 'list' | 'grid',
    ) => {
        if (newMode !== null) {
            if (onControlledViewModeChange) {
                onControlledViewModeChange(newMode);
            } else {
                setInternalViewMode(newMode);
            }
        }
    }

    return (
        <Box sx={{ width: '100%', mb: 2 }}>
            {hasTopBarControls && (
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    flexWrap="wrap"
                    gap={2}
                    mb={3}
                >
                    {/* SECCIÓN IZQUIERDA: Botones vista + Paginación */}
                    <Box display="flex" alignItems="center" gap={2}>
                        {/* 1. Botones de lista/grid */}
                        {renderGridItem && (
                            <ToggleButtonGroup
                                value={viewMode}
                                exclusive
                                onChange={handleViewModeChange}
                                size="small"
                            >
                                <ToggleButton value="list"><ViewListIcon /></ToggleButton>
                                <ToggleButton value="grid"><ViewModuleIcon /></ToggleButton>
                            </ToggleButtonGroup>
                        )}

                        {/* 2. Paginación (Selector de registros) */}
                        {pagination?.onPageSizeChange && pagination?.pageSizeOptions && (
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                    Ver
                                </Typography>
                                <FormControl size="small" variant="outlined">
                                    <Select
                                        value={pagination.pageSize || pagination.pageSizeOptions[0] || 10}
                                        onChange={pagination.onPageSizeChange}
                                        sx={{ minWidth: 64 }}
                                    >
                                        {pagination.pageSizeOptions.map(option => (
                                            <MenuItem key={option} value={option}>{option}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
                                    por página
                                </Typography>
                            </Box>
                        )}

                        {/* Espacio para leftHeaderAction si lo usaras */}
                        {leftHeaderAction && <Box>{leftHeaderAction}</Box>}
                    </Box>

                    {/* SECCIÓN DERECHA: Botón Nuevo */}
                    <Box display="flex" alignItems="center">
                        {rightHeaderAction && (
                            <Box display="flex" alignItems="center">
                                {rightHeaderAction}
                            </Box>
                        )}
                    </Box>
                </Box>
            )}


            {viewMode === 'list' || !renderGridItem ? (
                <TableContainer component={Paper} elevation={0}>
                    <Table sx={{ minWidth: { xs: '100%', md: 650 } }} aria-label="data table">
                        <TableHead>
                            <TableRow>
                                {columns.map((column) => (
                                    <TableCell
                                        key={String(column.id)}
                                        align={column.align || 'left'}
                                        sx={{
                                            fontWeight: 'bold',
                                            display: column.responsiveDisplay || (column.hideOnMobile ? { xs: 'none', md: 'table-cell' } : undefined)
                                        }}
                                        sortDirection={sortConfig?.key === column.id ? sortConfig.direction : false}
                                    >
                                        {column.sortable ? (
                                            <TableSortLabel
                                                active={sortConfig?.key === column.id}
                                                direction={sortConfig?.key === column.id ? sortConfig.direction : 'asc'}
                                                onClick={() => onSort && onSort(column.id)}
                                                sx={{
                                                    width: '100%',
                                                    justifyContent: 'space-between',
                                                    '& .MuiTableSortLabel-icon': {
                                                        ml: 0, // Remove default margin as we're using space-between
                                                    }
                                                }}
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
                                            sx={{ display: column.responsiveDisplay || (column.hideOnMobile ? { xs: 'none', md: 'table-cell' } : undefined) }}
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
                    {isLoading && viewMode === 'grid' && (
                        <>
                            {Array.from({ length: 8 }).map((_, i) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={`skeleton-${i}`}>
                                    <Paper variant="outlined" sx={{ p: 0, overflow: 'hidden' }}>
                                        <Skeleton variant="rectangular" height={140} animation="wave" />
                                        <Box sx={{ p: 2 }}>
                                            <Skeleton variant="text" width="80%" height={28} />
                                            <Skeleton variant="text" width="50%" height={20} sx={{ mt: 1 }} />
                                            <Skeleton variant="rounded" width={64} height={24} sx={{ mt: 1.5 }} />
                                            <Skeleton variant="text" width="40%" height={24} sx={{ mt: 1 }} />
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </>
                    )}
                    {isLoading && viewMode !== 'grid' && (
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
