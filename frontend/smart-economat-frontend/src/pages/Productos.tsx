import React, { useState, useEffect } from 'react';
import { Box, Paper, IconButton, Typography, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable, { Column } from '../components/ui/DataTable';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Producto } from '../services/producto.types';
import { fetchProductos } from '../services/producto.service';
import { deleteResource } from '../services/api.service';
import { useToast } from '../store/ToastContext';

const Productos: React.FC = () => {
    const [page, setPage] = useState(1);
    const [data, setData] = useState<Producto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [productToDelete, setProductToDelete] = useState<Producto | null>(null);
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

    const columns: Column<Producto>[] = [
        { id: 'nombre', label: 'Nombre' },
        {
            id: 'marca',
            label: 'Marca',
            render: (row) => row.marca ?? '—',
        },
        {
            id: 'tipo',
            label: 'Tipo',
            render: (row) => row.tipo ?? '—',
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
        },
    ];

    const renderActions = (row: Producto) => (
        <>
            <IconButton color="secondary" onClick={() => console.log('Edit', row)} size="small" aria-label="Editar">
                <EditIcon fontSize="small" />
            </IconButton>
            <IconButton color="error" onClick={() => setProductToDelete(row)} size="small" aria-label="Borrar">
                <DeleteIcon fontSize="small" />
            </IconButton>
        </>
    );

    return (
        <Box>
            <Paper elevation={0} sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                    Gestión de Productos
                </Typography>

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
            </Paper>
        </Box>
    );
};

export default Productos;
