import React, { useState } from 'react';
import { Box, Paper, IconButton, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable, { Column } from '../components/ui/DataTable';
import ConfirmDialog from '../components/ui/ConfirmDialog';

// Interfaz para los productos
interface Producto {
    id: number;
    nombre: string;
    categoria: string;
    precio: number;
    stock: number;
}

// Datos falsos por ahora
const mockProductos: Producto[] = [
    { id: 1, nombre: 'Manzanas', categoria: 'Frutas', precio: 1.5, stock: 150 },
    { id: 2, nombre: 'Pan de molde', categoria: 'Panadería', precio: 2.1, stock: 45 },
    { id: 3, nombre: 'Leche entera', categoria: 'Lácteos', precio: 0.9, stock: 200 },
    { id: 4, nombre: 'Huevos Docena', categoria: 'Lácteos', precio: 3.2, stock: 80 },
    { id: 5, nombre: 'Detergente Líquido', categoria: 'Limpieza', precio: 8.5, stock: 20 },
];

const Productos: React.FC = () => {
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Producto | null>(null);

    const columns: Column<Producto>[] = [
        { id: 'id', label: 'ID', align: 'center' },
        { id: 'nombre', label: 'Nombre' },
        { id: 'categoria', label: 'Categoría' },
        {
            id: 'precio',
            label: 'Precio',
            align: 'right',
            render: (row) => `${row.precio.toFixed(2)} €`,
        },
        {
            id: 'stock',
            label: 'Stock',
            align: 'right',
            render: (row) => (
                <Typography
                    color={row.stock < 30 ? 'error' : 'text.primary'}
                    fontWeight={row.stock < 30 ? 'bold' : 'normal'}
                >
                    {row.stock}
                </Typography>
            ),
        }
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
                <Typography variant="body1" sx={{ mb: 3 }}>
                    Prueba de componente tabla.
                </Typography>
                <DataTable
                    columns={columns}
                    data={mockProductos}
                    isLoading={isLoading}
                    pagination={{
                        currentPage: page,
                        totalPages: 1,
                        onPageChange: (_, newPage) => setPage(newPage)
                    }}
                    renderActions={renderActions}
                />

                <ConfirmDialog
                    isOpen={!!productToDelete}
                    onClose={() => setProductToDelete(null)}
                    onConfirm={() => {
                        console.log('Se simuló el borrado de:', productToDelete?.nombre);
                        setProductToDelete(null);
                    }}
                    title="Eliminar producto"
                    message={
                        <>
                            ¿Estás seguro de que deseas eliminar el producto <strong>{productToDelete?.nombre}</strong>?
                            Esta acción no se puede deshacer.
                        </>
                    }
                    confirmText="Me aseguro, Borrar"
                    cancelText="Cancelar"
                />
            </Paper>
        </Box>
    );
};

export default Productos;
