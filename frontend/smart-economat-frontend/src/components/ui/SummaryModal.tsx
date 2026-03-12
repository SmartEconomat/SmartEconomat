import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Chip,
    Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InventoryIcon from '@mui/icons-material/InventoryOutlined';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCartOutlined';
import LocalShippingIcon from '@mui/icons-material/LocalShippingOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmberOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Spinner from './Spinner';
import StatusChip from './StatusChip';
import { fetchProductos } from '../../services/producto.service';
import { fetchPedidos } from '../../services/pedido.service';
import { fetchProveedores } from '../../services/proveedor.service';

export type SummaryModalType = 'productos' | 'pedidos' | 'incidencias' | 'stock' | 'proveedores';

interface SummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: SummaryModalType | null;
    title: string;
}

const SummaryModal: React.FC<SummaryModalProps> = ({ isOpen, onClose, type, title }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && type) {
            loadData();
        } else {
            setData([]);
            setError(null);
        }
    }, [isOpen, type]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            let result: any[] = [];
            if (type === 'productos') {
                const res = await fetchProductos(1, 50);
                result = res.data;
            } else if (type === 'pedidos') {
                const res = await fetchPedidos(1, 50);
                // Filtramos por pendientes si es el caso, pero el usuario pidió "pedidos pendientes"
                result = res.data.filter(p => p.estado === 'pendiente');
            } else if (type === 'incidencias') {
                const res = await fetchPedidos(1, 50);
                result = res.data.filter(p => p.estado === 'incidencia');
            } else if (type === 'stock') {
                const res = await fetchProductos(1, 100);
                // Aquí idealmente el backend filtraría, pero simulamos buscando los de stock <= min
                // Nota: depende de cómo esté estructurado el objeto Producto
                result = res.data.filter((p: any) => (p.cantidadActual || 0) <= (p.stockMinimo || 0));
            } else if (type === 'proveedores') {
                const res = await fetchProveedores(1, 50);
                result = res.data;
            }
            setData(result);
        } catch (err) {
            console.error('Error loading summary data:', err);
            setError('No se pudo cargar la información detallada.');
        } finally {
            setLoading(false);
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'productos': return <InventoryIcon color="primary" />;
            case 'pedidos': return <ShoppingCartIcon color="warning" />;
            case 'incidencias': return <ErrorOutlineIcon color="error" />;
            case 'stock': return <WarningAmberIcon color="error" />;
            case 'proveedores': return <LocalShippingIcon color="info" />;
            default: return null;
        }
    };

    const renderItem = (item: any) => {
        if (type === 'productos' || type === 'stock') {
            return (
                <ListItem key={item.id} sx={{ px: 0 }}>
                    <ListItemIcon>
                        <InventoryIcon />
                    </ListItemIcon>
                    <ListItemText
                        primary={item.nombre}
                        secondary={
                            <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                                <Typography variant="caption" color="text.secondary">
                                    {item.categoria?.nombre || 'Sin categoría'}
                                </Typography>
                                <Chip
                                    label={`${item.stockActual || 0} ${item.unidadMedida || 'und'}`}
                                    size="small"
                                    variant="outlined"
                                    color={(item.stockActual || 0) <= (item.stockMinimo || 0) ? "error" : "default"}
                                />
                            </Stack>
                        }
                    />
                    <Typography variant="body2" fontWeight={600}>
                        {item.precioVenta ? `${item.precioVenta}€` : '-'}
                    </Typography>
                </ListItem>
            );
        }

        if (type === 'pedidos' || type === 'incidencias') {
            return (
                <ListItem key={item.id} sx={{ px: 0 }}>
                    <ListItemIcon>
                        <ShoppingCartIcon />
                    </ListItemIcon>
                    <ListItemText
                        primary={`Pedido #${item.id.substring(0, 8)}`}
                        secondary={
                            <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                                <Typography variant="caption" color="text.secondary">
                                    {new Date(item.fechaPedido).toLocaleDateString()}
                                </Typography>
                                <StatusChip status={item.estado} size="small" />
                            </Stack>
                        }
                    />
                    <Typography variant="body2" fontWeight={600}>
                        {item.costeTotal}€
                    </Typography>
                </ListItem>
            );
        }

        if (type === 'proveedores') {
            return (
                <ListItem key={item.id} sx={{ px: 0 }}>
                    <ListItemIcon>
                        <LocalShippingIcon />
                    </ListItemIcon>
                    <ListItemText
                        primary={item.nombre}
                        secondary={item.contacto || 'Sin contacto'}
                    />
                    <Chip label={item.categoria || 'General'} size="small" />
                </ListItem>
            );
        }

        return null;
    };

    return (
        <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {getIcon()}
                <Typography variant="h6" component="span" fontWeight={700}>
                    {title}
                </Typography>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 2 }}>
                {loading ? (
                    <Box py={8} display="flex" justifyContent="center">
                        <Spinner />
                    </Box>
                ) : error ? (
                    <Box py={4} textAlign="center">
                        <Typography color="error">{error}</Typography>
                    </Box>
                ) : data.length === 0 ? (
                    <Box py={4} textAlign="center">
                        <Typography color="text.secondary">No hay elementos para mostrar.</Typography>
                    </Box>
                ) : (
                    <List disablePadding>
                        {data.map((item, index) => (
                            <React.Fragment key={item.id || index}>
                                {renderItem(item)}
                                {index < data.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default SummaryModal;
