import React from 'react';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import LocalDrinkOutlinedIcon from '@mui/icons-material/LocalDrinkOutlined';
import GrainOutlinedIcon from '@mui/icons-material/GrainOutlined';
import SetMealOutlinedIcon from '@mui/icons-material/SetMealOutlined';
import EggOutlinedIcon from '@mui/icons-material/EggOutlined';
import AppleOutlinedIcon from '@mui/icons-material/AppleOutlined';
import EcoOutlinedIcon from '@mui/icons-material/EcoOutlined';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import VignetteOutlinedIcon from '@mui/icons-material/VignetteOutlined';
import { CategoriaProducto } from '../../../services/producto.types';

const defaultIconProps = {
  sx: { fontSize: 60, color: 'text.disabled' } as const,
};

/**
 * Devuelve el icono MUI correspondiente a la categoría (tipo) del producto.
 * Se usa como placeholder cuando el producto no tiene imagen (pathImg).
 */
export function getCategoryIcon(
  tipo: CategoriaProducto | undefined,
  iconProps: React.ComponentProps<typeof CategoryOutlinedIcon> = defaultIconProps
): React.ReactElement {
  const props = { ...defaultIconProps, ...iconProps };

  if (!tipo) return <CategoryOutlinedIcon {...props} />;

  switch (tipo) {
    case CategoriaProducto.VERDURA:
      return <EcoOutlinedIcon {...props} />;
    case CategoriaProducto.FRUTA:
      return <AppleOutlinedIcon {...props} />;
    case CategoriaProducto.CARNE:
      return <RestaurantOutlinedIcon {...props} />;
    case CategoriaProducto.PESCADO:
    case CategoriaProducto.MARISCO:
      return <SetMealOutlinedIcon {...props} />;
    case CategoriaProducto.LACTEO:
    case CategoriaProducto.BEBIDA:
    case CategoriaProducto.ACEITE:
      return <LocalDrinkOutlinedIcon {...props} />;
    case CategoriaProducto.HUEVO:
      return <EggOutlinedIcon {...props} />;
    case CategoriaProducto.CEREAL:
    case CategoriaProducto.LEGUMBRE:
    case CategoriaProducto.AZUCAR:
      return <GrainOutlinedIcon {...props} />;
    case CategoriaProducto.CONDIMENTO:
      return <VignetteOutlinedIcon {...props} />;
    case CategoriaProducto.OTRO:
    default:
      return <CategoryOutlinedIcon {...props} />;
  }
}
