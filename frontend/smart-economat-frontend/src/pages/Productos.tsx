import React, { useState, useEffect } from 'react';
import { Box, Paper, IconButton, Typography, Alert, Button, Tooltip, Fab } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable, { Column } from '../components/ui/DataTable';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DynamicFormModal, { DynamicField } from '../components/ui/DynamicFormModal';
import { Producto, CategoriaProducto, UnidadMedida } from '../services/producto.types';
import { fetchProductos } from '../services/producto.service';
import { deleteResource } from '../services/api.service';
import { useToast } from '../store/ToastContext';

import FastfoodOutlinedIcon from '@mui/icons-material/FastfoodOutlined';
import LocalDrinkOutlinedIcon from '@mui/icons-material/LocalDrinkOutlined';
import SanitizerOutlinedIcon from '@mui/icons-material/SanitizerOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import ShoppingBasketOutlinedIcon from '@mui/icons-material/ShoppingBasketOutlined';
import AddIcon from '@mui/icons-material/Add';

const productoSchema: DynamicField[] = [
    { name: 'nombre', label: 'Nombre Comercial', required: true },
    { name: 'marca', label: 'Marca' },
    { name: 'contenido', label: 'Contenido Numérico', type: 'number', required: true },
    {
        name: 'unidad',
        label: 'Unidad de Medida',
        type: 'select',
        options: [
            { value: UnidadMedida.KILOGRAMO, label: 'Kg' },
            { value: UnidadMedida.LITRO, label: 'Litro' },
            { value: UnidadMedida.UNIDAD, label: 'Uds' }
        ],
        required: true,
        width: 4
    },
    {
        name: 'tipo', label: 'Categoría', type: 'select', width: 4, options: [
            { value: CategoriaProducto.PERECEDERO, label: 'Perecedero / Alimento' },
            { value: CategoriaProducto.LACTEO, label: 'Lácteo / Bebida' },
            { value: CategoriaProducto.LIMPIEZA, label: 'Limpieza' },
            { value: CategoriaProducto.NO_PERECEDERO, label: 'No Perecedero' },
            { value: CategoriaProducto.OTROS, label: 'Otros' }
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

            if (tipo === CategoriaProducto.LACTEO) return <LocalDrinkOutlinedIcon {...iconProps} />;
            if (tipo === CategoriaProducto.PERECEDERO) return <FastfoodOutlinedIcon {...iconProps} />;
            if (tipo === CategoriaProducto.LIMPIEZA) return <SanitizerOutlinedIcon {...iconProps} />;
            if (tipo === CategoriaProducto.NO_PERECEDERO) return <ShoppingBasketOutlinedIcon {...iconProps} />;
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
    const [productToEdit, setProductToEdit] = useState<Partial<Producto> | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
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
        console.log("Datos del formulario guardados:", formData);
        toast.info("Prueba de Modal completada. Datos en consola.");
        setProductToEdit(null);
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

    const renderActions = (row: Producto) => (
        <>
            <IconButton color="secondary" onClick={() => setProductToEdit(row)} size="small" aria-label="Editar">
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
                />
            </Paper>
        </Box>
    );
};

export default Productos;
