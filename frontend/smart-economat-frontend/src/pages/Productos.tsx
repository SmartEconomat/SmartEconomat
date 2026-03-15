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
  Paper,
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
} from '../services/producto.service';
import { deleteResource } from '../services/api.service';
import { useToast } from '../store/toast.hooks';
import StatusChip from '../components/ui/StatusChip';
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
import { ProveedorAsociado } from '../components/ui/ProveedorSelector';

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

  { name: 'codigoBarras', label: 'Código de Barras' },
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
  const toast = useToast();

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

      const payload = {
        nombre: typedFormData.nombre,
        marca: toOptionalString(typedFormData.marca),
        descripcion: toOptionalString(typedFormData.descripcion),
        unidad: normalizeUnidadMedida(typedFormData.unidad),
        tipo: typedFormData.tipo,
        contenido: Number(typedFormData.contenido),
        codigoBarras,
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

      // Recargar datos
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
    if (row.pathImg) editData.imagen = row.pathImg;
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

  const handleEditClick = (row: Producto) => {
    setProductToEdit(buildEditData(row));
  };

  const handleViewClick = (row: Producto) => {
    setProductToView(row);
  };

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
    <>
      <Tooltip title="Ver detalle">
        <IconButton
          onClick={() => handleViewClick(row)}
          size="small"
          aria-label="Ver detalle"
          sx={{ color: 'text.secondary' }}
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Editar">
        <IconButton
          color="secondary"
          onClick={() => handleEditClick(row)}
          size="small"
          aria-label="Editar"
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
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
    </>
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
        totalItems={totalItems}
        totalItemsLabel="productos"
        primaryAction={{
          label: 'Nuevo Producto',
          onClick: () => setProductToEdit({}),
          id: 'btn-nuevo-producto',
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filters={
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
        }
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
          hideTopBar
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
              {!hasSearchOrFilters && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setProductToEdit({})}
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

            return (
              <DetailModal
                isOpen={true}
                onClose={() => setProductToView(null)}
                title={p.nombre}
                subtitle={p.marca || undefined}
                size="md"
                editLabel="Editar producto"
                onEdit={() => {
                  setProductToEdit(buildEditData(p));
                  setProductToView(null);
                }}
                headerMedia={
                  p.pathImg ? (
                    <img
                      src={p.pathImg}
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
                          fields: proveedoresAsociados.map(
                            (pv, idx: number) => ({
                              label:
                                `Proveedor ${proveedoresAsociados.length > 1 ? idx + 1 : ''}`.trim(),
                              value:
                                [
                                  pv.proveedor?.nombre ?? pv.nombre,
                                  pv.marca && `Marca: ${pv.marca}`,
                                  pv.precioUnitario &&
                                    `Precio: ${pv.precioUnitario}€`,
                                  pv.codigoBarras &&
                                    `Cód. Barras: ${pv.codigoBarras}`,
                                ]
                                  .filter(Boolean)
                                  .join(' · ') || '—',
                              fullWidth: true,
                            })
                          ),
                        },
                      ]
                    : []),
                ]}
              />
            );
          })()}
      </Paper>
    </Box>
  );
};

export default Productos;
