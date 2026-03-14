import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Alert,
    Button
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import InventoryIcon from '@mui/icons-material/Inventory';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { RecepcionResultado } from '../../services/recepcion.types';
import DetailModal, { DetailType } from './DetailModal';

interface PasoResultadoProps {
    resultado: RecepcionResultado | null;
    onResetWizard: () => void;
}

const PasoResultado: React.FC<PasoResultadoProps> = ({ resultado, onResetWizard }) => {
    const [openDetailModal, setOpenDetailModal] = React.useState<DetailType>(null);

    const StatCard = ({ title, value, subtitle, icon, color, onClick }: any) => (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                    borderColor: color,
                    boxShadow: `0 4px 12px ${color}20`,
                    transform: 'translateY(-2px)'
                },
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                position: 'relative',
                overflow: 'hidden'
            }}
            onClick={onClick}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                    {title}
                </Typography>
                <Box sx={{
                    bgcolor: color,
                    color: 'white',
                    borderRadius: 2,
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40
                }}>
                    {icon}
                </Box>
            </Box>
            <Typography variant="h3" fontWeight={700} sx={{ mb: 1 }}>
                {value}
            </Typography>
            {subtitle && (
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUpIcon fontSize="small" color="success" /> {subtitle}
                </Typography>
            )}
        </Paper>
    );

    return (
        <Box textAlign="center" sx={{ py: 3 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" gutterBottom>¡Recepción Registrada con éxito!</Typography>
            <Typography variant="body1" color="text.secondary">ID Registro: {resultado?.id}</Typography>

            <Box sx={{ mt: 4, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 3 }}>

                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(240px, 1fr))' },
                    gap: 2
                }}>
                    <StatCard
                        title="Total Movimientos"
                        value={resultado?.movimientosGenerados || 0}
                        subtitle="registrados autom."
                        icon={<ReceiptLongIcon />}
                        color="#E91E63" // Pink
                        onClick={() => setOpenDetailModal('movimientos')}
                    />
                    <StatCard
                        title="Lotes Creados (FEFO)"
                        value={resultado?.inventariosCreados || 0}
                        subtitle="disponibles en almacén"
                        icon={<InventoryIcon />}
                        color="#FF9800" // Orange
                        onClick={() => setOpenDetailModal('inventarios')}
                    />
                    {resultado?.productosCreados && resultado.productosCreados.length > 0 && (
                        <StatCard
                            title="Productos Nuevos"
                            value={resultado.productosCreados.length}
                            subtitle="añadidos al catálogo"
                            icon={<FiberNewIcon />}
                            color="#2196F3" // Blue
                            onClick={() => setOpenDetailModal('nuevos_productos')}
                        />
                    )}
                </Box>

                {resultado?.incidencias && resultado.incidencias.length > 0 && (
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                        <Typography variant="subtitle1" color="error" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WarningAmberIcon /> Se han generado {resultado.incidencias.length} incidencias automáticas
                        </Typography>
                        {resultado.incidencias.map((inc, i) => (
                            <Alert key={i} severity="warning" sx={{ mt: 1 }}>
                                {inc.datosOriginales.productos.length} productos con discrepancia en pedido de {inc.id.substring(0, 8)}...
                            </Alert>
                        ))}
                    </Paper>
                )}

                <Alert severity="info" icon={<SaveIcon />}>Toda la trazabilidad ha sido volcada y los pedidos elásticos han actualizado su estado.</Alert>
            </Box>

            <Button variant="contained" onClick={onResetWizard} sx={{ mt: 4 }} size="large">Nueva Recepción</Button>

            <DetailModal
                open={openDetailModal !== null}
                type={openDetailModal}
                resultado={resultado}
                onClose={() => setOpenDetailModal(null)}
            />
        </Box>
    );
};

export default PasoResultado;
