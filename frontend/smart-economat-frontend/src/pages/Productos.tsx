/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Chip,
  Paper,
  Stack,
  IconButton,
  Typography,
  Alert,
  Button,
  Tooltip,
  CircularProgress,
  alpha,
  useTheme,
  Dialog,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
} from '@mui/material';
import { formatDigitsForSR } from '../utils/a11y-format';
import { formatLocalizedNumber } from '../utils/numberUtils';
import { formatLocalizedDate } from '../utils/intlFormat';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import DataTable, { Column } from '../components/ui/DataTable';
import PageToolbar from '../components/ui/PageToolbar';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DetailModal from '../components/ui/DetailModal';
// Importación dinámica para optimización de rendimiento (Code Splitting)
const ProductoFormModal = React.lazy(
  () => import('../features/productos/ProductoFormModal')
);
import { buildProductoPayload } from '../features/productos/productoForm.helpers';
import {
  Producto,
  ProductoAlergeno,
  ProductoProveedor,
  CategoriaProducto,
  UnidadMedida,
} from '../services/producto.types';
import {
  fetchProductos,
  createProducto,
  updateProducto,
  restoreProducto,
  fetchHistorialPrecios,
  invalidateProductosCache,
} from '../services/producto.service';
import { deleteResource, resolveStoredFileUrl } from '../services/api.service';
import { DownloadService } from '../services/download.service';
import { HistorialPrecio } from '../services/producto.types';
import { getProductoByBarcode } from '../services/producto.service';
import {
  fetchComparacionProveedores,
  type ComparacionProveedorItem,
} from '../services/productoProveedor.service';

// Utilidad para construir query string de filtros actuales
function buildExportQuery(filters: ProductFiltersState, searchTerm: string) {
  const params = new URLSearchParams();
  if (searchTerm.trim()) params.set('searchTerm', searchTerm.trim());
  if (filters.categorias && filters.categorias.length > 0)
    params.set('categorias', filters.categorias.join(','));
  if (filters.alergenos && filters.alergenos.length > 0)
    params.set('alergenos', filters.alergenos.join(','));
  return params.toString() ? `?${params.toString()}` : '';
}
import { useToast } from '../store/toast.hooks';
import StatusChip from '../components/ui/StatusChip';
import { usePermission } from '../store/auth.hooks';
import { PERMISSIONS } from '../sherlock-auth/permissions.constants';
import ProductCard from '../features/productos/ProductCard';
import { useSidebar } from '../store/sidebar.hooks';
import { useBreakpoints } from '../utils/useBreakpoints';
import ProductFilters, {
  ProductFiltersState,
} from '../features/productos/ProductFilters';
import { EU_ALLERGENS, Allergen } from '../utils/constants';
import { getCategoryIcon } from '../features/productos/utils/getCategoryIcon';
import ShoppingBasketOutlinedIcon from '@mui/icons-material/ShoppingBasketOutlined';
import AddIcon from '@mui/icons-material/Add';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
const BarcodeScanner = React.lazy(
  () => import('../components/ui/BarcodeScanner')
);
import { searchByBarcode } from '../services/openfoodfacts.service';
import LinearLoader from '../components/ui/LinearLoader';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useDataTable } from '../hooks/useDataTable';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
interface ProductoFormValues {
  [key: string]: unknown;
  id?: string;
  nombre?: string;
  marca?: string;
  descripcion?: string;
  tipo?: CategoriaProducto;
  unidad?: UnidadMedida;
  contenido?: number;
  codigoBarras?: string;
  alergenos?: string[];
  imagen?: string;
  pathImg?: string;
  proveedores?: {
    proveedorId: string;
    nombre: string;
    marca?: string;
    codigoBarras?: string;
    precioUnitario?: string | number;
  }[];
  pmp?: number;
}

const initialFilters: ProductFiltersState = {
  categorias: [],
  alergenos: [],
};

const resolveProveedorId = (proveedor: ProductoProveedor): string | undefined =>
  proveedor.proveedor?.id ?? proveedor.proveedorId;

const Productos: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { isExpanded: sidebarExpanded } = useSidebar();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filters, setFilters] = useState<ProductFiltersState>(initialFilters);
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  const [data, setData] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Producto | null>(null);
  const [productToEdit, setProductToEdit] = useState<ProductoFormValues | null>(
    null
  );
  const [productToView, setProductToView] = useState<Producto | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { screenWidth } = useBreakpoints();
  const theme = useTheme();
  const [isSearchScannerOpen, setIsSearchScannerOpen] = useState(false);
  const [priceHistory, setPriceHistory] = useState<HistorialPrecio[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyProviderFilter, setHistoryProviderFilter] =
    useState<string>('all');
  const [providerComparisonByRelationId, setProviderComparisonByRelationId] =
    useState<Record<string, ComparacionProveedorItem>>({});
  const historySectionRef = useRef<HTMLDivElement | null>(null);
  const loadDataRequestIdRef = useRef(0);

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
    sortBy: 'nombre',
    order: 'asc',
  });

  // Estado con retraso para la aparición de columnas y evitar parpadeos/solapamientos durante la animación del sidebar
  const [isSidebarActuallyExpanded, setIsSidebarActuallyExpanded] =
    useState(sidebarExpanded);

  useEffect(() => {
    if (sidebarExpanded) {
      // Si se expande, ocultamos la columna Marca inmediatamente para evitar solapamiento
      setIsSidebarActuallyExpanded(true);
    } else {
      // Si se contrae, esperamos a que termine la animación (~200ms) antes de mostrar Marca
      const timer = setTimeout(() => {
        setIsSidebarActuallyExpanded(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [sidebarExpanded]);

  // Exportar productos a PDF
  const handleExportPdf = async () => {
    try {
      const query = buildExportQuery(filters, searchTerm);
      await DownloadService.downloadFile(`/export/productos/pdf${query}`, {
        filename: 'productos.pdf',
        toast,
      });
    } catch {
      // El error ya lo maneja el servicio mediante toast
    }
  };

  // Exportar productos a Excel
  const handleExportExcel = async () => {
    try {
      const query = buildExportQuery(filters, searchTerm);
      await DownloadService.downloadFile(`/export/productos/xlsx${query}`, {
        filename: 'productos.xlsx',
        toast,
      });
    } catch {
      // El error ya lo maneja el servicio
    }
  };

  const canEdit = usePermission(PERMISSIONS.productos.editar);
  const canDelete = usePermission(PERMISSIONS.productos.eliminar);
  const canCreate = usePermission(PERMISSIONS.productos.crear);

  const loadData = useCallback(async () => {
    const requestId = ++loadDataRequestIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const productosData = await fetchProductos({
        page: queryParams.page,
        limit: queryParams.limit,
        searchTerm: queryParams.searchTerm,
        // Combinar filtros de chips con filtros de tabla
        categorias: [
          ...(filters.categorias || []),
          ...(tableFilters.tipo ? [tableFilters.tipo] : []),
        ],
        sortBy: queryParams.sortBy,
        order: queryParams.order,
        soloEliminados: activeTab === 'deleted',
      });

      if (requestId !== loadDataRequestIdRef.current) {
        return;
      }

      setData(productosData.data);
      syncPaginationFromResponse(productosData);
    } catch (err: unknown) {
      if (requestId !== loadDataRequestIdRef.current) {
        return;
      }

      syncPaginationFromResponse({ total: 0, data: [] });
      const message =
        err instanceof Error ? err.message : t('productos.errors.errorCargar');
      setError(message);
    } finally {
      if (requestId === loadDataRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    queryParams,
    filters.categorias,
    tableFilters.tipo,
    activeTab,
    syncPaginationFromResponse,
    t,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await deleteResource(`/productos/${productToDelete.id}`);
      invalidateProductosCache();
      setData((prev) => prev.filter((p) => p.id !== productToDelete.id));
      toast.success(
        t('productos.toast.eliminadoNombre', {
          nombre: productToDelete.nombre,
        }),
        undefined,
        {
          productCategory: productToDelete.tipo,
        }
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al eliminar el producto.';
      toast.error(message, undefined, {
        productCategory: productToDelete.tipo,
      });
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  const handleSaveProduct = async (formData: ProductoFormValues) => {
    setIsSaving(true);

    try {
      const payload = await buildProductoPayload(
        formData as Record<string, unknown>
      );
      const category = formData.tipo;

      if (formData.id) {
        await updateProducto(formData.id, payload);
        toast.success(t('productos.toast.actualizado'), undefined, {
          productCategory: category,
        });
      } else {
        await createProducto(payload);
        toast.success(t('productos.toast.creado'), undefined, {
          productCategory: category,
        });
      }

      await loadData();
      setProductToEdit(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('productos.toast.errorGuardar');
      toast.error(message, undefined, {
        productCategory: (formData as { tipo?: CategoriaProducto }).tipo,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreProduct = async (product: Producto) => {
    try {
      await restoreProducto(product.id);
      toast.success(
        t('productos.toast.restaurado', { nombre: product.nombre })
      );
      await loadData();
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : t('productos.toast.errorRestaurar');
      toast.error(message);
    }
  };

  const columns = React.useMemo<Column<Producto>[]>(() => {
    const allColumns: Column<Producto>[] = [
      {
        id: 'nombre',
        label: t('productos.columns.nombre'),
        sortable: true,
        sortType: 'string',
        minWidth: 280,
        render: (row) => (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {row.nombre}
            </Typography>
            {(!row.proveedores || row.proveedores.length === 0) && (
              <Tooltip title={t('productos.card.sinProveedoresTooltip')}>
                <Chip
                  label={t('productos.card.sinProveedores')}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              </Tooltip>
            )}
          </Stack>
        ),
      },
      {
        id: 'marca',
        label: t('productos.columns.marca'),
        render: (row) => row.marca ?? '—',
        hideOnMobile: true,
        sortable: true,
        sortType: 'string',
        minWidth: 140,
        width: 160,
      },
      {
        id: 'tipo',
        label: t('productos.columns.tipo'),
        render: (row) =>
          row.tipo ? <StatusChip status={row.tipo} variant="outlined" /> : '—',
        hideOnMobile: true,
        sortable: true,
        sortType: 'string',
        width: 140,
      },
      {
        id: 'contenido',
        label: t('productos.columns.contenido'),
        align: 'right',
        render: (row) =>
          row.unidad ? `${row.contenido} ${row.unidad}` : `${row.contenido}`,
        width: 120,
      },
      {
        id: 'codigoBarras',
        label: t('productos.columns.codigoBarras'),
        render: (row) => (
          <Typography
            variant="body2"
            aria-label={t('productos.aria.codigoBarras', {
              codigo: formatDigitsForSR(row.codigoBarras || ''),
            })}
          >
            {row.codigoBarras ?? '—'}
          </Typography>
        ),
        responsiveDisplay: { xs: 'none', lg: 'table-cell' },
        sortable: true,
        sortType: 'string',
        width: 160,
      },
      {
        id: 'createdAt',
        label: t('productos.columns.fechaAlta'),
        render: (row) => formatLocalizedDate(row.createdAt),
        hideOnMobile: true,
        sortable: true,
        sortType: 'date',
        width: 120,
      },
    ];

    // Lógica de ocultación dinámica: si el sidebar está expandido y la pantalla es < 1400px,
    // ocultamos "Marca" para evitar solapamientos con "Nombre".
    // Usamos isSidebarActuallyExpanded (con delay al cerrar) para dar tiempo a la animación.
    if (isSidebarActuallyExpanded && screenWidth < 1400) {
      return allColumns.filter((col) => col.id !== 'marca');
    }

    return allColumns;
  }, [isSidebarActuallyExpanded, screenWidth, t]);

  const buildEditData = (row: Producto): ProductoFormValues => {
    const editData: ProductoFormValues = {
      ...row,
      alergenos: [],
      proveedores: [],
      pmp: row.pmp ?? 0,
    };
    if (row.pathImg) editData.imagen = resolveStoredFileUrl(row.pathImg);
    if (row.alergenos) {
      editData.alergenos = row.alergenos.map((alergeno) =>
        typeof alergeno === 'string'
          ? alergeno
          : (alergeno as ProductoAlergeno).alergeno || ''
      );
    }
    if (row.proveedores) {
      editData.proveedores = row.proveedores.map(
        (proveedor: ProductoProveedor) => ({
          proveedorId: proveedor.proveedor?.id || proveedor.proveedorId || '',
          nombre: proveedor.proveedor?.nombre || '',
          marca: proveedor.marca || '',
          codigoBarras: proveedor.codigoBarras || '',
          precioUnitario: proveedor.precioUnitario || '',
        })
      );
    }
    return editData;
  };

  const buildCreateProductDraft = async (barcode: string) => {
    const offData = await searchByBarcode(barcode);

    return {
      nombre: offData?.name || '',
      marca: offData?.brand || '',
      unidad: UnidadMedida.UNIDAD,
      tipo: CategoriaProducto.OTRO,
      contenido: 1,
      codigoBarras: barcode,
    };
  };

  const handleSearchScannerResult = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    onSearchChange(code);

    try {
      const existingProduct = await getProductoByBarcode(code);

      if (existingProduct) {
        setProductToEdit(buildEditData(existingProduct));
        toast.success(t('productos.toast.localizado'));
        return;
      }

      if (!canCreate) {
        toast.info(t('productos.toast.noEncontradoInfo'));
        return;
      }

      setProductToEdit(await buildCreateProductDraft(code));
      toast.info(t('productos.toast.noEncontradoForm'));
    } catch {
      if (!canCreate) {
        toast.error(t('productos.toast.errorValidar'));
        return;
      }

      setProductToEdit(await buildCreateProductDraft(code));
      toast.warning(t('productos.toast.errorCatalogo'));
    }
  };

  const handleEditClick = (row: Producto) => {
    setProductToEdit(buildEditData(row));
  };

  const handleViewClick = (row: Producto) => {
    setProductToView(row);
    setHistoryProviderFilter('all');
  };

  const handleProviderHistoryClick = (proveedorId?: string) => {
    if (!proveedorId) return;
    setHistoryProviderFilter(proveedorId);
    requestAnimationFrame(() => {
      historySectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  useEffect(() => {
    if (productToView) {
      const loadHistory = async () => {
        setIsLoadingHistory(true);
        try {
          const providerId =
            historyProviderFilter === 'all' ? undefined : historyProviderFilter;
          const history = await fetchHistorialPrecios(
            productToView.id,
            providerId
          );
          setPriceHistory(history);
        } catch {
          setPriceHistory([]);
        } finally {
          setIsLoadingHistory(false);
        }
      };
      loadHistory();
    } else {
      setPriceHistory([]);
    }
  }, [productToView, historyProviderFilter]);

  useEffect(() => {
    let isCancelled = false;

    if (!productToView) {
      setProviderComparisonByRelationId({});
      return () => {
        isCancelled = true;
      };
    }

    const loadProviderComparison = async () => {
      try {
        const comparison = await fetchComparacionProveedores(productToView.id);

        if (isCancelled) {
          return;
        }

        const comparisonById = comparison.proveedores.reduce<
          Record<string, ComparacionProveedorItem>
        >((acc, item) => {
          acc[item.productoProveedorId] = item;
          return acc;
        }, {});

        setProviderComparisonByRelationId(comparisonById);
      } catch {
        if (!isCancelled) {
          setProviderComparisonByRelationId({});
        }
      }
    };

    void loadProviderComparison();

    return () => {
      isCancelled = true;
    };
  }, [productToView]);

  const renderActions = (row: Producto) => (
    <Stack direction="row" spacing={1} justifyContent="center">
      {activeTab === 'active' && canEdit && (
        <Tooltip title={t('productos.actions.editar')}>
          <IconButton
            color="secondary"
            onClick={(event) => {
              event.stopPropagation();
              setProductToEdit(buildEditData(row));
            }}
            size="small"
            aria-label={t('productos.actions.editar')}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {activeTab === 'active' && canDelete && (
        <Tooltip title={t('productos.actions.eliminar')}>
          <IconButton
            color="error"
            onClick={(event) => {
              event.stopPropagation();
              setProductToDelete(row);
            }}
            size="small"
            aria-label={t('productos.actions.eliminar')}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {activeTab === 'deleted' && (
        <Tooltip title={t('comun.restaurar')}>
          <IconButton
            color="success"
            onClick={(e) => {
              e.stopPropagation();
              handleRestoreProduct(row);
            }}
            size="small"
            aria-label={t('comun.restaurar')}
          >
            <RestoreFromTrashIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );

  const hasActiveFilters =
    (filters.categorias && filters.categorias.length > 0) ||
    (filters.alergenos && filters.alergenos.length > 0);
  const hasSearchOrFilters = searchTerm.trim() !== '' || hasActiveFilters;

  return (
    <Box>
      {(isLoading || isSaving) && <LinearLoader fixed />}
      <PageToolbar
        title={t('productos.titulo')}
        searchValue={searchTerm}
        onSearchChange={onSearchChange}
        searchPlaceholder={t('productos.searchPlaceholder')}
        searchId="search-productos"
        autoFocusSearch={true}
        totalItems={totalItems}
        totalItemsLabel={t('productos.totalItemsLabel')}
        primaryAction={
          canCreate
            ? {
                label: t('productos.acciones.nuevo'),
                onClick: () => {
                  setProductToEdit({});
                },
                id: 'btn-nuevo-producto',
              }
            : undefined
        }
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        extraActions={[
          {
            label: t('productos.acciones.exportarPdf'),
            onClick: () => {
              void handleExportPdf();
            },
            icon: <PictureAsPdfOutlinedIcon />,
            id: 'btn-exportar-productos-pdf',
            color: 'error',
            variant: 'outlined',
          },
          {
            label: t('productos.acciones.exportarExcel'),
            onClick: () => {
              void handleExportExcel();
            },
            icon: <FileDownloadOutlinedIcon />,
            id: 'btn-exportar-productos-excel',
            color: 'success',
            variant: 'outlined',
          },
        ]}
        filters={
          <Box
            id="filter-productos"
            display="flex"
            gap={2}
            alignItems="center"
            flexWrap="wrap"
          >
            <ProductFilters
              filters={filters}
              onChange={(newFilters) => {
                setFilters(newFilters);
                onPageChange(null, 1);
              }}
              onClear={() => {
                setFilters(initialFilters);
                onPageChange(null, 1);
              }}
              inline
            />
          </Box>
        }
        onScanBarcode={() => setIsSearchScannerOpen(true)}
      />

      <Suspense fallback={<LinearLoader />}>
        <BarcodeScanner
          open={isSearchScannerOpen}
          onClose={() => setIsSearchScannerOpen(false)}
          onScan={(code) => {
            void handleSearchScannerResult(code);
          }}
          title={t('productos.acciones.escanear')}
        />
      </Suspense>

      <Paper
        elevation={2}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(
              _e: React.SyntheticEvent,
              newValue: 'active' | 'deleted'
            ) => setActiveTab(newValue)}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
            aria-label={t('productos.titulo')}
          >
            <Tab
              icon={<Inventory2OutlinedIcon />}
              label={t('comun.activos')}
              value="active"
            />
            <Tab
              icon={<DeleteSweepOutlinedIcon />}
              label={t('comun.eliminados')}
              value="deleted"
            />
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 2, sm: 4 } }}>
          {!isLoading && error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            hideTopBar={true}
            viewMode={viewMode}
            defaultViewMode={viewMode}
            onSort={onSort}
            sortConfig={sortConfig}
            filters={tableFilters}
            onFilter={onFilter}
            pagination={paginationProps}
            actionsWidth={120}
            getRowAriaLabel={(row: Producto) =>
              t('productos.aria.filaProducto', {
                nombre: row.nombre,
                marca: row.marca ?? t('productos.marcaGenerica'),
              })
            }
            emptyStateMessage={
              <Box
                sx={{
                  py: { xs: 6, md: 10 },
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  maxWidth: 450,
                  mx: 'auto',
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    color: 'primary.main',
                    mb: 3,
                    boxShadow: (theme) =>
                      `0 8px 16px ${alpha(theme.palette.primary.main, 0.1)}`,
                  }}
                >
                  {activeTab === 'deleted' ? (
                    <DeleteSweepOutlinedIcon sx={{ fontSize: 40 }} />
                  ) : (
                    <ShoppingBasketOutlinedIcon sx={{ fontSize: 40 }} />
                  )}
                </Box>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}
                >
                  {hasSearchOrFilters
                    ? t('productos.empty.sinResultados')
                    : activeTab === 'deleted'
                      ? t('productos.empty.sinEliminados')
                      : t('productos.empty.sinProductos')}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 4 }}
                >
                  {hasSearchOrFilters
                    ? t('productos.empty.prueba')
                    : activeTab === 'deleted'
                      ? t('productos.empty.sinEliminadosHint')
                      : t('productos.empty.empieza')}
                </Typography>
                {!hasSearchOrFilters && canCreate && activeTab === 'active' && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setProductToEdit({});
                    }}
                    sx={{
                      borderRadius: 3,
                      px: 4,
                      py: 1.2,
                      boxShadow: (theme) =>
                        `0 8px 20px ${alpha(theme.palette.primary.main, 0.25)}`,
                    }}
                  >
                    {t('productos.acciones.nuevo')}
                  </Button>
                )}
              </Box>
            }
            renderGridItem={(producto) => (
              <ProductCard
                producto={producto}
                onEdit={handleEditClick}
                onDelete={setProductToDelete}
                onView={handleViewClick}
                isDeleted={activeTab === 'deleted'}
                onRestore={
                  activeTab === 'deleted' ? handleRestoreProduct : undefined
                }
              />
            )}
            renderActions={renderActions}
            onRowClick={handleViewClick}
          />
        </Box>
      </Paper>

      <ConfirmDialog
        isOpen={!!productToDelete}
        onClose={() => !isDeleting && setProductToDelete(null)}
        onConfirm={() => void handleDeleteConfirm()}
        title={t('productos.confirm.eliminarTitulo')}
        message={
          <>
            ¿Estás seguro de que deseas eliminar el producto{' '}
            <strong>{productToDelete?.nombre}</strong>? Esta acción no se puede
            deshacer.
          </>
        }
        confirmText={t('productos.confirm.eliminarConfirm')}
        cancelText={t('productos.confirm.cancelar')}
        isLoading={isDeleting}
      />

      <React.Suspense fallback={<LinearLoader />}>
        <ProductoFormModal
          isOpen={!!productToEdit}
          onClose={() => setProductToEdit(null)}
          initialData={productToEdit || {}}
          onSubmit={(data) =>
            void handleSaveProduct(data as ProductoFormValues)
          }
          isSubmitting={isSaving}
        />
      </React.Suspense>

      {/* ── Modal de DETALLE ── */}
      {productToView &&
        (() => {
          const p = productToView;
          const alergenoIds =
            p.alergenos?.map((a: ProductoAlergeno) => a.alergeno) ?? [];
          const alergenosActivos = EU_ALLERGENS.filter((a: Allergen) =>
            alergenoIds.includes(a.id)
          );
          const proveedoresAsociados = p.proveedores ?? [];
          const imageUrl = resolveStoredFileUrl(p.pathImg);

          return (
            <DetailModal
              isOpen={true}
              onClose={() => setProductToView(null)}
              title={p.nombre}
              subtitle={p.marca || undefined}
              size="md"
              editLabel={
                canEdit && activeTab === 'active'
                  ? t('productos.acciones.editarProducto')
                  : undefined
              }
              onEdit={
                canEdit && activeTab === 'active'
                  ? () => {
                      setProductToEdit(buildEditData(p));
                      setProductToView(null);
                    }
                  : undefined
              }
              headerMedia={
                imageUrl ? (
                  <Tooltip title={t('productos.detail.clickAmpliar')} arrow>
                    <Box
                      component="img"
                      src={imageUrl}
                      alt={p.nombre}
                      onClick={() => setZoomedImage(imageUrl)}
                      sx={{
                        height: 160,
                        objectFit: 'cover',
                        width: '100%',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          filter: 'brightness(0.9)',
                        },
                      }}
                    />
                  </Tooltip>
                ) : (
                  getCategoryIcon(p.tipo, {
                    sx: {
                      fontSize: 80,
                      color: 'text.secondary',
                      opacity: 0.6,
                    },
                  })
                )
              }
              sections={[
                {
                  title: t('productos.detail.infoGeneral'),
                  columns: 3,
                  fields: [
                    {
                      label: t('productos.detail.tipo'),
                      value: p.tipo ? (
                        <StatusChip
                          status={p.tipo}
                          size="small"
                          variant="outlined"
                        />
                      ) : undefined,
                    },
                    {
                      label: t('productos.detail.contenido'),
                      value: `${p.contenido}${p.unidad ? ' ' + p.unidad : ''}`,
                    },
                    {
                      label: t('productos.detail.codigoBarras'),
                      value: p.codigoBarras ?? undefined,
                    },
                    {
                      label: t('productos.detail.pmp'),
                      value: (
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color="primary.main"
                        >
                          {(p.pmp ?? 0).toFixed(2)} €
                        </Typography>
                      ),
                    },
                    {
                      label: t('productos.detail.descripcion'),
                      value: p.descripcion
                        ? p.descripcion
                            .replace(
                              /\n?\[MIGRACION_CATALOGO_ECONOMATO_20260402\].*$/gm,
                              ''
                            )
                            .trim()
                        : undefined,
                      fullWidth: true,
                    },
                  ],
                },
                ...(alergenosActivos.length > 0
                  ? [
                      {
                        title: t('productos.detail.alergenos'),
                        content: (
                          <Box
                            sx={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 1.5,
                            }}
                          >
                            {alergenosActivos.map((a: Allergen) => (
                              <Box
                                key={a.id}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  bgcolor: 'action.hover',
                                  px: 1.5,
                                  py: 0.75,
                                  borderRadius: 2,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  color: 'text.secondary',
                                  '& svg': { fontSize: 20 },
                                }}
                              >
                                {a.icon}
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 500,
                                    color: 'text.primary',
                                  }}
                                >
                                  {a.label}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        ),
                      },
                    ]
                  : []),
                ...(proveedoresAsociados.length > 0
                  ? [
                      {
                        title: t('productos.detail.proveedores'),
                        content: (
                          <Stack spacing={1.5}>
                            {proveedoresAsociados.map((pv, idx: number) => {
                              const comparison = pv.id
                                ? providerComparisonByRelationId[pv.id]
                                : undefined;
                              const providerId =
                                comparison?.proveedorId ??
                                resolveProveedorId(pv);
                              const providerName =
                                comparison?.proveedorNombre ??
                                pv.proveedor?.nombre ??
                                pv.nombre ??
                                t('forms.productFallback', { index: idx + 1 });
                              const isOptimal =
                                comparison?.esOptimo ?? pv.esOptimo;
                              const ahorroAbsolutoPct =
                                comparison?.ahorroAbsolutoPct ??
                                pv.ahorroAbsolutoPct;
                              const precioUnitario =
                                comparison?.precioUnitario ?? pv.precioUnitario;
                              const mermaEsperada =
                                comparison?.mermaEsperada ?? pv.mermaEsperada;
                              const costeEfectivoUnitario =
                                comparison?.costeEfectivoUnitario ??
                                pv.costeEfectivoUnitario;
                              const marcaProveedor =
                                comparison?.marca ?? pv.marca;
                              const codigoBarrasProveedor =
                                comparison?.codigoBarras ?? pv.codigoBarras;

                              return (
                                <Paper
                                  key={pv.id || idx}
                                  variant="outlined"
                                  sx={{
                                    p: 2,
                                    borderColor: isOptimal
                                      ? 'success.main'
                                      : 'divider',
                                    bgcolor: isOptimal
                                      ? 'rgba(46, 125, 50, 0.06)'
                                      : 'transparent',
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      mb: 1.5,
                                    }}
                                  >
                                    <Typography
                                      variant="subtitle2"
                                      fontWeight={600}
                                    >
                                      {providerName}
                                    </Typography>
                                    <Stack
                                      direction="row"
                                      spacing={1}
                                      alignItems="center"
                                    >
                                      {isOptimal && (
                                        <Chip
                                          label={
                                            ahorroAbsolutoPct != null
                                              ? t(
                                                  'productos.detail.mejorOpcionConAhorro',
                                                  {
                                                    pct: ahorroAbsolutoPct.toFixed(
                                                      1
                                                    ),
                                                  }
                                                )
                                              : t(
                                                  'productos.detail.mejorOpcion'
                                                )
                                          }
                                          size="small"
                                          color="success"
                                        />
                                      )}
                                      <Tooltip
                                        title={t(
                                          'productos.actions.verHistorico'
                                        )}
                                      >
                                        <span>
                                          <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => {
                                              handleProviderHistoryClick(
                                                providerId
                                              );
                                            }}
                                            aria-label={t(
                                              'productos.actions.ariaVerHistorico',
                                              {
                                                nombre: providerName,
                                              }
                                            )}
                                            disabled={!providerId}
                                          >
                                            <HistoryOutlinedIcon fontSize="small" />
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                    </Stack>
                                  </Box>
                                  <Box
                                    sx={{
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(3, 1fr)',
                                      gap: 1.5,
                                    }}
                                  >
                                    {precioUnitario != null && (
                                      <Box>
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                          sx={{
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5,
                                            mb: 0.25,
                                          }}
                                        >
                                          {t('productos.detail.precio')}
                                        </Typography>
                                        <Typography variant="body2">
                                          {precioUnitario.toFixed(2)} €
                                        </Typography>
                                      </Box>
                                    )}
                                    {mermaEsperada != null && (
                                      <Box>
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                          sx={{
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5,
                                            mb: 0.25,
                                          }}
                                        >
                                          {t('productos.detail.merma')}
                                        </Typography>
                                        <Typography variant="body2">
                                          {mermaEsperada.toFixed(1)} %
                                        </Typography>
                                      </Box>
                                    )}
                                    {costeEfectivoUnitario != null && (
                                      <Box>
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                          sx={{
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5,
                                            mb: 0.25,
                                          }}
                                        >
                                          {t('productos.detail.costeReal')}
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            fontWeight: 700,
                                            color: isOptimal
                                              ? 'success.main'
                                              : 'text.primary',
                                          }}
                                        >
                                          {costeEfectivoUnitario.toFixed(2)} €
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                  {(marcaProveedor ||
                                    codigoBarrasProveedor) && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ mt: 1, display: 'block' }}
                                    >
                                      {[
                                        marcaProveedor &&
                                          `${t('proveedores.campoMarca')}: ${marcaProveedor}`,
                                        codigoBarrasProveedor &&
                                          `${t('productos.columns.codigoBarras')}: ${codigoBarrasProveedor}`,
                                      ]
                                        .filter(Boolean)
                                        .join(' · ')}
                                    </Typography>
                                  )}
                                </Paper>
                              );
                            })}
                          </Stack>
                        ),
                      },
                    ]
                  : []),
                {
                  title: t('productos.detail.historicoPrecios'),
                  content: (
                    <Box ref={historySectionRef}>
                      <Box
                        sx={{
                          mb: 2,
                          display: 'flex',
                          justifyContent: 'flex-end',
                        }}
                      >
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                          <InputLabel id="history-provider-filter-label">
                            {t('productos.detail.filtroProveedor')}
                          </InputLabel>
                          <Select
                            labelId="history-provider-filter-label"
                            id="history-provider-filter"
                            value={historyProviderFilter}
                            label={t('productos.detail.filtroProveedor')}
                            onChange={(e) =>
                              setHistoryProviderFilter(e.target.value)
                            }
                          >
                            <MenuItem value="all">
                              {t('productos.detail.todosProveedores')}
                            </MenuItem>
                            {p.proveedores?.map((pp) => {
                              const providerId = resolveProveedorId(pp);
                              if (!providerId) return null;

                              return (
                                <MenuItem
                                  key={`${pp.id}-${providerId}`}
                                  value={providerId}
                                >
                                  {pp.proveedor?.nombre ??
                                    pp.nombre ??
                                    t('productos.detail.proveedor')}
                                </MenuItem>
                              );
                            })}
                          </Select>
                        </FormControl>
                      </Box>

                      {isLoadingHistory ? (
                        <Box
                          sx={{
                            py: 6,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                          }}
                        >
                          <CircularProgress
                            size={32}
                            thickness={5}
                            sx={{
                              color: alpha(theme.palette.primary.main, 0.4),
                            }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {t('productos.detail.cargandoHistorial')}
                          </Typography>
                        </Box>
                      ) : priceHistory.length > 0 ? (
                        <Box
                          sx={{
                            overflowX: 'auto',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: alpha(theme.palette.background.paper, 0.4),
                          }}
                        >
                          <Table
                            size="small"
                            aria-label={t('productos.detail.historicoPrecios')}
                          >
                            <TableHead>
                              <TableRow
                                sx={{
                                  bgcolor: alpha(
                                    theme.palette.action.hover,
                                    0.5
                                  ),
                                }}
                              >
                                <TableCell
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                    color: 'text.secondary',
                                    py: 1.5,
                                  }}
                                >
                                  {t('productos.historial.fecha')}
                                </TableCell>
                                <TableCell
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                    color: 'text.secondary',
                                    py: 1.5,
                                  }}
                                >
                                  {t('productos.historial.proveedor')}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                    color: 'text.secondary',
                                    py: 1.5,
                                  }}
                                >
                                  {t('productos.historial.cantidad')}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                    color: 'text.secondary',
                                    py: 1.5,
                                  }}
                                >
                                  {t('productos.historial.precio')}
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {priceHistory.map((h) => (
                                <TableRow
                                  key={h.id}
                                  sx={{
                                    '&:last-child td': { border: 0 },
                                    '&:hover': {
                                      bgcolor: alpha(
                                        theme.palette.primary.main,
                                        0.02
                                      ),
                                    },
                                  }}
                                >
                                  <TableCell
                                    sx={{
                                      py: 1.5,
                                      whiteSpace: 'nowrap',
                                      fontWeight: 500,
                                    }}
                                  >
                                    {formatLocalizedDate(h.fecha, {
                                      month: 'short',
                                    })}
                                  </TableCell>
                                  <TableCell sx={{ py: 1.5 }}>
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: 600 }}
                                    >
                                      {h.productoProveedor?.proveedor?.nombre ||
                                        '—'}
                                    </Typography>
                                    {h.documentoOrigen && (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        display="block"
                                      >
                                        {t('productos.historial.documento')}:{' '}
                                        {h.documentoOrigen}
                                      </Typography>
                                    )}
                                  </TableCell>
                                  <TableCell align="right" sx={{ py: 1.5 }}>
                                    <Typography variant="body2">
                                      {h.cantidad != null
                                        ? formatLocalizedNumber(
                                            Number(h.cantidad),
                                            0
                                          )
                                        : '—'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right" sx={{ py: 1.5 }}>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: 700,
                                        color: 'primary.main',
                                        bgcolor: alpha(
                                          theme.palette.primary.main,
                                          0.05
                                        ),
                                        display: 'inline-block',
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 1,
                                      }}
                                    >
                                      {Number(h.precio).toFixed(2)} €
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          align="center"
                          sx={{
                            py: 3,
                            bgcolor: 'action.hover',
                            borderRadius: 1,
                          }}
                        >
                          {t('productos.detail.sinHistorial')}
                        </Typography>
                      )}

                      {/* Placeholder para gráfico de evolución */}
                      {priceHistory.length > 1 && (
                        <Box
                          sx={{
                            mt: 3,
                            p: 2,
                            border: '1px dashed',
                            borderColor: 'divider',
                            borderRadius: 1,
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            {t('productos.detail.graficoPreciosPlaceholder')}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ),
                },
              ]}
            />
          );
        })()}

      {/* Modal para visualizar imagen ampliada (Zoom) */}
      <Dialog
        open={!!zoomedImage}
        onClose={() => setZoomedImage(null)}
        maxWidth="lg"
        PaperProps={{
          sx: {
            bgcolor: 'transparent',
            boxShadow: 'none',
            overflow: 'visible',
            borderRadius: 2,
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <IconButton
            onClick={() => setZoomedImage(null)}
            sx={{
              position: 'absolute',
              right: -16,
              top: -16,
              bgcolor: 'background.paper',
              color: 'text.primary',
              boxShadow: 3,
              '&:hover': { bgcolor: 'action.hover' },
              zIndex: 1,
            }}
            size="medium"
          >
            <CloseIcon />
          </IconButton>
          {zoomedImage && (
            <Box
              component="img"
              src={zoomedImage ?? undefined}
              alt={t('productos.detail.zoomAlt')}
              sx={{
                maxWidth: '100%',
                maxHeight: '85vh',
                borderRadius: 2,
                boxShadow: (theme) =>
                  `0 24px 48px ${alpha(theme.palette.common.black, 0.4)}`,
                display: 'block',
              }}
            />
          )}
        </Box>
      </Dialog>
    </Box>
  );
};

export default Productos;
