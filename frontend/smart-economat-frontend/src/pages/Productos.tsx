/**
 * @fileoverview Página principal para la gestión del catálogo de Productos.
 *
 * Implementa las operaciones CRUD completas y conectadas al backend para manejar
 * el inventario de artículos disponibles. Utiliza DataTable para la visualización
 * y delegación de estado, ProductFilters para las búsquedas complejas,
 * y ventanas flotantes/modales (DetailModal, DynamicFormModal) para creación y detalles.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import DataTable, { Column } from '../components/ui/DataTable';
import PageToolbar from '../components/ui/PageToolbar';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DetailModal from '../components/ui/DetailModal';
import ProductoFormModal from '../features/productos/ProductoFormModal';
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
  fetchHistorialPrecios,
} from '../services/producto.service';
import { deleteResource, resolveStoredFileUrl } from '../services/api.service';
import { DownloadService } from '../services/download.service';
import { HistorialPrecio } from '../services/producto.types';
import { getProductoByBarcode } from '../services/producto.service';

import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
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
import ProductFilters, {
  ProductFiltersState,
} from '../features/productos/ProductFilters';
import { EU_ALLERGENS, Allergen } from '../utils/constants';
import { getCategoryIcon } from '../features/productos/utils/getCategoryIcon';
import ShoppingBasketOutlinedIcon from '@mui/icons-material/ShoppingBasketOutlined';
import AddIcon from '@mui/icons-material/Add';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import BarcodeScanner from '../components/ui/BarcodeScanner';
import { searchByBarcode } from '../services/openfoodfacts.service';

const initialFilters: ProductFiltersState = {
  categorias: [],
  alergenos: [],
};

const resolveProveedorId = (proveedor: ProductoProveedor): string | undefined =>
  proveedor.proveedor?.id ?? proveedor.proveedorId;

const Productos: React.FC = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string | undefined>('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<ProductFiltersState>(initialFilters);
  const [data, setData] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Producto | null>(null);
  const [productToEdit, setProductToEdit] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [productToView, setProductToView] = useState<Producto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchScannerOpen, setIsSearchScannerOpen] = useState(false);
  const [priceHistory, setPriceHistory] = useState<HistorialPrecio[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyProviderFilter, setHistoryProviderFilter] =
    useState<string>('all');
  const historySectionRef = useRef<HTMLDivElement | null>(null);
  const toast = useToast();

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
    setIsLoading(true);
    setError(null);

    fetchProductos(
      page,
      pageSize,
      searchTerm,
      filters.categorias,
      sortBy,
      sortOrder
    )
      .then((productosData) => {
        setData(productosData.data);
        setTotalPages(productosData.totalPages);
        setTotalItems(productosData.total);
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : t('productos.toast.loadError');
        setError(message);
      })
      .finally(() => setIsLoading(false));
  }, [page, pageSize, searchTerm, filters.categorias, sortBy, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filters.categorias, filters.alergenos]);

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await deleteResource(`/productos/${productToDelete.id}`);
      setData((prev) => prev.filter((p) => p.id !== productToDelete.id));
      toast.success(
        t('productos.toast.deleted', { name: productToDelete.nombre }),
        undefined,
        {
          productCategory: productToDelete.tipo,
        }
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('productos.toast.deleteError');
      toast.error(message, undefined, {
        productCategory: productToDelete.tipo,
      });
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  const handleSaveProduct = async (formData: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      const payload = await buildProductoPayload(formData);
      const category = (formData as { tipo?: CategoriaProducto }).tipo;

      if (formData.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await updateProducto(formData.id as string, payload as any);
        toast.success(t('productos.toast.updated'), undefined, {
          productCategory: category,
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await createProducto(payload as any);
        toast.success(t('productos.toast.created'), undefined, {
          productCategory: category,
        });
      }

      await loadData();
      setProductToEdit(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('productos.toast.saveError');
      toast.error(message, undefined, {
        productCategory: (formData as { tipo?: CategoriaProducto }).tipo,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const columns: Column<Producto>[] = [
    { id: 'nombre', label: t('productos.columns.nombre'), sortable: true },
    {
      id: 'marca',
      label: t('productos.columns.marca'),
      render: (row) => row.marca ?? '—',
      hideOnMobile: true,
      sortable: true,
    },
    {
      id: 'tipo',
      label: t('productos.columns.tipo'),
      render: (row) =>
        row.tipo ? <StatusChip status={row.tipo} variant="outlined" /> : '—',
      hideOnMobile: true,
      sortable: true,
    },
    {
      id: 'contenido',
      label: t('productos.columns.contenido'),
      align: 'right',
      render: (row) =>
        row.unidad ? `${row.contenido} ${row.unidad}` : `${row.contenido}`,
    },
    {
      id: 'codigoBarras',
      label: t('productos.columns.codigoBarras'),
      render: (row) => row.codigoBarras ?? '—',
      hideOnMobile: true,
      sortable: true,
    },
  ];

  const handleSort = (key: string | keyof Producto) => {
    const isAsc = sortBy === key && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(key as string);
  };

  const buildEditData = (row: Producto): Record<string, unknown> => {
    const editData: Record<string, unknown> = { ...row };
    if (row.pathImg) editData.imagen = resolveStoredFileUrl(row.pathImg);
    if (row.alergenos) {
      editData.alergenos = row.alergenos.map((alergeno) =>
        typeof alergeno === 'string' ? alergeno : alergeno.alergeno || alergeno
      );
    }
    if (row.proveedores) {
      editData.proveedores = row.proveedores.map(
        (proveedor: ProductoProveedor) => ({
          proveedorId: proveedor.proveedor?.id || proveedor.id,
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

    setSearchTerm(code);
    setPage(1);

    try {
      const existingProduct = await getProductoByBarcode(code);

      if (existingProduct) {
        setProductToEdit(buildEditData(existingProduct));
        toast.success(t('productos.toast.scanFound'));
        return;
      }

      if (!canCreate) {
        toast.info(t('productos.toast.scanNotFound'));
        return;
      }

      setProductToEdit(await buildCreateProductDraft(code));
      toast.info(t('productos.toast.scanOpenCreate'));
    } catch {
      if (!canCreate) {
        toast.error(t('productos.toast.scanValidateError'));
        return;
      }

      setProductToEdit(await buildCreateProductDraft(code));
      toast.warning(t('productos.toast.scanCatalogError'));
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
        } catch (error) {
          console.error('Error fetching price history:', error);
        } finally {
          setIsLoadingHistory(false);
        }
      };
      loadHistory();
    } else {
      setPriceHistory([]);
    }
  }, [productToView, historyProviderFilter]);

  const renderActions = (row: Producto) => (
    <Stack direction="row" spacing={1} justifyContent="center">
      <Tooltip title={t('productos.actions.view')}>
        <IconButton
          color="primary"
          onClick={(e) => {
            e.currentTarget.blur();
            handleViewClick(row);
          }}
          size="small"
          aria-label={t('productos.actions.view')}
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {canEdit && (
        <Tooltip title={t('productos.actions.edit')}>
          <IconButton
            color="secondary"
            onClick={() => {
              setProductToEdit(buildEditData(row));
            }}
            size="small"
            aria-label={t('productos.actions.edit')}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {canDelete && (
        <Tooltip title={t('productos.actions.delete')}>
          <IconButton
            color="error"
            onClick={() => setProductToDelete(row)}
            size="small"
            aria-label={t('productos.actions.delete')}
          >
            <DeleteIcon fontSize="small" />
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
      <PageToolbar
        title={t('productos.pageTitle')}
        searchValue={searchTerm}
        onSearchChange={(v) => {
          setSearchTerm(v);
          setPage(1);
        }}
        searchPlaceholder={t('productos.searchPlaceholder')}
        searchId="search-productos"
        autoFocusSearch={true}
        totalItems={totalItems}
        totalItemsLabel={t('productos.totalItemsLabel')}
        primaryAction={
          canCreate
            ? {
                label: t('productos.newProduct'),
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
            label: t('productos.exportPdf'),
            onClick: () => {
              void handleExportPdf();
            },
            icon: <PictureAsPdfOutlinedIcon />,
            id: 'btn-exportar-productos-pdf',
            color: 'error',
            variant: 'outlined',
          },
          {
            label: t('productos.exportExcel'),
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
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <ProductFilters
              filters={filters}
              onChange={(newFilters) => {
                setFilters(newFilters);
                setPage(1);
              }}
              onClear={() => {
                setFilters(initialFilters);
                setPage(1);
              }}
              inline
            />
          </Box>
        }
        onScanBarcode={() => setIsSearchScannerOpen(true)}
      />

      <BarcodeScanner
        open={isSearchScannerOpen}
        onClose={() => setIsSearchScannerOpen(false)}
        onScan={(code) => {
          void handleSearchScannerResult(code);
        }}
        title={t('productos.scannerTitle')}
      />

      <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        {error && (
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
          onSort={handleSort}
          sortConfig={{ key: sortBy || '', direction: sortOrder }}
          emptyStateMessage={
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <ShoppingBasketOutlinedIcon
                sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {hasSearchOrFilters
                  ? t('productos.empty.withFilters')
                  : t('productos.empty.noProducts')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {hasSearchOrFilters
                  ? t('productos.empty.withFiltersHint')
                  : t('productos.empty.noProductsHint')}
              </Typography>
              {!hasSearchOrFilters && canCreate && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setProductToEdit({});
                  }}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                  }}
                >
                  {t('productos.empty.addProduct')}
                </Button>
              )}
            </Box>
          }
          pagination={{
            currentPage: page,
            totalPages: totalPages,
            onPageChange: (_, newPage) => setPage(newPage),
            pageSize: pageSize,
            pageSizeOptions: [4, 8, 12, 24],
            onPageSizeChange: (e: SelectChangeEvent<number>) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            },
          }}
          renderGridItem={(producto) => (
            <ProductCard
              producto={producto}
              onEdit={handleEditClick}
              onDelete={setProductToDelete}
              onView={handleViewClick}
            />
          )}
          renderActions={renderActions}
        />

        <ConfirmDialog
          isOpen={!!productToDelete}
          onClose={() => !isDeleting && setProductToDelete(null)}
          onConfirm={() => void handleDeleteConfirm()}
          title={t('productos.deleteDialog.title')}
          message={
            <>
              {t('productos.deleteDialog.messagePre')}{' '}
              <strong>{productToDelete?.nombre}</strong>
              {t('productos.deleteDialog.messagePost')}
            </>
          }
          confirmText={t('productos.deleteDialog.confirm')}
          cancelText={t('productos.deleteDialog.cancel')}
          isLoading={isDeleting}
        />

        <ProductoFormModal
          isOpen={!!productToEdit}
          onClose={() => setProductToEdit(null)}
          initialData={productToEdit || {}}
          onSubmit={handleSaveProduct}
          isSubmitting={isSaving}
        />

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
                  canEdit ? t('productos.detail.editLabel') : undefined
                }
                onEdit={
                  canEdit
                    ? () => {
                        setProductToEdit(buildEditData(p));
                        setProductToView(null);
                      }
                    : undefined
                }
                headerMedia={
                  imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={p.nombre}
                      style={{ height: 160, objectFit: 'cover', width: '100%' }}
                    />
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
                    title: t('productos.detail.sectionGeneral'),
                    columns: 3,
                    fields: [
                      {
                        label: t('productos.detail.fieldTipo'),
                        value: p.tipo ? (
                          <StatusChip
                            status={p.tipo}
                            size="small"
                            variant="outlined"
                          />
                        ) : undefined,
                      },
                      {
                        label: t('productos.detail.fieldContenido'),
                        value: `${p.contenido}${p.unidad ? ' ' + p.unidad : ''}`,
                      },
                      {
                        label: t('productos.detail.fieldCodBarras'),
                        value: p.codigoBarras ?? undefined,
                      },
                      {
                        label: t('productos.detail.fieldPmp'),
                        value:
                          p.pmp != null ? (
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              color="primary.main"
                            >
                              {Number(p.pmp).toFixed(4)} €
                            </Typography>
                          ) : undefined,
                      },
                      {
                        label: t('productos.detail.fieldDescripcion'),
                        value: p.descripcion ?? undefined,
                        fullWidth: true,
                      },
                    ],
                  },
                  ...(alergenosActivos.length > 0
                    ? [
                        {
                          title: t('productos.detail.sectionAlergenos'),
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
                          title: t('productos.detail.sectionProveedores'),
                          content: (
                            <Stack spacing={1.5}>
                              {proveedoresAsociados.map((pv, idx: number) => {
                                const providerId = resolveProveedorId(pv);
                                const providerName =
                                  pv.proveedor?.nombre ??
                                  pv.nombre ??
                                  t('productos.detail.proveedorFallback', {
                                    n: idx + 1,
                                  });

                                return (
                                  <Paper
                                    key={pv.id || idx}
                                    variant="outlined"
                                    sx={{
                                      p: 2,
                                      borderColor: pv.esOptimo
                                        ? 'success.main'
                                        : 'divider',
                                      bgcolor: pv.esOptimo
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
                                        {pv.esOptimo && (
                                          <Chip
                                            label={
                                              pv.ahorroAbsolutoPct != null
                                                ? t(
                                                    'productos.detail.mejorOpcionConAhorro',
                                                    {
                                                      pct: pv.ahorroAbsolutoPct.toFixed(
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
                                            'productos.detail.verHistoricoProveedor'
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
                                                'productos.detail.verHistoricoAriaLabel',
                                                { name: providerName }
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
                                      {pv.precioUnitario != null && (
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
                                            {t('productos.detail.fieldPrecio')}
                                          </Typography>
                                          <Typography variant="body2">
                                            {pv.precioUnitario.toFixed(2)} €
                                          </Typography>
                                        </Box>
                                      )}
                                      {pv.mermaEsperada != null && (
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
                                            {t('productos.detail.fieldMerma')}
                                          </Typography>
                                          <Typography variant="body2">
                                            {pv.mermaEsperada.toFixed(1)} %
                                          </Typography>
                                        </Box>
                                      )}
                                      {pv.costeEfectivoUnitario != null && (
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
                                            {t(
                                              'productos.detail.fieldCosteReal'
                                            )}
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            sx={{
                                              fontWeight: 700,
                                              color: pv.esOptimo
                                                ? 'success.main'
                                                : 'text.primary',
                                            }}
                                          >
                                            {pv.costeEfectivoUnitario.toFixed(
                                              2
                                            )}{' '}
                                            €
                                          </Typography>
                                        </Box>
                                      )}
                                    </Box>
                                    {(pv.marca || pv.codigoBarras) && (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ mt: 1, display: 'block' }}
                                      >
                                        {[
                                          pv.marca &&
                                            t('productos.detail.marcaLabel', {
                                              value: pv.marca,
                                            }),
                                          pv.codigoBarras &&
                                            t(
                                              'productos.detail.codBarrasLabel',
                                              { value: pv.codigoBarras }
                                            ),
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
                    title: t('productos.detail.sectionHistorico'),
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
                                      t('productos.detail.proveedorFallback', {
                                        n: '',
                                      })}
                                  </MenuItem>
                                );
                              })}
                            </Select>
                          </FormControl>
                        </Box>

                        {isLoadingHistory ? (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            align="center"
                            sx={{ py: 3 }}
                          >
                            {t('productos.detail.cargandoHistorial')}
                          </Typography>
                        ) : priceHistory.length > 0 ? (
                          <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 600 }}>
                                    {t('productos.detail.historialColFecha')}
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>
                                    {t(
                                      'productos.detail.historialColProveedor'
                                    )}
                                  </TableCell>
                                  <TableCell
                                    sx={{ fontWeight: 600 }}
                                    align="right"
                                  >
                                    {t('productos.detail.historialColCantidad')}
                                  </TableCell>
                                  <TableCell
                                    sx={{ fontWeight: 600 }}
                                    align="right"
                                  >
                                    {t('productos.detail.historialColPrecio')}
                                  </TableCell>
                                  <TableCell
                                    sx={{ fontWeight: 600 }}
                                    align="center"
                                  >
                                    {t('productos.detail.historialColDoc')}
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {priceHistory.map((h) => (
                                  <TableRow key={h.id}>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                      {new Date(h.fecha).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                      {h.productoProveedor?.proveedor?.nombre ||
                                        '—'}
                                    </TableCell>
                                    <TableCell align="right">
                                      {h.cantidad != null
                                        ? Number(h.cantidad).toFixed(2)
                                        : '—'}
                                    </TableCell>
                                    <TableCell
                                      align="right"
                                      sx={{ fontWeight: 500 }}
                                    >
                                      {Number(h.precio).toFixed(4)} €
                                    </TableCell>
                                    <TableCell align="center">
                                      {h.documentoOrigen || '—'}
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
                            {t('productos.detail.historialVacio')}
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
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {t(
                                'productos.detail.historialGraficoPlaceholder'
                              )}
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
      </Paper>
    </Box>
  );
};

export default Productos;
