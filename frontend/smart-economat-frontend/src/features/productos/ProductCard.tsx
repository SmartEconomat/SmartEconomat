import React, { ReactNode } from 'react';
import {
  Box,
  Card,
  CardActions,
  CardContent,
  CardActionArea,
  CardMedia,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';

import { Producto } from '../../services/producto.types';
import { resolveStoredFileUrl } from '../../services/api.service';
import StatusChip from '../../components/ui/StatusChip';
import { getCategoryIcon } from './utils/getCategoryIcon';
import { Allergen, EU_ALLERGENS } from '../../utils/constants';

export interface ProductCardProps {
  producto: Producto;
  onEdit?: (producto: Producto) => void;
  onDelete?: (producto: Producto) => void;
  onView?: (producto: Producto) => void;
  onRestore?: (producto: Producto) => void;
  isDeleted?: boolean;
  actions?: ReactNode;
  sx?: SxProps<Theme>;
}

const ProductCard: React.FC<ProductCardProps> = ({
  producto,
  onEdit,
  onDelete,
  onView,
  onRestore,
  isDeleted = false,
  actions,
  sx,
}) => {
  // Alérgenos presentes en el producto
  const alergenoIds = producto.alergenos?.map((a) => a.alergeno) ?? [];
  const alergenosActivos = EU_ALLERGENS.filter((a: Allergen) =>
    alergenoIds.includes(a.id)
  );
  const imageUrl = resolveStoredFileUrl(producto.pathImg);

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        filter: isDeleted ? 'grayscale(0.8)' : 'none',
        opacity: isDeleted ? 0.8 : 1,
        transition: 'all 0.3s ease',
        '&:hover': {
          filter: 'none',
          opacity: 1,
        },
        ...sx,
      }}
    >
      {isDeleted && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 2,
            bgcolor: 'error.main',
            color: 'white',
            px: 1,
            borderRadius: 1,
            fontSize: '0.65rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            boxShadow: 2,
          }}
        >
          Eliminado
        </Box>
      )}
      <CardActionArea
        onClick={() => onView?.(producto)}
        disabled={!onView}
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
      >
        {imageUrl ? (
          <CardMedia
            component="img"
            height="140"
            image={imageUrl}
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
              bgcolor: 'action.hover',
            }}
          >
            {getCategoryIcon(producto.tipo, {
              sx: { fontSize: 56, color: 'primary.main', opacity: 0.7 },
            })}
          </Box>
        )}

        <CardContent sx={{ flexGrow: 1 }}>
          {/* Nombre — siempre 2 líneas reservadas */}
          <Typography
            gutterBottom
            variant="h6"
            component="div"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '3.2em', // 2 líneas × line-height ~1.6
            }}
          >
            {producto.nombre}
          </Typography>

          {/* Marca */}
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {producto.marca || 'Sin marca'}
          </Typography>

          {/* Chip de tipo — centrado, espacio siempre reservado */}
          <Box
            sx={{
              mt: 1,
              mb: 1,
              minHeight: 28,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {producto.tipo && (
              <StatusChip
                status={producto.tipo}
                size="small"
                variant="outlined"
              />
            )}
          </Box>

          {/* Contenido + unidad + iconos de alérgenos — espacio de alérgenos siempre reservado */}
          <Box
            sx={{
              mt: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 0.75,
            }}
          >
            <Typography variant="body1" fontWeight="bold">
              {String(producto.contenido)} {producto.unidad || ''}
            </Typography>

            {/* Área de alérgenos con minHeight para mantener la alineación */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                flexWrap: 'wrap',
                minHeight: 24,
              }}
            >
              {alergenosActivos.map((a: Allergen) => (
                <Tooltip key={a.id} title={a.label} arrow>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'text.secondary',
                      '& svg': { fontSize: 16 },
                    }}
                    aria-hidden="true"
                  >
                    {a.icon}
                  </Box>
                </Tooltip>
              ))}
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>

      <CardActions
        sx={{
          justifyContent: 'space-between',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        {actions ?? (
          <>
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
            {onDelete && !isDeleted && (
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
            {onRestore && isDeleted && (
              <Tooltip title="Restaurar">
                <IconButton
                  color="success"
                  onClick={() => onRestore(producto)}
                  size="small"
                  aria-label="Restaurar"
                >
                  <RestoreFromTrashIcon fontSize="small" />
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
