import React from 'react';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import CategoryIcon from '@mui/icons-material/Category';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import KitchenIcon from '@mui/icons-material/Kitchen';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import CakeIcon from '@mui/icons-material/Cake';
import { CategoriaProducto } from '../../../services/producto.types';

const defaultToastIconProps = { sx: { fontSize: 22 } as const };

/**
 * Devuelve el icono MUI **filled** correspondiente a la categoría del producto.
 * Pensado para toasts y espacios reducidos donde el trazo filled se ve mejor.
 */
export function getCategoryIconFilled(
    tipo: CategoriaProducto | undefined,
    iconProps: React.ComponentProps<typeof CategoryIcon> = defaultToastIconProps
): React.ReactElement {
    const props = { ...defaultToastIconProps, ...iconProps };
    if (!tipo) return <CategoryIcon {...props} />;
    if (tipo === CategoriaProducto.LACTEO || tipo === CategoriaProducto.BEBIDA) {
        return <LocalDrinkIcon {...props} />;
    }
    if (
        tipo === CategoriaProducto.CARNE ||
        tipo === CategoriaProducto.PESCADO ||
        tipo === CategoriaProducto.MARISCO ||
        tipo === CategoriaProducto.HUEVO
    ) {
        return <FastfoodIcon {...props} />;
    }
    if (
        tipo === CategoriaProducto.VERDURA ||
        tipo === CategoriaProducto.FRUTA ||
        tipo === CategoriaProducto.CEREAL ||
        tipo === CategoriaProducto.LEGUMBRE ||
        tipo === CategoriaProducto.FRUTO_SECO
    ) {
        return <ShoppingBasketIcon {...props} />;
    }
    if (tipo === CategoriaProducto.CONDIMENTO) return <KitchenIcon {...props} />;
    if (tipo === CategoriaProducto.ACEITE) return <LocalBarIcon {...props} />;
    if (tipo === CategoriaProducto.AZUCAR) return <CakeIcon {...props} />;
    return <CategoryIcon {...props} />;
}
