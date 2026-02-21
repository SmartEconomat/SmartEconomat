import React, { ReactNode } from 'react';
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
} from '@mui/material';
import Spinner from './Spinner';

export interface Column<T> {
    id: keyof T | string;
    label: string;
    render?: (row: T) => ReactNode;
    align?: 'inherit' | 'left' | 'center' | 'right' | 'justify';
}

export interface DataTableProps<T> {
    /** Configuración de columnas de la tabla. */
    columns: Column<T>[];
    /** Array de datos a mostrar. */
    data: T[];
    /** Indica si los datos están cargando. */
    isLoading?: boolean;
    /**
     * Componente personalizado o string para mostrar cuando la tabla
     * no está cargando y no hay datos.
     */
    emptyStateMessage?: ReactNode;
    /** Configuración para paginación opcional. */
    pagination?: {
        currentPage: number;
        totalPages: number;
        onPageChange: (event: React.ChangeEvent<unknown>, page: number) => void;
    };
    /** Callback para renderizar botones de acciones al final de la fila. */
    renderActions?: (row: T) => ReactNode;
    /** String que se usará para generar la columna extra de acciones si se provee \`renderActions\`. Por defecto: "Acciones" */
    actionsLabel?: string;
    /** Alineación de la columna de acciones. */
    actionsAlign?: 'inherit' | 'left' | 'center' | 'right' | 'justify';
}

/**
 * Componente genérico DataTable para mostrar listas tabulares de datos
 * con soporte para estado de carga, estados vacíos, paginación y slots
 * para acciones.
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
}: DataTableProps<T>) {
    // Cantidad real de columnas renderizadas
    const colSpanCount = columns.length + (renderActions ? 1 : 0);

    return (
        <Box sx={{ width: '100%', mb: 2 }}>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="data table">
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => (
                                <TableCell
                                    key={String(column.id)}
                                    align={column.align || 'left'}
                                    sx={{ fontWeight: 'bold' }}
                                >
                                    {column.label}
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
                                        <Typography color="text.secondary">
                                            {emptyStateMessage}
                                        </Typography>
                                    ) : (
                                        emptyStateMessage
                                    )}
                                </TableCell>
                            </TableRow>
                        )}

                        {/* RENDERIZADO DE DATOS */}
                        {!isLoading &&
                            data.length > 0 &&
                            data.map((row, rowIndex) => (
                                <TableRow
                                    key={`row-${rowIndex}`}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                    {columns.map((column) => (
                                        <TableCell
                                            key={String(column.id)}
                                            align={column.align || 'left'}
                                        >
                                            {column.render
                                                ? column.render(row)
                                                : (row[column.id as keyof T] as ReactNode)}
                                        </TableCell>
                                    ))}

                                    {/* RENDERIZADO DEL SLOT DE ACCIONES */}
                                    {renderActions && (
                                        <TableCell align={actionsAlign}>
                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                justifyContent={
                                                    actionsAlign === 'right'
                                                        ? 'flex-end'
                                                        : actionsAlign === 'center'
                                                            ? 'center'
                                                            : 'flex-start'
                                                }
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

            {/* RENDERIZADO DE PAGINACIÓN */}
            {
                pagination && pagination.totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Pagination
                            count={pagination.totalPages}
                            page={pagination.currentPage}
                            onChange={pagination.onPageChange}
                            color="primary"
                        />
                    </Box>
                )
            }
        </Box >
    );
}

export default DataTable;
