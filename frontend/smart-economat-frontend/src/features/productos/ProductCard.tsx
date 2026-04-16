import React, { ReactNode } from 'react';
import {
  Box,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useTranslation } from 'react-i18next';
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
  actions?: ReactNode;
}

/**
 * @description Card component for displaying a single Producto in the product grid.
 * Shows the product image (or a category icon placeholder), name, unit, content, allergens,
 * and status chip. Renders optional edit, delete, and view icon buttons.
 * @param props.producto - The Producto entity to display
 * @param props.onEdit - Optional callback invoked when the edit button is clicked
 * @param props.onDelete - Optional callback invoked when the delete button is clicked
 * @param props.onView - Optional callback invoked when the view button is clicked
 * @param props.actions - Optional extra React nodes rendered in the card actions area
 * @returns MUI Card representing a single product
 */
const ProductCard: React.FC<ProductCardProps> = ({
  producto,
  onEdit,
  onDelete,
  onView,
  actions,
}) => {
  const { t } = useTranslation();
  // Alérgenos presentes en el producto
  const alergenoIds = producto.alergenos?.map((a) => a.alergeno) ?? [];
  const alergenosActivos = EU_ALLERGENS.filter((a: Allergen) =>
    alergenoIds.includes(a.id)
  );
  const imageUrl = resolveStoredFileUrl(producto.pathImg);

  return (
    <Card
      variant="outlined"
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
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
          {producto.marca || t('productos.sinMarca')}
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
                >
                  {a.icon}
                </Box>
              </Tooltip>
            ))}
          </Box>
        </Box>
      </CardContent>

      <CardActions
        sx={{
          justifyContent: 'space-between',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        {actions ?? (
          <>
            {onView && (
              <Tooltip title={t('comun.verDetalle')}>
                <IconButton
                  color="info"
                  onClick={() => onView(producto)}
                  size="small"
                  aria-label={t('comun.verDetalle')}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onEdit && (
              <Tooltip title={t('comun.editar')}>
                <IconButton
                  color="secondary"
                  onClick={() => onEdit(producto)}
                  size="small"
                  aria-label={t('comun.editar')}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title={t('comun.eliminar')}>
                <IconButton
                  color="error"
                  onClick={() => onDelete(producto)}
                  size="small"
                  aria-label={t('comun.eliminar')}
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
