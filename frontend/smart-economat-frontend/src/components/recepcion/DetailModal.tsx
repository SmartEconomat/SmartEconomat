import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    List,
    ListItem,
    ListItemText,
    Alert,
    Box
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { RecepcionResultado } from '../../services/recepcion.types';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import InventoryIcon from '@mui/icons-material/Inventory';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

export type DetailType = 'movimientos' | 'inventarios' | 'nuevos_productos' | null;

interface DetailModalProps {
    open: boolean;
    type: DetailType;
    resultado: RecepcionResultado | null;
    onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ open, type, resultado, onClose }) => {
    const navigate = useNavigate();

    if (!resultado) return null;

    const renderContent = () => {
        switch (type) {
            case 'movimientos':
                return (
                    <Box>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Se registraron <strong>{resultado.movimientosGenerados}</strong> movimientos de almacén de tipo Entrada.
                        </Alert>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            * El detalle individual de cada movimiento está consolidado en el historial general del módulo de Inventario.
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<SwapHorizIcon />}
                                onClick={() => {
                                    onClose();
                                    navigate('/inventario/movimientos');
                                }}
                            >
                                Ver Historial de Movimientos
                            </Button>
                        </Box>
                    </Box>
                );
            case 'inventarios':
                return (
                    <Box>
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Se crearon <strong>{resultado.inventariosCreados}</strong> lotes en el inventario físico bajo la política FEFO.
                        </Alert>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            * Los nuevos lotes ya están disponibles para consumo y asignación en órdenes de trabajo.
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Button
                                variant="outlined"
                                color="success"
                                startIcon={<InventoryIcon />}
                                onClick={() => {
                                    onClose();
                                    navigate('/inventario');
                                }}
                            >
                                Ver Lotes de Inventario
                            </Button>
                        </Box>
                    </Box>
                );
            case 'nuevos_productos':
                return (
                    <Box>
                        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FiberNewIcon color="primary" /> {resultado.productosCreados.length} Productos Desconocidos Añadidos
                        </Typography>
                        <List sx={{ width: '100%', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            {resultado.productosCreados.map((prod) => (
                                <ListItem key={prod.id} divider>
                                    <ListItemText
                                        primary={prod.nombre}
                                        secondary={prod.codigoBarras ? `EAN/ID: ${prod.codigoBarras}` : 'Sin código asignado'}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                );
            default:
                return null;
        }
    };

    const getTitle = () => {
        if (type === 'movimientos') return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SwapHorizIcon /> Detalles de Movimientos
            </Box>
        );
        if (type === 'inventarios') return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InventoryIcon /> Lotes de Inventario (FEFO)
            </Box>
        );
        if (type === 'nuevos_productos') return 'Productos Creados (Espontáneos)';
        return 'Detalle de Recepción';
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{getTitle()}</DialogTitle>
            <DialogContent dividers>
                {renderContent()}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained" color="primary">Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default DetailModal;
