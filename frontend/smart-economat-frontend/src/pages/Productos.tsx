import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Paper,
    IconButton,
    Typography,
    Alert,
    Button,
    Tooltip,
    TextField,
    InputAdornment,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable, { Column } from '../components/ui/DataTable';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DynamicFormModal, { DynamicField } from '../components/ui/DynamicFormModal';
import { Producto, CategoriaProducto, UnidadMedida } from '../services/producto.types';
import { fetchProductos, createProducto, updateProducto } from '../services/producto.service';
import { deleteResource } from '../services/api.service';
import { useToast } from '../store/ToastContext';
import StatusChip from '../components/ui/StatusChip';
import { fetchProveedores } from '../services/proveedor.service';
import { Proveedor } from '../services/proveedor.types';
import ProductCard from '../features/productos/ProductCard';
import ProductFilters, { ProductFiltersState } from '../features/productos/ProductFilters';
import { getCategoryIcon } from '../features/productos/utils/getCategoryIcon';
import ShoppingBasketOutlinedIcon from '@mui/icons-material/ShoppingBasketOutlined';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/SearchOutlined';

const productoSchema: DynamicField[] = [
    { name: 'nombre', label: 'Nombre Comercial', required: true },
    { name: 'marca', label: 'Marca' },
    { name: 'descripcion', label: 'Descripción' },
    { name: 'contenido', label: 'Contenido Numérico', type: 'number', required: true },
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
            { value: UnidadMedida.PAQ, label: 'Paquete' }
        ],
        required: true,
        width: 4
    },
    {
        name: 'tipo', label: 'Categoría', type: 'select', width: 4, options: [
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
            { value: CategoriaProducto.OTRO, label: 'Otro' }
        ]
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
        position: 'bottom'
    }
];

const initialFilters: ProductFiltersState = {
    categorias: [],
    alergenos: [],
};

const Productos: React.FC = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<ProductFiltersState>(initialFilters);
    const [data, setData] = useState<Producto[]>([]);
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [productToDelete, setProductToDelete] = useState<Producto | null>(null);
    const [productToEdit, setProductToEdit] = useState<Record<string, unknown> | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const toast = useToast();

    const loadData = async () => {
        setIsLoading(true);
        setError(null);

        Promise.all([
            fetchProductos(page, pageSize, searchTerm),
            fetchProveedores(1, 100).catch(() => ({ data: [], totalItems: 0, itemsPerPage: 100, totalPages: 1, page: 1 } as any))
        ])
            .then(([productosData, proveedoresData]) => {
                setData(productosData.data);
                setTotalPages(productosData.totalPages);
                setProveedores(proveedoresData.data);
            })
            .catch((err: unknown) => {
                const message = err instanceof Error ? err.message : 'Error desconocido al cargar datos.';
                setError(message);
            })
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        loadData();
    }, [page, pageSize, searchTerm]);

    useEffect(() => {
        setPage(1);
    }, [filters.categorias, filters.alergenos]);

    const handleDeleteConfirm = async () => {
        if (!productToDelete) return;
        setIsDeleting(true);
        try {
            await deleteResource(`/productos/${productToDelete.id}`);
            setData((prev) => prev.filter((p) => p.id !== productToDelete.id));
            toast.success(`Producto "${productToDelete.nombre}" eliminado correctamente.`, undefined, {
                productCategory: productToDelete.tipo,
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al eliminar el producto.';
            toast.error(message, undefined, { productCategory: productToDelete.tipo });
        } finally {
            setIsDeleting(false);
            setProductToDelete(null);
        }
    };

    const handleSaveProduct = async (formData: Record<string, any>) => {
        setIsSaving(true);
        try {
            const orUndefined = (v: any) => (v && String(v).trim() !== '' ? v : undefined);

            const payload: any = {
                nombre: formData.nombre,
                marca: orUndefined(formData.marca),
                descripcion: orUndefined(formData.descripcion),
                unidad: formData.unidad,
                tipo: formData.tipo,
                contenido: formData.contenido,
                codigoBarras: orUndefined(formData.codigoBarras),
                alergenos: Array.isArray(formData.alergenos)
                    ? formData.alergenos.map((a: any) => typeof a === 'string' ? a : a.alergeno)
                    : undefined,
                proveedores: Array.isArray(formData.proveedores)
                    ? formData.proveedores.map((p: any) => ({
                        proveedorId: p.proveedorId,
                        marca: orUndefined(p.marca),
                        codigoBarras: orUndefined(p.codigoBarras),
                        precioUnitario: p.precioUnitario ? Number(p.precioUnitario) : undefined
                      }))
                    : [],
            };

            const category = formData.tipo as CategoriaProducto | undefined;
            if (formData.id) {
                await updateProducto(formData.id, payload);
                toast.success('Producto actualizado correctamente.', undefined, { productCategory: category });
            } else {
                await createProducto(payload);
                toast.success('Producto creado correctamente.', undefined, { productCategory: category });
            }

            // Recargar datos
            await loadData();
            setProductToEdit(null);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al guardar el producto.';
            toast.error(message, undefined, { productCategory: formData.tipo as CategoriaProducto | undefined });
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
            render: (row) => row.tipo ? <StatusChip status={row.tipo} variant="outlined" /> : '—',
            hideOnMobile: true,
        },
        {
            id: 'contenido',
            label: 'Contenido',
            align: 'right',
            render: (row) =>
                row.unidad
                    ? `${row.contenido} ${row.unidad}`
                    : `${row.contenido}`,
        },
        {
            id: 'codigoBarras',
            label: 'Cód. Barras',
            render: (row) => row.codigoBarras ?? '—',
            hideOnMobile: true,
        },
    ];

    const handleEditClick = (row: Producto) => {
        const editData: Record<string, any> = { ...row };
        if (row.pathImg) editData.imagen = row.pathImg;
        if (row.alergenos) {
            editData.alergenos = row.alergenos.map((a: any) =>
                typeof a === 'string' ? a : (a.alergeno || a)
            );
        }
        if (row.proveedores) {
            editData.proveedores = row.proveedores.map((p: any) => ({
                proveedorId: p.proveedor?.id || p.id,
                nombre: p.proveedor?.nombre || '',
                marca: p.marca || '',
                codigoBarras: p.codigoBarras || '',
                precioUnitario: p.precioUnitario || ''
            }));
        }
        setProductToEdit(editData);
    };

    // filteredData local ya no es necesario ya que se hace filtering en el backend.
    const filteredData = data;

    const dynamicSchema = React.useMemo(() => {
        const schema = [...productoSchema];
        schema.push({
            name: 'proveedores',
            label: 'Proveedores Asociados',
            type: 'proveedores',
            position: 'bottom',
            defaultValue: [],
            options: proveedores.map(p => ({ value: p.id, label: p.nombre })),
        });
        return schema;
    }, [proveedores]);

    const renderActions = (row: Producto) => (
        <>
            <IconButton color="secondary" onClick={() => handleEditClick(row)} size="small" aria-label="Editar">
                <EditIcon fontSize="small" />
            </IconButton>
            <IconButton color="error" onClick={() => setProductToDelete(row)} size="small" aria-label="Borrar">
                <DeleteIcon fontSize="small" />
            </IconButton>
        </>
    );

    const hasActiveFilters =
        (filters.categorias && filters.categorias.length > 0) ||
        (filters.alergenos && filters.alergenos.length > 0);
    const hasSearchOrFilters = searchTerm.trim() !== '' || hasActiveFilters;

    return (
        <Box>
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                    <Typography variant="h6">
                        Gestión de Productos
                    </Typography>

                    <Box display="flex" alignItems="center" gap={1}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setProductToEdit({})}
                            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                        >
                            Nuevo Producto
                        </Button>

                        <Tooltip title="Nuevo Producto">
                            <IconButton
                                color="primary"
                                aria-label="Nuevo Producto"
                                onClick={() => setProductToEdit({})}
                                sx={{
                                    display: { xs: 'inline-flex', sm: 'none' },
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    '&:hover': { bgcolor: 'primary.dark' },
                                }}
                            >
                                <AddIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 2,
                        mb: 2,
                    }}
                >
                    <TextField
                        placeholder="Buscar por nombre, marca, código de barras..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                        size="small"
                        sx={{ minWidth: 200, flex: '1 1 200px' }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <ProductFilters
                        filters={filters}
                        onChange={setFilters}
                        onClear={() => {
                            setFilters(initialFilters);
                            setPage(1);
                        }}
                        inline
                    />
                </Box>

                <DataTable
                    columns={columns}
                    data={filteredData}
                    isLoading={isLoading}
                    defaultViewMode="grid"
                    emptyStateMessage={
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                            <ShoppingBasketOutlinedIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
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
                        pageSizeOptions: [5, 10, 25, 50],
                        onPageSizeChange: (e) => {
                            setPageSize(Number(e.target.value));
                            setPage(1);
                        },
                    }}
                    renderGridItem={(producto) => (
                        <ProductCard
                            producto={producto}
                            onEdit={handleEditClick}
                            onDelete={setProductToDelete}
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
                            <strong>{productToDelete?.nombre}</strong>?{' '}
                            Esta acción no se puede deshacer.
                        </>
                    }
                    confirmText="Sí, eliminar"
                    cancelText="Cancelar"
                    isLoading={isDeleting}
                />

                <DynamicFormModal
                    isOpen={!!productToEdit}
                    onClose={() => setProductToEdit(null)}
                    title={productToEdit?.id ? `Editar: ${productToEdit.nombre || ''}` : "Crear Nuevo Producto"}
                    size="lg"
                    fields={dynamicSchema}
                    initialData={productToEdit || {}}
                    onSubmit={handleSaveProduct}
                    isSubmitting={isSaving}
                    requireConfirmation={true}
                    confirmationMessage={
                        productToEdit?.id
                            ? "¿Estás seguro de que deseas guardar los cambios realizados en este producto?"
                            : "¿Estás seguro de que deseas añadir este nuevo producto al inventario?"
                    }
                />
            </Paper>
        </Box>
    );
};

export default Productos;
