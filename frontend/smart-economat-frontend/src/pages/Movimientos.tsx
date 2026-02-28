import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Alert } from '@mui/material';
import DataTable, { Column } from '../components/ui/DataTable';
import { Movimiento } from '../services/movimiento.types';
import { fetchMovimientos } from '../services/movimiento.service';
import StatusChip from '../components/ui/StatusChip';
import CompareArrowsOutlinedIcon from '@mui/icons-material/CompareArrowsOutlined';

const Movimientos: React.FC = () => {
    const [page, setPage] = useState(1);
    const [data, setData] = useState<Movimiento[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const dataLoad = await fetchMovimientos();
            setData(dataLoad);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error desconocido al cargar movimientos.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const columns: Column<Movimiento>[] = [
        { 
            id: 'fecha', 
            label: 'Fecha',
            render: (row) => row.fecha ? new Date(row.fecha).toLocaleDateString() : '—',
            hideOnMobile: true,
        },
        {
            id: 'tipo',
            label: 'Tipo',
            render: (row) => <StatusChip status={row.tipo} />,
        },
        {
            id: 'cantidad',
            label: 'Cant.',
            align: 'right',
            render: (row) => `${row.cantidad}`,
        },
        {
            id: 'entidad',
            label: 'Origen',
            render: (row) => row.entidad ?? '—',
            hideOnMobile: true,
        },
        {
            id: 'usuario',
            label: 'Usuario',
            render: (row) => row.usuario?.nombre ?? '—',
            hideOnMobile: true,
        }
    ];

    return (
        <Box>
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6">
                        Historial de Movimientos
                    </Typography>
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
                            <CompareArrowsOutlinedIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No hay movimientos
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Aún no se han registrado alteraciones de inventario en el sistema.
                            </Typography>
                        </Box>
                    }
                    pagination={{
                        currentPage: page,
                        totalPages: 1,
                        onPageChange: (_, newPage) => setPage(newPage),
                    }}
                />
            </Paper>
        </Box>
    );
};

export default Movimientos;