import React, { useState, useEffect } from 'react';
import { Box, Paper, IconButton, Typography, Alert, Button, Tooltip, Fab } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable, { Column } from '../components/ui/DataTable';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DynamicFormModal, { DynamicField } from '../components/ui/DynamicFormModal';
import { Producto, CategoriaProducto, UnidadMedida } from '../services/producto.types';
import { fetchProductos, createProducto, updateProducto } from '../services/producto.service';
import { deleteResource } from '../services/api.service';
import { cleanPayload } from '../services/api.utils';
import { useToast } from '../store/ToastContext';
import StatusChip from '../components/ui/StatusChip';

import FastfoodOutlinedIcon from '@mui/icons-material/FastfoodOutlined';
import LocalDrinkOutlinedIcon from '@mui/icons-material/LocalDrinkOutlined';
import SanitizerOutlinedIcon from '@mui/icons-material/SanitizerOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import ShoppingBasketOutlinedIcon from '@mui/icons-material/ShoppingBasketOutlined';
import AddIcon from '@mui/icons-material/Add';

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
    { name: 'fechaCaducidad', label: 'Fecha de Caducidad', type: 'date', width: 4 },
    { name: 'codigoBarras', label: 'Código de Barras' },
    {
        name: 'imagen',
        label: 'Cargar Imagen',
        type: 'image',
        getFallbackIcon: (formData) => {
            const tipo = formData.tipo as CategoriaProducto;
            const iconProps = { sx: { fontSize: 80, color: 'text.secondary', opacity: 0.5 } };

            if (tipo === CategoriaProducto.LACTEO || tipo === CategoriaProducto.BEBIDA) return <LocalDrinkOutlinedIcon {...iconProps} />;
            if (tipo === CategoriaProducto.CARNE || tipo === CategoriaProducto.PESCADO || tipo === CategoriaProducto.MARISCO || tipo === CategoriaProducto.HUEVO) return <FastfoodOutlinedIcon {...iconProps} />;
            if (tipo === CategoriaProducto.VERDURA || tipo === CategoriaProducto.FRUTA || tipo === CategoriaProducto.CEREAL || tipo === CategoriaProducto.LEGUMBRE || tipo === CategoriaProducto.FRUTO_SECO) return <ShoppingBasketOutlinedIcon {...iconProps} />;
            return <CategoryOutlinedIcon {...iconProps} />;
        }
    },
    {
        name: 'alergenos',
        label: 'Alérgenos Presentes',
        type: 'allergens',
        position: 'bottom'
    }
];

const Productos: React.FC = () => {
    const [page, setPage] = useState(1);
    const [data, setData] = useState<Producto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [productToDelete, setProductToDelete] = useState<Producto | null>(null);
    const [productToEdit, setProductToEdit] = useState<Record<string, any> | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const toast = useToast();

    useEffect(() => {
        setIsLoading(true);
        setError(null);
        fetchProductos()
            .then(setData)
            .catch((err: unknown) => {
                const message = err instanceof Error ? err.message : 'Error desconocido al cargar productos.';
                setError(message);
            })
            .finally(() => setIsLoading(false));
    }, []);

    const handleDeleteConfirm = async () => {
        if (!productToDelete) return;
        setIsDeleting(true);
        try {
            await deleteResource(`/productos/${productToDelete.id}`);
            setData((prev) => prev.filter((p) => p.id !== productToDelete.id));
            toast.success(`Producto "${productToDelete.nombre}" eliminado correctamente.`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al eliminar el producto.';
            toast.error(message);
        } finally {
            setIsDeleting(false);
            setProductToDelete(null);
        }
    };

    const handleSaveProduct = async (formData: Record<string, any>) => {
        setIsSaving(true);
        try {
            // Preparar datos para el backend
            // Solo enviamos los campos que el DTO del backend espera
            const payload: any = {
                nombre: formData.nombre,
                marca: formData.marca,
                descripcion: formData.descripcion,
                unidad: formData.unidad,
                tipo: formData.tipo,
                contenido: formData.contenido,
                codigoBarras: formData.codigoBarras,
                // Normalizar fecha: el input devuelve YYYY-MM-DD, pero si viene
                // de la BD puede ser ISO completo. Tomamos solo los primeros 10 chars.
                fechaCaducidad: formData.fechaCaducidad
                    ? String(formData.fechaCaducidad).substring(0, 10)
                    : undefined,
                alergenos: Array.isArray(formData.alergenos)
                    ? formData.alergenos.map((a: any) => typeof a === 'string' ? a : a.alergeno)
                    : undefined,
            };
            
            // Eliminar campos vacíos o nulos si es necesario, 
            // aunque el backend los maneja con @IsOptional()
            
            if (formData.id) {
                await updateProducto(formData.id, payload);
                toast.success('Producto actualizado correctamente.');
            } else {
                await createProducto(payload);
                toast.success('Producto creado correctamente.');
            }
            
            // Recargar datos
            const updatedData = await fetchProductos();
            setData(updatedData);
            setProductToEdit(null);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al guardar el producto.';
            toast.error(message);
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
            render: (row) => row.tipo ?? '—',
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
        setProductToEdit(editData);
    };

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

    return (
        <Box>
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6">
                        Gestión de Productos
                    </Typography>

                    {/* Desktop Button */}
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setProductToEdit({})}
                        sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                    >
                        Nuevo Producto
                    </Button>

                    {/* Mobile Button */}
                    <Tooltip title="Nuevo Producto">
                        <IconButton
                            color="primary"
                            onClick={() => setProductToEdit({})}
                            sx={{
                                display: { xs: 'inline-flex', sm: 'none' },
                                bgcolor: 'primary.main',
                                color: 'white',
                                '&:hover': { bgcolor: 'primary.dark' }
                            }}
                        >
                            <AddIcon />
                        </IconButton>
                    </Tooltip>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <DataTable
                    columns={columns}
                    data={data}
                    isLoading={isLoading}
                    emptyStateMessage={
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                            <ShoppingBasketOutlinedIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No se encontraron productos
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Empieza añadiendo el primer producto a tu inventario.
                            </Typography>
                            <Button 
                                variant="outlined" 
                                startIcon={<AddIcon />}
                                onClick={() => setProductToEdit({})}
                            >
                                Añadir Producto
                            </Button>
                        </Box>
                    }
                    pagination={{
                        currentPage: page,
                        totalPages: 1,
                        onPageChange: (_, newPage) => setPage(newPage),
                    }}
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
                    confirmText={isDeleting ? 'Eliminando…' : 'Sí, eliminar'}
                    cancelText="Cancelar"
                />

                <DynamicFormModal
                    isOpen={!!productToEdit}
                    onClose={() => setProductToEdit(null)}
                    title={productToEdit?.id ? `Editar: ${productToEdit.nombre || ''}` : "Crear Nuevo Producto"}
                    size="lg"
                    fields={productoSchema}
                    initialData={productToEdit || {}}
                    onSubmit={handleSaveProduct}
                    isSubmitting={isSaving}
                />
            </Paper>
        </Box>
    );
};

export default Productos;
