import React, { useState, useEffect } from 'react';
import { Typography, Box, Paper, Card, CardContent, Divider, IconButton, Stack, Button } from '@mui/material';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';

// Icons
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InventoryIcon from '@mui/icons-material/InventoryOutlined';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCartOutlined';
import LocalShippingIcon from '@mui/icons-material/LocalShippingOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmberOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AssignmentIcon from '@mui/icons-material/AssignmentOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import Spinner from '../components/ui/Spinner';

// Dummy API data calls (Replace with real endpoints later)
import { fetchProductos } from '../services/producto.service';
import { fetchProveedores } from '../services/proveedor.service';
import { fetchPedidos } from '../services/pedido.service';

const MetricCard = ({ title, value, icon, color, subtitle }: any) => (
    <Card elevation={0} sx={{ height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                    <Typography color="text.secondary" variant="subtitle2" fontWeight={600} gutterBottom>
                        {title}
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="text.primary">
                        {value}
                    </Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: `${color}.light`, color: `${color}.main`, display: 'flex' }}>
                    {icon}
                </Box>
            </Box>
            {subtitle && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {subtitle}
                </Typography>
            )}
        </CardContent>
    </Card>
);

const QuickAction = ({ title, icon, color, onClick }: any) => (
    <Paper
        elevation={0}
        onClick={onClick}
        sx={{
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
                borderColor: `${color}.main`,
                bgcolor: `${color}.50`,
                transform: 'translateY(-2px)'
            }
        }}
    >
        <Box sx={{ display: 'flex', p: 1, borderRadius: 1, bgcolor: `${color}.main`, color: 'white' }}>
            {icon}
        </Box>
        <Typography variant="subtitle2" fontWeight={600}>{title}</Typography>
    </Paper>
);

const Home: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [metrics, setMetrics] = useState({
        productos: 0,
        proveedores: 0,
        pedidosPendientes: 0,
        alertasStock: 0
    });
    
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            setIsLoading(true);
            try {
                // Fetch basic metrics in parallel
                const [productosData, proveedoresData, pedidosData] = await Promise.all([
                    fetchProductos().catch(() => []),
                    fetchProveedores().catch(() => []),
                    fetchPedidos().catch(() => [])
                ]);

                // Count metrics
                const totalProductos = productosData.length;
                const totalProveedores = proveedoresData.length;
                const pedidosPendientes = pedidosData.filter(p => ['pendiente', 'en_proceso'].includes(p.estado || '')).length;
                
                // For demo: some random low stock alerts based on total products
                const alertas = Math.floor(totalProductos * 0.1);

                setMetrics({
                    productos: totalProductos,
                    proveedores: totalProveedores,
                    pedidosPendientes,
                    alertasStock: alertas
                });
            } catch (error) {
                console.error("Error loading dashboard metrics", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    return (
        <Box>
            <Box mb={4}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Hola, {user?.name || 'Administrador'} 👋
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Aquí tienes un resumen del estado actual del economato.
                </Typography>
            </Box>

            {/* Metrics */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
                <Box>
                    <MetricCard
                        title="Total Productos"
                        value={isLoading ? <Spinner size="sm" /> : metrics.productos}
                        icon={<InventoryIcon />}
                        color="primary"
                        subtitle={<><TrendingUpIcon fontSize="small" color="success" /> +3 agregados este mes</>}
                    />
                </Box>
                <Box>
                    <MetricCard
                        title="Pedidos Pendientes"
                        value={isLoading ? <Spinner size="sm" /> : metrics.pedidosPendientes}
                        icon={<ShoppingCartIcon />}
                        color="warning"
                        subtitle={<><AssignmentIcon fontSize="small" /> 2 por procesar hoy</>}
                    />
                </Box>
                <Box>
                    <MetricCard
                        title="Proveedores Activos"
                        value={isLoading ? <Spinner size="sm" /> : metrics.proveedores}
                        icon={<LocalShippingIcon />}
                        color="info"
                        subtitle={<><CheckCircleOutlineIcon fontSize="small" color="success" /> Catálogo actualizado</>}
                    />
                </Box>
                <Box>
                    <MetricCard
                        title="Alertas de Stock"
                        value={isLoading ? <Spinner size="sm" /> : metrics.alertasStock}
                        icon={<WarningAmberIcon />}
                        color="error"
                        subtitle={<><WarningAmberIcon fontSize="small" color="error" /> Requiere atención</>}
                    />
                </Box>
            </Box>

            {/* Quick Actions & Recent Activity Layout */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
                <Box>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
                        <Typography variant="h6" fontWeight={600} mb={3}>
                            Acciones Rápidas
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <Box>
                                <QuickAction 
                                    title="Nuevo Pedido" 
                                    icon={<ShoppingCartIcon fontSize="small" />} 
                                    color="primary"
                                    onClick={() => navigate('/pedidos')}
                                />
                            </Box>
                            <Box>
                                <QuickAction 
                                    title="Añadir Producto" 
                                    icon={<InventoryIcon fontSize="small" />} 
                                    color="secondary"
                                    onClick={() => navigate('/productos')}
                                />
                            </Box>
                            <Box>
                                <QuickAction 
                                    title="Registrar Recepción" 
                                    icon={<AddCircleOutlineIcon fontSize="small" />} 
                                    color="success"
                                    onClick={() => navigate('/recepcion')}
                                />
                            </Box>
                            <Box>
                                <QuickAction 
                                    title="Nueva Receta" 
                                    icon={<AssignmentIcon fontSize="small" />} 
                                    color="warning"
                                    onClick={() => navigate('/recetas')}
                                />
                            </Box>
                        </Box>
                    </Paper>
                </Box>
                <Box>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
                        <Typography variant="h6" fontWeight={600} mb={3}>
                            Actividad Reciente
                        </Typography>
                        <Stack spacing={3}>
                            {[
                                { title: 'Pedido #1042 creado', time: 'hace 2 horas', type: 'info' },
                                { title: 'Recepción de mercadería completada', time: 'hace 5 horas', type: 'success' },
                                { title: 'Stock bajo en producto "Leche Entera"', time: 'ayer', type: 'warning' },
                                { title: 'Proveedor "Distribuciones Paco" actualizado', time: 'ayer', type: 'info' }
                            ].map((activity, index) => (
                                <Box key={index} display="flex" gap={2}>
                                    <Box sx={{ mt: 0.5, width: 8, height: 8, borderRadius: '50%', bgcolor: `${activity.type}.main`, flexShrink: 0 }} />
                                    <Box>
                                        <Typography variant="body2" fontWeight={500}>{activity.title}</Typography>
                                        <Typography variant="caption" color="text.secondary">{activity.time}</Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Stack>
                        <Box mt={3} textAlign="center">
                            <Button variant="text" size="small" onClick={() => navigate('/movimientos')}>
                                Ver todo el historial
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
};

export default Home;