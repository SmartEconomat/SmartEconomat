/**
 * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
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
import { extractA11yText } from '../../utils/a11y-format';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { Tooltip } from './Tooltip';
import Spinner from './Spinner';
import { useTranslation } from 'react-i18next';
import type { FilterValue } from '../../hooks/useDataTable';

/**
 * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
 */
export interface Column<T> {
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  id: keyof T | string;
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  label: ReactNode;
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  render?: (row: T) => ReactNode;
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  align?: 'inherit' | 'left' | 'center' | 'right' | 'justify';
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  hideOnMobile?: boolean;
  /**
   * Indica si la columna es ordenable.
   */
  sortable?: boolean;
  /**
   * Tipo de ordenaci?n esperado para la columna.
   */
  sortType?: 'string' | 'number' | 'date';
  /**
   * Clave enviada al backend para ordenar.
   * Si no se define, se usa `id`.
   */
  sortKey?: string;
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  responsiveDisplay?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    [key: string]: string | undefined;
  };
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  /**
   * Indica si la columna es filtrable.
   */
  filterable?: boolean;
  /**
   * Tipo de filtro a mostrar.
   */
  filterType?: 'string' | 'number' | 'enum' | 'date';
  /**
   * Opciones para filtros de tipo enum.
   */
  filterOptions?: { label: string; value: unknown }[];
  /**
   * Ancho de la columna.
   */
  width?: number | string;
  /**
   * Ancho m?nimo de la columna.
   */
  minWidth?: number | string;
  /**
   * Estilos personalizados para la cabecera.
   */
  headerSx?: SxProps<Theme>;
  /**
   * Estilos personalizados para las celdas.
   */
  cellSx?: SxProps<Theme>;
}

/** Contrato de tipos p?blico (ExportHandlers). Contexto: smart-economat-frontend (SPA). */
export interface ExportHandlers {
  onExportPdf?: () => void;
  onExportExcel?: () => void;
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  exportLabel?: string;
}

/** Contrato de tipos p?blico (DataTableProps). Contexto: smart-economat-frontend (SPA). */
export interface DataTableProps<T> {
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  columns: Column<T>[];
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  data: T[];
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  isLoading?: boolean;
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  emptyStateMessage?: ReactNode;
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  pagination?: import('../../hooks/useDataTable').DataTablePaginationProps;
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  renderActions?: (row: T) => ReactNode;
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  actionsLabel?: string;
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  actionsAlign?: 'inherit' | 'left' | 'center' | 'right' | 'justify';
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  actionsWidth?: number | string;
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  renderGridItem?: (row: T) => ReactNode;
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  defaultViewMode?: 'list' | 'grid';
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  viewMode?: 'list' | 'grid';
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  onViewModeChange?: (mode: 'list' | 'grid') => void;
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  sortConfig?: {
    key: string;
    direction: 'asc' | 'desc';
  };
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  onSort?: (key: string) => void;
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  leftHeaderAction?: ReactNode;
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  rightHeaderAction?: ReactNode;
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  hideTopBar?: boolean;
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  selectable?: boolean;
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  selectedIds?: string[];
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  onSelectionChange?: (ids: string[]) => void;
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  uniqueKey?: keyof T | string;
  /**
   * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
   */
  /**
   * Configuraci?n de filtros actuales.
   */
  filters?: Record<string, FilterValue>;
  /**
   * Callback cuando un filtro cambia.
   */
  onFilter?: (key: string, value: FilterValue) => void;
  /**
   * Callback cuando se hace clic en una fila.
   */
  onRowClick?: (row: T) => void;
  /**
   * Generador de etiquetas aria para las filas.
   */
  getRowAriaLabel?: (row: T) => string;
  /**
   * Handlers para exportaci?n de datos.
   */
  exportHandlers?: ExportHandlers;
  /**
   * ID ?nico de la tabla.
   */
  id?: string;
  /**
   * Oculta los botones de toggle de vista lista/cuadrícula.
   */
  hideViewModeToggle?: boolean;
}

/**
 * Ejecuta la l?gica de operaci?n dentro del flujo de la aplicaci?n.
 */

// Eliminada la utilidad extractText local para usar la global en a11y-format.ts

/**
 * Expone "DataTable" en smart-economat-frontend (SPA).
 * @undefined {DataTableProps<T>} {
 *   columns,
 *   data,
 *   isLoading = false,
 *   emptyStateMessage,
 *   pagination,
 *   renderActions,
 *   actionsLabel,
 *   actionsAlign = 'center',
 *   actionsWidth,
 *   renderGridItem,
 *   defaultViewMode = 'list',
 *   sortConfig,
 *   onSort,
 *   leftHeaderAction,
 *   rightHeaderAction,
 *   hideTopBar = false,
 *   selectable = false,
 *   selectedIds = [],
 *   onSelectionChange,
 *   uniqueKey = 'id',
 *   exportHandlers,
 *   onRowClick,
 *   getRowAriaLabel,
 *   viewMode: controlledViewMode,
 *   onViewModeChange: onControlledViewModeChange,
 *   filters = {},
 *   onFilter,
 *   id,
 * } - Entrada efectiva esperada por el contrato.
 * @undefined {import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/node_modules/@types/react/jsx-runtime").JSX.Element} Datos efectivos despu?s de ejecutar la operaci?n.
 */
export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyStateMessage,
  pagination,
  renderActions,
  actionsLabel,
  actionsAlign = 'center',
  actionsWidth,
  renderGridItem,
  defaultViewMode = 'list',
  sortConfig,
  onSort,
  leftHeaderAction,
  rightHeaderAction,
  hideTopBar = false,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  uniqueKey = 'id',
  exportHandlers,
  onRowClick,
  getRowAriaLabel,
  viewMode: controlledViewMode,
  onViewModeChange: onControlledViewModeChange,
  filters: _filters = {},
  onFilter: _onFilter,
  id,
  hideViewModeToggle = false,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  void _filters;
  void _onFilter;
  const colSpanCount =
    columns.length + (renderActions ? 1 : 0) + (selectable ? 1 : 0);
  const [internalViewMode, setInternalViewMode] = useState<'list' | 'grid'>(
    defaultViewMode
  );
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [minHeight, setMinHeight] = useState<number | undefined>(undefined);
  const resolvedEmptyStateMessage = emptyStateMessage ?? t('comun.sinDatos');
  const resolvedActionsLabel = actionsLabel ?? t('comun.acciones');

  // Capturar la altura del contenedor antes de que cambie el contenido (prevenci?n de CLS)
  React.useLayoutEffect(() => {
    if (!isLoading && containerRef.current) {
      setMinHeight(containerRef.current.offsetHeight);
    }
  }, [isLoading]);

  // Determinar qu? modo usar (el prop controlado tiene prioridad)
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

  // Calcular valores para TablePagination (usa ?ndice 0, el sistema usa ?ndice 1)
  const pageSize = pagination?.pageSize ?? 10;
  const currentPage0 = pagination ? pagination.currentPage - 1 : 0;
  const totalItems =
    pagination?.totalItems ??
    (pagination ? pagination.totalPages * pageSize : 0);

  const handleRowKeyDown = (
    event: React.KeyboardEvent<HTMLTableRowElement>,
    row: T
  ) => {
    if (!onRowClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onRowClick(row);
    }
  };
  const resolveColumnSortKey = React.useCallback(
    (column: Column<T>): string => {
      return column.sortKey ?? String(column.id);
    },
    []
  );

  return (
    <Box id={id} sx={{ width: '100%', mb: 2 }}>
      {hasTopBarControls && (
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
          mb={3}
        >
          {/* SECCI��N IZQUIERDA: Botones vista + actions izquierda */}
          <Box display="flex" alignItems="center" gap={2}>
            {renderGridItem && !hideViewModeToggle && (
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                size="small"
              >
                <ToggleButton
                  value="list"
                  aria-label={t('table.viewMode.listAria')}
                >
                  <ViewListIcon />
                </ToggleButton>
                <ToggleButton
                  value="grid"
                  aria-label={t('table.viewMode.gridAria')}
                >
                  <ViewModuleIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            )}
            {leftHeaderAction && <Box>{leftHeaderAction}</Box>}
          </Box>

          {/* SECCI��N DERECHA */}
          <Box display="flex" alignItems="center" gap={1}>
            {exportHandlers?.onExportPdf && (
              <Tooltip
                title={
                  selectedIds.length > 0
                    ? t('table.export.pdfSelected', {
                        count: selectedIds.length,
                      })
                    : t('table.export.pdfAll', {
                        count: pagination?.totalItems ?? data.length,
                        label:
                          exportHandlers.exportLabel ||
                          t('table.export.records'),
                      })
                }
              >
                <IconButton
                  id="btn-export-pdf"
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
                    ? t('table.export.excelSelected', {
                        count: selectedIds.length,
                      })
                    : t('table.export.excelAll', {
                        count: pagination?.totalItems ?? data.length,
                        label:
                          exportHandlers.exportLabel ||
                          t('table.export.records'),
                      })
                }
              >
                <IconButton
                  id="btn-export-excel"
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
        <TableContainer
          ref={containerRef}
          component={Paper}
          id="results-area"
          tabIndex={-1}
          elevation={0}
          sx={{
            minHeight: isLoading ? minHeight : 'auto',
            transition: 'min-height 0.2s ease',
            outline: 'none',
            overflowX: 'auto',
          }}
        >
          <Table
            sx={{
              minWidth: { xs: '100%', md: 650 },
              tableLayout: hasSizedColumns ? 'fixed' : 'auto',
            }}
            aria-label={t('comun.tablaDatos')}
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
                {columns.map((column, index) => {
                  // La columna puede renderizar un valor derivado, pero ordenar por otra clave (`sortKey`).
                  const columnSortKey = resolveColumnSortKey(column);
                  const isActiveSort = sortConfig?.key === columnSortKey;

                  return (
                    <TableCell
                      key={String(column.id)}
                      id={
                        index === 0 && column.sortable
                          ? 'table-header-sort'
                          : undefined
                      }
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
                        isActiveSort ? sortConfig.direction : false
                      }
                      aria-sort={
                        column.sortable
                          ? isActiveSort
                            ? sortConfig?.direction === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : 'none'
                          : undefined
                      }
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                        }}
                      >
                        {column.sortable ? (
                          <TableSortLabel
                            active={isActiveSort}
                            direction={
                              isActiveSort ? sortConfig.direction : 'asc'
                            }
                            onClick={() => onSort?.(columnSortKey)}
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
                      </Box>
                    </TableCell>
                  );
                })}
                {renderActions && (
                  <TableCell
                    align={actionsAlign}
                    sx={{ fontWeight: 'bold', width: actionsWidth }}
                  >
                    {resolvedActionsLabel}
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading &&
                Array.from({ length: pageSize }).map((_, i) => (
                  <TableRow key={`skeleton-row-${i}`}>
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Skeleton
                          variant="rectangular"
                          width={20}
                          height={20}
                          sx={{ borderRadius: 0.5 }}
                        />
                      </TableCell>
                    )}
                    {columns.map((column, j) => (
                      <TableCell
                        key={`skeleton-col-${j}`}
                        align={column.align || 'left'}
                        sx={{
                          height: 53, // Altura est?ndar de una fila de tabla MUI con padding
                          width: column.width,
                          minWidth: column.minWidth,
                          display:
                            column.responsiveDisplay ||
                            (column.hideOnMobile
                              ? { xs: 'none', md: 'table-cell' }
                              : undefined),
                        }}
                      >
                        <Skeleton variant="text" width="80%" height={24} />
                      </TableCell>
                    ))}
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
                          <Skeleton variant="circular" width={28} height={28} />
                          <Skeleton variant="circular" width={28} height={28} />
                        </Stack>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              {!isLoading && data.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={colSpanCount}
                    align="center"
                    sx={{ py: 6 }}
                  >
                    {typeof resolvedEmptyStateMessage === 'string' ? (
                      <Typography color="text.secondary">
                        {resolvedEmptyStateMessage}
                      </Typography>
                    ) : (
                      resolvedEmptyStateMessage
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
                    hover={Boolean(onRowClick)}
                    tabIndex={onRowClick ? 0 : -1}
                    role={onRowClick ? 'button' : undefined}
                    aria-label={onRowClick ? getRowAriaLabel?.(row) : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={
                      onRowClick
                        ? (event) => handleRowKeyDown(event, row)
                        : undefined
                    }
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      ...(onRowClick
                        ? {
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                            '&:focus-visible': {
                              outline: '2px solid',
                              outlineColor: 'primary.main',
                              outlineOffset: '-2px',
                            },
                          }
                        : {}),
                    }}
                  >
                    {selectable && (
                      <TableCell
                        padding="checkbox"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                    {columns.map((column) => {
                      const cellValue = column.render
                        ? column.render(row)
                        : (row[column.id as keyof T] as ReactNode);

                      const colLabel = extractA11yText(column.label);
                      const valText = extractA11yText(cellValue);

                      return (
                        <TableCell
                          key={String(column.id)}
                          align={column.align || 'left'}
                          aria-label={
                            colLabel && valText
                              ? `${colLabel}: ${valText}`
                              : undefined
                          }
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
                          {cellValue}
                        </TableCell>
                      );
                    })}
                    {renderActions && (
                      <TableCell
                        align={actionsAlign}
                        id={rowIndex === 0 ? 'table-row-actions' : undefined}
                        sx={{ width: actionsWidth }}
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
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
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
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
        <Grid
          container
          spacing={3}
          ref={containerRef}
          sx={{
            minHeight: isLoading ? minHeight : 'auto',
          }}
        >
          {isLoading && viewMode === 'grid' && (
            <>
              {Array.from({ length: pageSize }).map((_, i) => (
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
                  {t('comun.cargando')}
                </Typography>
              </Box>
            </Grid>
          )}
          {!isLoading && data.length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Box display="flex" justifyContent="center" py={6}>
                {typeof resolvedEmptyStateMessage === 'string' ? (
                  <Typography color="text.secondary">
                    {resolvedEmptyStateMessage}
                  </Typography>
                ) : (
                  resolvedEmptyStateMessage
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

      {/* Paginaci?n unificada: TablePagination al final (estilo consistente con aulas) */}
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
            labelRowsPerPage={t('comun.porPagina')}
            labelDisplayedRows={({ from, to, count }) =>
              t('table.pagination.displayedRows', { from, to, count })
            }
            slotProps={{
              select: {
                'aria-label': t('table.pagination.rowsPerPageAria'),
              },
              actions: {
                nextButton: { 'aria-label': t('table.pagination.nextPage') },
                previousButton: {
                  'aria-label': t('table.pagination.previousPage'),
                },
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}

export default DataTable;
