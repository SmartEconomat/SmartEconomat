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
  TablePagination,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  SelectChangeEvent,
  Grid,
  TableSortLabel,
  Skeleton,
  Checkbox,
  SxProps,
  Theme,
  IconButton,
  alpha,
} from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { Tooltip } from './Tooltip';
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
  responsiveDisplay?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    [key: string]: string | undefined;
  };
  /** Si es true, la columna permite ordenar de manera ascendente/descendente */
  sortable?: boolean;
  /** Anchura sugerida de la columna */
  width?: number | string;
  /** Anchura mínima de la columna */
  minWidth?: number | string;
  /** Estilos extra para la cabecera */
  headerSx?: SxProps<Theme>;
  /** Estilos extra para las celdas */
  cellSx?: SxProps<Theme>;
}

export interface ExportHandlers {
  onExportPdf?: () => void;
  onExportExcel?: () => void;
  /** Label para el tooltip (ej: "productos filtrados") */
  exportLabel?: string;
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
    /** Total de items en todos los datos (para mostrar en TablePagination). Si no se provee, se estima. */
    totalItems?: number;
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
  /** Anchura sugerida de la columna de acciones. */
  actionsWidth?: number | string;
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
  /** Si es true, habilita la selección de filas con checkboxes */
  selectable?: boolean;
  /** Array de IDs seleccionados (referenciados por la propiedad definida en uniqueKey o 'id') */
  selectedIds?: string[];
  /** Callback disparado al cambiar la selección */
  onSelectionChange?: (ids: string[]) => void;
  /** Propiedad del dato que sirve como ID único. Por defecto 'id'. */
  uniqueKey?: keyof T | string;
  /** Handlers opcionales para exportación de datos */
  exportHandlers?: ExportHandlers;
}

/**
 * Componente genérico para mostrar listas tabulares de datos
 * con soporte para estado de carga, paginación unificada (TablePagination), acciones y vista en mosaico.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  emptyStateMessage = 'No hay datos disponibles.',
  pagination,
  renderActions,
  actionsLabel = 'Acciones',
  actionsAlign = 'center',
  actionsWidth,
  renderGridItem,
  defaultViewMode = 'list',
  sortConfig,
  onSort,
  leftHeaderAction,
  rightHeaderAction,
  hideTopBar = false,
  viewMode: controlledViewMode,
  onViewModeChange: onControlledViewModeChange,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  uniqueKey = 'id',
  exportHandlers,
}: DataTableProps<T>) {
  const colSpanCount =
    columns.length + (renderActions ? 1 : 0) + (selectable ? 1 : 0);
  const [internalViewMode, setInternalViewMode] = useState<'list' | 'grid'>(
    defaultViewMode
  );

  // Determinar qué modo usar (el prop controlado tiene prioridad)
  const viewMode = controlledViewMode || internalViewMode;

  const hasTopBarControls =
    !hideTopBar && (renderGridItem || leftHeaderAction || rightHeaderAction);
  const hasSizedColumns =
    columns.some((column) => column.width || column.minWidth) ||
    Boolean(actionsWidth);

  const handleViewModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: 'list' | 'grid'
  ) => {
    if (newMode !== null) {
      if (onControlledViewModeChange) {
        onControlledViewModeChange(newMode);
      } else {
        setInternalViewMode(newMode);
      }
    }
  };

  // Calcular valores para TablePagination (usa índice 0, el sistema usa índice 1)
  const pageSize = pagination?.pageSize ?? 10;
  const currentPage0 = pagination ? pagination.currentPage - 1 : 0;
  const totalItems =
    pagination?.totalItems ??
    (pagination ? pagination.totalPages * pageSize : 0);

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
          {/* SECCIÓN IZQUIERDA: Botones vista + actions izquierda */}
          <Box display="flex" alignItems="center" gap={2}>
            {renderGridItem && (
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                size="small"
              >
                <ToggleButton value="list">
                  <ViewListIcon />
                </ToggleButton>
                <ToggleButton value="grid">
                  <ViewModuleIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            )}
            {leftHeaderAction && <Box>{leftHeaderAction}</Box>}
          </Box>

          {/* SECCIÓN DERECHA */}
          <Box display="flex" alignItems="center" gap={1}>
            {exportHandlers?.onExportPdf && (
              <Tooltip
                title={
                  selectedIds.length > 0
                    ? `Exportar los ${selectedIds.length} registros seleccionados a PDF`
                    : `Exportar los ${pagination?.totalItems ?? data.length} ${
                        exportHandlers.exportLabel || 'registros'
                      } a PDF`
                }
              >
                <IconButton
                  color="error"
                  size="small"
                  onClick={exportHandlers.onExportPdf}
                  sx={{
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'error.light',
                    '&:hover': {
                      bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                    },
                  }}
                >
                  <PictureAsPdfOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {exportHandlers?.onExportExcel && (
              <Tooltip
                title={
                  selectedIds.length > 0
                    ? `Exportar los ${selectedIds.length} registros seleccionados a EXCEL`
                    : `Exportar los ${pagination?.totalItems ?? data.length} ${
                        exportHandlers.exportLabel || 'registros'
                      } a EXCEL`
                }
              >
                <IconButton
                  color="success"
                  size="small"
                  onClick={exportHandlers.onExportExcel}
                  sx={{
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'success.light',
                    '&:hover': {
                      bgcolor: (theme) =>
                        alpha(theme.palette.success.main, 0.1),
                    },
                  }}
                >
                  <FileDownloadOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
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
          <Table
            sx={{
              minWidth: { xs: '100%', md: 650 },
              tableLayout: hasSizedColumns ? 'fixed' : 'auto',
            }}
            aria-label="data table"
          >
            <TableHead>
              <TableRow>
                {selectable && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectedIds.length > 0 &&
                        selectedIds.length < data.length
                      }
                      checked={
                        data.length > 0 && selectedIds.length === data.length
                      }
                      onChange={(e) => {
                        if (onSelectionChange) {
                          if (e.target.checked) {
                            onSelectionChange(
                              data.map((row) =>
                                String(row[uniqueKey as keyof T])
                              )
                            );
                          } else {
                            onSelectionChange([]);
                          }
                        }
                      }}
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell
                    key={String(column.id)}
                    align={column.align || 'left'}
                    sx={{
                      width: column.width,
                      minWidth: column.minWidth,
                      fontWeight: 'bold',
                      display:
                        column.responsiveDisplay ||
                        (column.hideOnMobile
                          ? { xs: 'none', md: 'table-cell' }
                          : undefined),
                      ...column.headerSx,
                    }}
                    sortDirection={
                      sortConfig?.key === column.id
                        ? sortConfig.direction
                        : false
                    }
                  >
                    {column.sortable ? (
                      <TableSortLabel
                        active={sortConfig?.key === column.id}
                        direction={
                          sortConfig?.key === column.id
                            ? sortConfig.direction
                            : 'asc'
                        }
                        onClick={() => onSort && onSort(column.id)}
                        sx={{
                          width: '100%',
                          justifyContent: 'space-between',
                          '& .MuiTableSortLabel-icon': { ml: 0 },
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
                  <TableCell
                    align={actionsAlign}
                    sx={{ fontWeight: 'bold', width: actionsWidth }}
                  >
                    {actionsLabel}
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={colSpanCount}
                    align="center"
                    sx={{ py: 6 }}
                  >
                    <Spinner size="md" color="primary" />
                    <Typography sx={{ mt: 2 }} color="text.secondary">
                      Cargando datos...
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && data.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={colSpanCount}
                    align="center"
                    sx={{ py: 6 }}
                  >
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
              {!isLoading &&
                data.length > 0 &&
                data.map((row, rowIndex) => (
                  <TableRow
                    key={`row-${rowIndex}`}
                    selected={selectedIds.includes(
                      String(row[uniqueKey as keyof T])
                    )}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(
                            String(row[uniqueKey as keyof T])
                          )}
                          onChange={(e) => {
                            if (onSelectionChange) {
                              const id = String(row[uniqueKey as keyof T]);
                              if (e.target.checked) {
                                onSelectionChange([...selectedIds, id]);
                              } else {
                                onSelectionChange(
                                  selectedIds.filter((sid) => sid !== id)
                                );
                              }
                            }
                          }}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell
                        key={String(column.id)}
                        align={column.align || 'left'}
                        sx={{
                          width: column.width,
                          minWidth: column.minWidth,
                          display:
                            column.responsiveDisplay ||
                            (column.hideOnMobile
                              ? { xs: 'none', md: 'table-cell' }
                              : undefined),
                          ...column.cellSx,
                        }}
                      >
                        {column.render
                          ? column.render(row)
                          : (row[column.id as keyof T] as ReactNode)}
                      </TableCell>
                    ))}
                    {renderActions && (
                      <TableCell
                        align={actionsAlign}
                        sx={{ width: actionsWidth }}
                      >
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
      ) : (
        <Grid container spacing={3}>
          {isLoading && viewMode === 'grid' && (
            <>
              {Array.from({ length: 8 }).map((_, i) => (
                <Grid
                  size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
                  key={`skeleton-${i}`}
                >
                  <Paper variant="outlined" sx={{ p: 0, overflow: 'hidden' }}>
                    <Skeleton
                      variant="rectangular"
                      height={140}
                      animation="wave"
                    />
                    <Box sx={{ p: 2 }}>
                      <Skeleton variant="text" width="80%" height={28} />
                      <Skeleton
                        variant="text"
                        width="50%"
                        height={20}
                        sx={{ mt: 1 }}
                      />
                      <Skeleton
                        variant="rounded"
                        width={64}
                        height={24}
                        sx={{ mt: 1.5 }}
                      />
                      <Skeleton
                        variant="text"
                        width="40%"
                        height={24}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </>
          )}
          {isLoading && viewMode !== 'grid' && (
            <Grid size={{ xs: 12 }}>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                py={6}
              >
                <Spinner size="md" color="primary" />
                <Typography sx={{ mt: 2 }} color="text.secondary">
                  Cargando datos...
                </Typography>
              </Box>
            </Grid>
          )}
          {!isLoading && data.length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Box display="flex" justifyContent="center" py={6}>
                {typeof emptyStateMessage === 'string' ? (
                  <Typography color="text.secondary">
                    {emptyStateMessage}
                  </Typography>
                ) : (
                  emptyStateMessage
                )}
              </Box>
            </Grid>
          )}
          {!isLoading &&
            data.length > 0 &&
            data.map((row, index) => (
              <Grid
                size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
                key={`grid-item-${index}`}
              >
                {renderGridItem(row)}
              </Grid>
            ))}
        </Grid>
      )}

      {/* Paginación unificada: TablePagination al final (estilo consistente con aulas) */}
      {pagination && pagination.totalPages > 0 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            borderTop: '1px solid',
            borderColor: 'divider',
            mt: 1,
          }}
        >
          <TablePagination
            component="div"
            count={totalItems}
            page={currentPage0}
            onPageChange={(_e, newPage) => {
              // TablePagination usa 0-indexed, el sistema usa 1-indexed
              pagination.onPageChange(
                _e as React.ChangeEvent<unknown>,
                newPage + 1
              );
            }}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => {
              if (pagination.onPageSizeChange) {
                pagination.onPageSizeChange(
                  e as unknown as SelectChangeEvent<number>
                );
              }
            }}
            rowsPerPageOptions={pagination.pageSizeOptions ?? [5, 10, 15, 20]}
            labelRowsPerPage="Por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} de ${count}`
            }
          />
        </Box>
      )}
    </Box>
  );
}

export default DataTable;
