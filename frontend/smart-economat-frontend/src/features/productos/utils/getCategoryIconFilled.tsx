import React from 'react';
import { SvgIconProps } from '@mui/material';

// Iconos filled para cada categoría de producto
import GrassIcon from '@mui/icons-material/Grass'; // VERDURA
import AppleIcon from '@mui/icons-material/Apple'; // FRUTA
import LunchDiningIcon from '@mui/icons-material/LunchDining'; // CARNE
import SetMealIcon from '@mui/icons-material/SetMeal'; // PESCADO
import RiceBowlIcon from '@mui/icons-material/RiceBowl'; // MARISCO
import LocalDrinkIcon from '@mui/icons-material/LocalDrink'; // LACTEO
import EggIcon from '@mui/icons-material/Egg'; // HUEVO
import GrainIcon from '@mui/icons-material/Grain'; // CEREAL
import SpaIcon from '@mui/icons-material/Spa'; // LEGUMBRE
import EnergySavingsLeafIcon from '@mui/icons-material/EnergySavingsLeaf'; // FRUTO_SECO
import KitchenIcon from '@mui/icons-material/Kitchen'; // CONDIMENTO
import OpacityIcon from '@mui/icons-material/Opacity'; // ACEITE
import IcecreamIcon from '@mui/icons-material/Icecream'; // AZUCAR
import LocalBarIcon from '@mui/icons-material/LocalBar'; // BEBIDA
import CategoryIcon from '@mui/icons-material/Category'; // OTRO / fallback

import { CategoriaProducto } from '../../../services/producto.types';

const defaultIconProps: SvgIconProps = { sx: { fontSize: 20 } };

/**
 * Documentación en español.
 */
export function getCategoryIconFilled(
  tipo: CategoriaProducto | undefined,
  iconProps: SvgIconProps = defaultIconProps
): React.ReactElement {
  const props = { ...defaultIconProps, ...iconProps };

  switch (tipo) {
    case CategoriaProducto.VERDURA:
      return <GrassIcon {...props} />;
    case CategoriaProducto.FRUTA:
      return <AppleIcon {...props} />;
    case CategoriaProducto.CARNE:
      return <LunchDiningIcon {...props} />;
    case CategoriaProducto.PESCADO:
      return <SetMealIcon {...props} />;
    case CategoriaProducto.MARISCO:
      return <RiceBowlIcon {...props} />;
    case CategoriaProducto.LACTEO:
      return <LocalDrinkIcon {...props} />;
    case CategoriaProducto.HUEVO:
      return <EggIcon {...props} />;
    case CategoriaProducto.CEREAL:
      return <GrainIcon {...props} />;
    case CategoriaProducto.LEGUMBRE:
      return <SpaIcon {...props} />;
    case CategoriaProducto.FRUTO_SECO:
      return <EnergySavingsLeafIcon {...props} />;
    case CategoriaProducto.CONDIMENTO:
      return <KitchenIcon {...props} />;
    case CategoriaProducto.ACEITE:
      return <OpacityIcon {...props} />;
    case CategoriaProducto.AZUCAR:
      return <IcecreamIcon {...props} />;
    case CategoriaProducto.BEBIDA:
      return <LocalBarIcon {...props} />;
    case CategoriaProducto.OTRO:
    default:
      return <CategoryIcon {...props} />;
  }
}
