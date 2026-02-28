import React, { ReactNode } from 'react';
import { Box, Card, CardActions, CardContent, CardMedia, IconButton, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Producto } from '../../services/producto.types';
import StatusChip from '../../components/ui/StatusChip';
import { getCategoryIcon } from './utils/getCategoryIcon';

export interface ProductCardProps {
    producto: Producto;
    onEdit?: (producto: Producto) => void;
    onDelete?: (producto: Producto) => void;
    actions?: ReactNode;
}

const ProductCard: React.FC<ProductCardProps> = ({ producto, onEdit, onDelete, actions }) => {
    return (
        <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {producto.pathImg ? (
                <CardMedia
                    component="img"
                    height="140"
                    image={producto.pathImg}
                    alt={producto.nombre}
                    sx={{ objectFit: 'cover' }}
                />
            ) : (
                <Box
                    sx={{
                        height: 140,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.100',
                    }}
                >
                    {getCategoryIcon(producto.tipo)}
                </Box>
            )}
            <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="div">
                    {producto.nombre}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    {producto.marca || 'Sin marca'}
                </Typography>
                {producto.tipo && (
                    <Box sx={{ mt: 1, mb: 1 }}>
                        <StatusChip status={producto.tipo} size="small" variant="outlined" />
                    </Box>
                )}
                <Typography variant="body1" fontWeight="bold" sx={{ mt: 1 }}>
                    {String(producto.contenido)} {producto.unidad || ''}
                </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end', borderTop: '1px solid', borderColor: 'divider' }}>
                {actions ?? (
                    <>
                        {onEdit && (
                            <IconButton
                                color="secondary"
                                onClick={() => onEdit(producto)}
                                size="small"
                                aria-label="Editar"
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        )}
                        {onDelete && (
                            <IconButton
                                color="error"
                                onClick={() => onDelete(producto)}
                                size="small"
                                aria-label="Borrar"
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        )}
                    </>
                )}
            </CardActions>
        </Card>
    );
};

export default ProductCard;
