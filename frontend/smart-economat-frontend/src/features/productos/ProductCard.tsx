import React, { ReactNode } from 'react';
import { Box, Card, CardActions, CardContent, CardMedia, IconButton, Tooltip, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Producto } from '../../services/producto.types';
import StatusChip from '../../components/ui/StatusChip';
import { getCategoryIcon } from './utils/getCategoryIcon';
import { EU_ALLERGENS } from '../../components/ui/AllergenSelector';

export interface ProductCardProps {
    producto: Producto;
    onEdit?: (producto: Producto) => void;
    onDelete?: (producto: Producto) => void;
    onView?: (producto: Producto) => void;
    actions?: ReactNode;
}

const ProductCard: React.FC<ProductCardProps> = ({ producto, onEdit, onDelete, onView, actions }) => {
    // Alérgenos presentes en el producto
    const alergenoIds = producto.alergenos?.map((a) => a.alergeno) ?? [];
    const alergenosActivos = EU_ALLERGENS.filter((a) => alergenoIds.includes(a.id));

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
                {/* Nombre */}
                <Typography gutterBottom variant="h6" component="div">
                    {producto.nombre}
                </Typography>

                {/* Marca */}
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    {producto.marca || 'Sin marca'}
                </Typography>

                {/* Chip de tipo — centrado */}
                {producto.tipo && (
                    <Box sx={{ mt: 1, mb: 1, display: 'flex', justifyContent: 'center' }}>
                        <StatusChip status={producto.tipo} size="small" variant="outlined" />
                    </Box>
                )}

                {/* Contenido + unidad + iconos de alérgenos en la misma fila */}
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.75 }}>
                    <Typography variant="body1" fontWeight="bold">
                        {String(producto.contenido)} {producto.unidad || ''}
                    </Typography>

                    {alergenosActivos.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                            {alergenosActivos.map((a) => (
                                <Tooltip key={a.id} title={a.label} arrow>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'text.secondary',
                                            '& svg': { fontSize: 16 },
                                        }}
                                    >
                                        {a.icon}
                                    </Box>
                                </Tooltip>
                            ))}
                        </Box>
                    )}
                </Box>
            </CardContent>

            <CardActions sx={{ justifyContent: 'flex-end', borderTop: '1px solid', borderColor: 'divider' }}>
                {actions ?? (
                    <>
                        {onView && (
                            <Tooltip title="Ver detalle">
                                <IconButton
                                    color="info"
                                    onClick={() => onView(producto)}
                                    size="small"
                                    aria-label="Ver detalle"
                                >
                                    <VisibilityIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        {onEdit && (
                            <Tooltip title="Editar">
                                <IconButton
                                    color="secondary"
                                    onClick={() => onEdit(producto)}
                                    size="small"
                                    aria-label="Editar"
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        {onDelete && (
                            <Tooltip title="Eliminar">
                                <IconButton
                                    color="error"
                                    onClick={() => onDelete(producto)}
                                    size="small"
                                    aria-label="Borrar"
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </>
                )}
            </CardActions>
        </Card>
    );
};

export default ProductCard;
