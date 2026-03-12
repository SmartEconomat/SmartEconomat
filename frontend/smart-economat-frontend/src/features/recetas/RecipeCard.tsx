import React, { ReactNode } from 'react';
import { Box, Card, CardActions, CardContent, IconButton, Tooltip, Typography, Divider, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import { Receta } from '../../services/receta.types';
import StatusChip from '../../components/ui/StatusChip';

export interface RecipeCardProps {
    receta: Receta;
    onEdit?: (receta: Receta) => void;
    onDelete?: (receta: Receta) => void;
    onView?: (receta: Receta) => void;
    actions?: ReactNode;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ receta, onEdit, onDelete, onView, actions }) => {
    return (
        <Card
            variant="outlined"
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: onView ? 'pointer' : 'default',
                transition: 'transform 0.2s, box-shadow 0.2s',
                borderRadius: 2,
                '&:hover': {
                    transform: onView ? 'translateY(-4px)' : 'none',
                    boxShadow: onView ? 4 : 'none',
                }
            }}
            onClick={() => onView && onView(receta)}
        >
            <Box
                sx={{
                    height: 140,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'action.hover',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <MenuBookOutlinedIcon sx={{ fontSize: 64, color: 'primary.main', opacity: 0.7 }} />
            </Box>

            <CardContent sx={{ flexGrow: 1 }}>
                <Typography
                    gutterBottom
                    variant="h6"
                    component="div"
                    sx={{
                        fontWeight: 600,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: '2.4em',
                    }}
                >
                    {receta.nombre}
                </Typography>

                <Box display="flex" gap={1} flexWrap="wrap" mb={2} mt={1}>
                    {receta.dificultad && (
                        <StatusChip status={receta.dificultad as any} size="small" variant="outlined" />
                    )}
                    {receta.tiempoPreparacion && (
                        <Chip
                            icon={<AccessTimeOutlinedIcon />}
                            label={receta.tiempoPreparacion}
                            size="small"
                            variant="outlined"
                        />
                    )}
                </Box>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontStyle: 'italic'
                    }}
                >
                    {receta.instrucciones}
                </Typography>
            </CardContent>

            <Divider />

            <CardActions
                sx={{ justifyContent: 'space-between', px: 2, py: 1, bgcolor: 'action.hover' }}
                onClick={(e) => e.stopPropagation()}
            >
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    {receta.ingredientes?.length || 0} ingredientes
                </Typography>
                <Box>
                    {actions ?? (
                        <>
                            {onView && (
                                <Tooltip title="Ver detalle">
                                    <IconButton
                                        color="primary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onView(receta);
                                        }}
                                        size="small"
                                    >
                                        <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                            {onEdit && (
                                <Tooltip title="Editar">
                                    <IconButton
                                        color="secondary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(receta);
                                        }}
                                        size="small"
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                            {onDelete && (
                                <Tooltip title="Eliminar">
                                    <IconButton
                                        color="error"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(receta);
                                        }}
                                        size="small"
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </>
                    )}
                </Box>
            </CardActions>
        </Card>
    );
};

export default RecipeCard;
