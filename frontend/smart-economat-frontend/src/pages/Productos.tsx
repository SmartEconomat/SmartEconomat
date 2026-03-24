/**
 * @fileoverview Página principal para la gestión del catálogo de Productos.
 *
 * Implementa las operaciones CRUD completas y conectadas al backend para manejar
 * el inventario de artículos disponibles. Utiliza DataTable para la visualización
 * y delegación de estado, ProductFilters para las búsquedas complejas,
 * y ventanas flotantes/modales (DetailModal, DynamicFormModal) para creación y detalles.
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import DataTable, { Column } from '../components/ui/DataTable';
import PageToolbar from '../components/ui/PageToolbar';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DynamicFormModal, {
  DynamicField,
} from '../components/ui/DynamicFormModal';
import DetailModal from '../components/ui/DetailModal';
import {
  Producto,
  ProductoAlergeno,
  ProductoProveedor,
  CategoriaProducto,
  UnidadMedida,
  normalizeAlergeno,
  normalizeUnidadMedida,
} from '../services/producto.types';
import {
  fetchProductos,
  createProducto,
  updateProducto,
<<<<<<< HEAD
  getProductoByBarcode,
=======
  fetchHistorialPrecios,
>>>>>>> 5b5bc13 (feat: Se ha implementado el historial de precio de los productos)
} from '../services/producto.service';
import {
  deleteResource,
  resolveStoredFileUrl,
  uploadFile,
} from '../services/api.service';
import { DownloadService } from '../services/download.service';
import { HistorialPrecio } from '../services/producto.types';
import { fetchHistorialPrecios } from '../services/producto.service';
import FilterListIcon from '@mui/icons-material/FilterList';
import { Table, TableHead, TableRow, TableCell, TableBody, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
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
import { fetchProveedores } from '../services/proveedor.service';
import { Proveedor } from '../services/proveedor.types';
import ProductCard from '../features/productos/ProductCard';
import ProductFilters, {
  ProductFiltersState,
} from '../features/productos/ProductFilters';
import { getCategoryIcon } from '../features/productos/utils/getCategoryIcon';
import { EU_ALLERGENS, Allergen } from '../utils/constants';
import ShoppingBasketOutlinedIcon from '@mui/icons-material/ShoppingBasketOutlined';
import AddIcon from '@mui/icons-material/Add';
import BarcodeScanner from '../components/ui/BarcodeScanner';
import {
  searchByBarcode,
  searchByName,
  OFFProduct,
} from '../services/openfoodfacts.service';

type ProductoFormAlergeno = string | Pick<ProductoAlergeno, 'alergeno'>;

interface ProductoFormProveedor {
  proveedorId: string;
  nombre?: string;
  marca?: string;
  codigoBarras?: string;
  precioUnitario?: number | string;
}

interface ProductoFormData extends Record<string, unknown> {
  id?: string;
  nombre?: string;
  marca?: string;
  descripcion?: string;
  unidad?: string;
  tipo?: CategoriaProducto;
  contenido?: number | string;
  codigoBarras?: string;
  alergenos?: ProductoFormAlergeno[];
  proveedores?: ProductoFormProveedor[];
  imagen?: File | string;
}

interface ProveedoresResponse {
  data: Proveedor[];
  totalItems: number;
  itemsPerPage: number;
  totalPages: number;
  page: number;
}

const productoSchema: DynamicField[] = [
  { name: 'nombre', label: 'Nombre Comercial', required: true },
  { name: 'marca', label: 'Marca' },
  { name: 'descripcion', label: 'Descripción' },
  {
    name: 'contenido',
    label: 'Contenido Numérico',
    type: 'number',
    required: true,
  },
  {
    name: 'unidad',
    label: 'Unidad de Medida',
    type: 'select',
    options: [
      { value: UnidadMedida.KG, label: 'Kg' },
      { value: UnidadMedida.G, label: 'Gramo' },
      { value: UnidadMedida.L, label: 'Litro' },
      { value: UnidadMedida.ML, label: 'Mililitro' },
      { value: UnidadMedida.UNIDAD, label: 'Unidad' },
      { value: UnidadMedida.PAQ, label: 'Paquete' },
    ],
    required: true,
    width: 4,
  },
  {
    name: 'tipo',
    label: 'Categoría',
    type: 'select',
    width: 4,
    options: [
      { value: CategoriaProducto.VERDURA, label: 'Verdura' },
      { value: CategoriaProducto.FRUTA, label: 'Fruta' },
      { value: CategoriaProducto.CARNE, label: 'Carne' },
      { value: CategoriaProducto.PESCADO, label: 'Pescado' },
      { value: CategoriaProducto.MARISCO, label: 'Marisco' },
      { value: CategoriaProducto.LACTEO, label: 'Lácteo' },
      { value: CategoriaProducto.HUEVO, label: 'Huevo' },
      { value: CategoriaProducto.CEREAL, label: 'Cereal' },
      { value: CategoriaProducto.LEGUMBRE, label: 'Legumbre' },
      { value: CategoriaProducto.FRUTO_SECO, label: 'Fruto Seco' },
      { value: CategoriaProducto.CONDIMENTO, label: 'Condimento' },
      { value: CategoriaProducto.ACEITE, label: 'Aceite' },
      { value: CategoriaProducto.AZUCAR, label: 'Azúcar' },
      { value: CategoriaProducto.BEBIDA, label: 'Bebida' },
      { value: CategoriaProducto.OTRO, label: 'Otro' },
    ],
  },

  { name: 'codigoBarras', label: 'Código de Barras', type: 'barcode' },
  {
    name: 'imagen',
    label: 'Cargar Imagen',
    type: 'image',
    getFallbackIcon: (formData) =>
      getCategoryIcon(formData.tipo as CategoriaProducto, {
        sx: { fontSize: 80, color: 'text.secondary', opacity: 0.5 },
      }),
  },
  {
    name: 'alergenos',
    label: 'Alérgenos Presentes',
    type: 'allergens',
    position: 'bottom',
  },
];

const initialFilters: ProductFiltersState = {
  categorias: [],
  alergenos: [],
};

const Productos: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ProductFiltersState>(initialFilters);
  const [data, setData] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
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
  const [historyProviderFilter, setHistoryProviderFilter] = useState<string>('all');
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

  const canEdit = usePermission('productos:editar');
  const canDelete = usePermission('productos:eliminar');
  const canCreate = usePermission('productos:crear');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const fallbackProveedores: ProveedoresResponse = {
      data: [],
      totalItems: 0,
      itemsPerPage: 50,
      totalPages: 1,
      page: 1,
    };

    Promise.all([
      fetchProductos(page, pageSize, searchTerm, filters.categorias),
      fetchProveedores(1, 50).catch(() => fallbackProveedores),
    ])
      .then(([productosData, proveedoresData]) => {
        setData(productosData.data);
        setTotalPages(productosData.totalPages);
        setTotalItems(productosData.total);
        setProveedores(proveedoresData.data);
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error
            ? err.message
            : 'Error desconocido al cargar datos.';
        setError(message);
      })
      .finally(() => setIsLoading(false));
  }, [page, pageSize, searchTerm, filters.categorias]);

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
        `Producto "${productToDelete.nombre}" eliminado correctamente.`,
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

  function mapOFFToForm(p: OFFProduct): Record<string, unknown> {
    return {
      nombre: p.name,
      marca: p.brand ?? '',
      descripcion: p.description ?? '',
      unidad: p.uom ?? '',
      contenido: p.quantity ?? '',
      alergenos: p.allergens ?? [],
      imagen: p.imageUrl ?? '',
    };
  }

  const handleBarcodeFetch = async (code: string) => {
    const product = await searchByBarcode(code);
    if (product) return mapOFFToForm(product);
  };

  const handleOFFSearch = async (
    value: string
  ): Promise<Array<Record<string, unknown>>> => {
    const isBarcode = /^\d+$/.test(value.trim());
    if (isBarcode) {
      const product = await searchByBarcode(value);
      return product ? [mapOFFToForm(product)] : [];
    }
    const products = await searchByName(value);
    return products.map(mapOFFToForm);
  };

  const handleSaveProduct = async (formData: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      const typedFormData = formData as ProductoFormData;
      const toOptionalString = (value: unknown): string | undefined => {
        if (value == null) return undefined;
        const trimmedValue = String(value).trim();
        return trimmedValue !== '' ? trimmedValue : undefined;
      };
      const codigoBarras = toOptionalString(typedFormData.codigoBarras);
      const normalizedAlergenos = Array.isArray(typedFormData.alergenos)
        ? typedFormData.alergenos
            .map((alergeno) =>
              normalizeAlergeno(
                typeof alergeno === 'string' ? alergeno : alergeno.alergeno
              )
            )
            .filter(
              (
                alergeno
              ): alergeno is NonNullable<
                ReturnType<typeof normalizeAlergeno>
              > => alergeno !== undefined
            )
        : undefined;

      if (codigoBarras && String(codigoBarras).trim().length > 130) {
        throw new Error(
          'El código de barras no puede superar los 130 caracteres.'
        );
      }

      let finalPathImg: string | undefined = undefined;
      if (typedFormData.imagen instanceof File) {
        try {
          finalPathImg = await uploadFile(typedFormData.imagen);
        } catch {
          throw new Error('Hubo un error al subir la imagen del producto.');
        }
      } else if (
        typeof typedFormData.imagen === 'string' &&
        typedFormData.imagen.trim()
      ) {
        finalPathImg = typedFormData.imagen.trim();
      }

      const payload = {
        nombre: typedFormData.nombre,
        marca: toOptionalString(typedFormData.marca),
        descripcion: toOptionalString(typedFormData.descripcion),
        unidad: normalizeUnidadMedida(typedFormData.unidad),
        tipo: typedFormData.tipo,
        contenido: Number(typedFormData.contenido),
        codigoBarras,
        pathImg: finalPathImg,
        alergenos: normalizedAlergenos,
        proveedores: Array.isArray(typedFormData.proveedores)
          ? typedFormData.proveedores.map((proveedor) => ({
              proveedorId: proveedor.proveedorId,
              marcaEspecifica: toOptionalString(proveedor.marca),
              codigoBarras: toOptionalString(proveedor.codigoBarras),
              precioUnitario: proveedor.precioUnitario
                ? Number(proveedor.precioUnitario)
                : undefined,
            }))
          : [],
      };

      const category = typedFormData.tipo;
      if (typedFormData.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await updateProducto(typedFormData.id, payload as any);
        toast.success('Producto actualizado correctamente.', undefined, {
          productCategory: category,
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await createProducto(payload as any);
        toast.success('Producto creado correctamente.', undefined, {
          productCategory: category,
        });
      }

      await loadData();
      setProductToEdit(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al guardar el producto.';
      toast.error(message, undefined, {
        productCategory: (formData as ProductoFormData).tipo,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const columns: Column<Producto>[] = [
    { id: 'nombre', label: 'Nombre' },
    {
      id: 'marca',
      label: 'Marca',
      render: (row) => row.marca ?? '—',
      hideOnMobile: true,
    },
    {
      id: 'tipo',
      label: 'Tipo',
      render: (row) =>
        row.tipo ? <StatusChip status={row.tipo} variant="outlined" /> : '—',
      hideOnMobile: true,
    },
    {
      id: 'contenido',
      label: 'Contenido',
      align: 'right',
      render: (row) =>
        row.unidad ? `${row.contenido} ${row.unidad}` : `${row.contenido}`,
    },
    {
      id: 'codigoBarras',
      label: 'Cód. Barras',
      render: (row) => row.codigoBarras ?? '—',
      hideOnMobile: true,
    },
  ];

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
        toast.success('Producto localizado. Abriendo su ficha para editar.');
        return;
      }

      if (!canCreate) {
        toast.info(
          'No se encontró el producto. Se dejó el código en la búsqueda.'
        );
        return;
      }

      setProductToEdit(await buildCreateProductDraft(code));
      toast.info(
        'Producto no encontrado. Se abrió el formulario para crearlo.'
      );
    } catch {
      if (!canCreate) {
        toast.error('No se pudo validar el código escaneado.');
        return;
      }

      setProductToEdit(await buildCreateProductDraft(code));
      toast.warning(
        'No se pudo comprobar el catálogo, pero se abrió el alta del producto.'
      );
    }
  };

  const handleEditClick = (row: Producto) => {
    setProductToEdit(buildEditData(row));
  };

  const handleViewClick = (row: Producto) => {
    setProductToView(row);
    setHistoryProviderFilter('all');
  };

  useEffect(() => {
    if (productToView) {
      const loadHistory = async () => {
        setIsLoadingHistory(true);
        try {
          const providerId = historyProviderFilter === 'all' ? undefined : historyProviderFilter;
          const history = await fetchHistorialPrecios(productToView.id, providerId);
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

  const dynamicSchema = React.useMemo(() => {
    const schema = [...productoSchema];
    schema.push({
      name: 'proveedores',
      label: 'Proveedores Asociados',
      type: 'proveedores',
      position: 'bottom',
      defaultValue: [],
      options: proveedores.map((p) => ({ value: p.id, label: p.nombre })),
    });
    return schema;
  }, [proveedores]);

  const renderActions = (row: Producto) => (
    <Stack direction="row" spacing={1} justifyContent="center">
      <Tooltip title="Ver detalle">
        <IconButton
          color="primary"
          onClick={(e) => {
            e.currentTarget.blur();
            handleViewClick(row);
          }}
          size="small"
          aria-label="Ver detalle"
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {canEdit && (
        <Tooltip title="Editar">
          <IconButton
            color="secondary"
            onClick={() => {
              setProductToEdit(buildEditData(row));
            }}
            size="small"
            aria-label="Editar"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {canDelete && (
        <Tooltip title="Eliminar">
          <IconButton
            color="error"
            onClick={() => setProductToDelete(row)}
            size="small"
            aria-label="Borrar"
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
        title="Gestión de Productos"
        searchValue={searchTerm}
        onSearchChange={(v) => {
          setSearchTerm(v);
          setPage(1);
        }}
        searchPlaceholder="Buscar por nombre, marca, código de barras..."
        searchId="search-productos"
        autoFocusSearch={true}
        totalItems={totalItems}
        totalItemsLabel="productos"
        primaryAction={
          canCreate
            ? {
                label: 'Nuevo Producto',
                onClick: () => {
                  setProductToEdit({});
                },
                id: 'btn-nuevo-producto',
              }
            : undefined
        }
        viewMode={viewMode}
        onViewModeChange={setViewMode}
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
        title="Escanear Producto para Buscar"
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
          hideTopBar={false}
          exportHandlers={{
            onExportPdf: handleExportPdf,
            onExportExcel: handleExportExcel,
            exportLabel: 'productos filtrados',
          }}
          viewMode={viewMode}
          defaultViewMode={viewMode}
          emptyStateMessage={
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <ShoppingBasketOutlinedIcon
                sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {hasSearchOrFilters
                  ? 'No hay productos que coincidan con tu búsqueda o filtros'
                  : 'No se encontraron productos'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {hasSearchOrFilters
                  ? 'Prueba con otros términos o limpia los filtros.'
                  : 'Empieza añadiendo el primer producto a tu inventario.'}
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
                  Añadir Producto
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
          title="Eliminar producto"
          message={
            <>
              ¿Estás seguro de que deseas eliminar el producto{' '}
              <strong>{productToDelete?.nombre}</strong>? Esta acción no se
              puede deshacer.
            </>
          }
          confirmText="Sí, eliminar"
          cancelText="Cancelar"
          isLoading={isDeleting}
        />

        <DynamicFormModal
          isOpen={!!productToEdit}
          onClose={() => setProductToEdit(null)}
          title={
            productToEdit?.id
              ? `Editar: ${productToEdit.nombre || ''}`
              : 'Crear Nuevo Producto'
          }
          size="lg"
          fields={dynamicSchema}
          initialData={productToEdit || {}}
          onSubmit={handleSaveProduct}
          isSubmitting={isSaving}
          requireConfirmation={true}
          onBarcodeFetch={handleBarcodeFetch}
          onOFFSearch={handleOFFSearch}
          confirmationMessage={
            productToEdit?.id
              ? '¿Estás seguro de que deseas guardar los cambios realizados en este producto?'
              : '¿Estás seguro de que deseas añadir este nuevo producto al inventario?'
          }
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
                editLabel={canEdit ? 'Editar producto' : undefined}
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
                    title: 'Información general',
                    columns: 3,
                    fields: [
                      {
                        label: 'Tipo',
                        value: p.tipo ? (
                          <StatusChip
                            status={p.tipo}
                            size="small"
                            variant="outlined"
                          />
                        ) : undefined,
                      },
                      {
                        label: 'Contenido',
                        value: `${p.contenido}${p.unidad ? ' ' + p.unidad : ''}`,
                      },
                      {
                        label: 'Código de Barras',
                        value: p.codigoBarras ?? undefined,
                      },
                      {
                        label: 'PMP Actual',
                        value: p.pmp != null ? (
                          <Typography variant="body2" fontWeight={700} color="primary.main">
                            {Number(p.pmp).toFixed(4)} €
                          </Typography>
                        ) : undefined,
                      },
                      {
                        label: 'Descripción',
                        value: p.descripcion ?? undefined,
                        fullWidth: true,
                      },
                    ],
                  },
                  ...(alergenosActivos.length > 0
                    ? [
                        {
                          title: 'Alérgenos',
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
                          title: 'Proveedores asociados',
                          content: (
                            <Stack spacing={1.5}>
                              {proveedoresAsociados.map((pv, idx: number) => (
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
                                      {pv.proveedor?.nombre ??
                                        pv.nombre ??
                                        `Proveedor ${idx + 1}`}
                                    </Typography>
                                    {pv.esOptimo && (
                                      <Chip
                                        label={
                                          pv.ahorroAbsolutoPct != null
                                            ? `Mejor Opción · -${pv.ahorroAbsolutoPct.toFixed(1)}%`
                                            : 'Mejor Opción'
                                        }
                                        size="small"
                                        color="success"
                                      />
                                    )}
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
                                          Precio
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
                                          Merma
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
                                          Coste Real
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
                                          {pv.costeEfectivoUnitario.toFixed(2)}{' '}
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
                                        pv.marca && `Marca: ${pv.marca}`,
                                        pv.codigoBarras &&
                                          `Cód. Barras: ${pv.codigoBarras}`,
                                      ]
                                        .filter(Boolean)
                                        .join(' · ')}
                                    </Typography>
                                  )}
                                </Paper>
                              ))}
                            </Stack>
                          ),
                        },
                      ]
                    : []),
                  {
                    title: 'Histórico de precios',
                    content: (
                      <Box>
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                          <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel id="history-provider-filter-label">Filtro por Proveedor</InputLabel>
                            <Select
                              labelId="history-provider-filter-label"
                              id="history-provider-filter"
                              value={historyProviderFilter}
                              label="Filtro por Proveedor"
                              onChange={(e) => setHistoryProviderFilter(e.target.value)}
                            >
                              <MenuItem value="all">Todos los proveedores</MenuItem>
                              {p.proveedores?.map((pp) => (
                                <MenuItem key={pp.proveedor?.id} value={pp.proveedor?.id}>
                                  {pp.proveedor?.nombre}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>

                        {isLoadingHistory ? (
                          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                            Cargando historial...
                          </Typography>
                        ) : priceHistory.length > 0 ? (
                          <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Proveedor</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }} align="right">Cant.</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }} align="right">Precio</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }} align="center">Doc.</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {priceHistory.map((h) => (
                                  <TableRow key={h.id}>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                      {new Date(h.fecha).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                      {h.productoProveedor?.proveedor?.nombre || '—'}
                                    </TableCell>
                                    <TableCell align="right">
                                      {h.cantidad != null ? Number(h.cantidad).toFixed(2) : '—'}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 500 }}>
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
                          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3, bgcolor: 'action.hover', borderRadius: 1 }}>
                            No hay registros históricos para este producto.
                          </Typography>
                        )}
                        
                        {/* Placeholder para gráfico de evolución */}
                        {priceHistory.length > 1 && (
                          <Box sx={{ mt: 3, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              Estructura preparada para gráfico de evolución de precios
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
