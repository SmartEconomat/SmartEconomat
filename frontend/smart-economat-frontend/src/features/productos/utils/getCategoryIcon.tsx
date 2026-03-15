import React from 'react';
import FastfoodOutlinedIcon from '@mui/icons-material/FastfoodOutlined';
import LocalDrinkOutlinedIcon from '@mui/icons-material/LocalDrinkOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import ShoppingBasketOutlinedIcon from '@mui/icons-material/ShoppingBasketOutlined';
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
  iconProps: React.ComponentProps<
    typeof CategoryOutlinedIcon
  > = defaultIconProps
): React.ReactElement {
  const props = { ...defaultIconProps, ...iconProps };
  if (!tipo) return <CategoryOutlinedIcon {...props} />;
  if (tipo === CategoriaProducto.LACTEO || tipo === CategoriaProducto.BEBIDA) {
    return <LocalDrinkOutlinedIcon {...props} />;
  }
  if (
    tipo === CategoriaProducto.CARNE ||
    tipo === CategoriaProducto.PESCADO ||
    tipo === CategoriaProducto.MARISCO ||
    tipo === CategoriaProducto.HUEVO
  ) {
    return <FastfoodOutlinedIcon {...props} />;
  }
  if (
    tipo === CategoriaProducto.VERDURA ||
    tipo === CategoriaProducto.FRUTA ||
    tipo === CategoriaProducto.CEREAL ||
    tipo === CategoriaProducto.LEGUMBRE ||
    tipo === CategoriaProducto.FRUTO_SECO
  ) {
    return <ShoppingBasketOutlinedIcon {...props} />;
  }
  return <CategoryOutlinedIcon {...props} />;
}
