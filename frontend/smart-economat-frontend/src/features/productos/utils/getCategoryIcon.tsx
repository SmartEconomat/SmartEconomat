import React from 'react';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import LocalDrinkOutlinedIcon from '@mui/icons-material/LocalDrink';
import GrainOutlinedIcon from '@mui/icons-material/Grain';
import SetMealIcon from '@mui/icons-material/SetMeal';
import EggIcon from '@mui/icons-material/Egg';
import AppleIcon from '@mui/icons-material/Apple';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import VignetteIcon from '@mui/icons-material/Vignette';
import { CategoriaProducto } from '../../../services/producto.types';

const defaultIconProps = {
  sx: { fontSize: 60, color: 'text.disabled' } as const,
};

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Obtiene valores o vistas materializadas.
 * @undefined {CategoriaProducto | undefined} tipo - Entrada efectiva esperada por el contrato.
 * @undefined {import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/node_modules/@mui/material/esm/SvgIcon/SvgIcon").SvgIconOwnProps & import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/node_modules/@mui/material/esm/OverridableComponent/index").CommonProps & Omit<React.SVGProps<SVGSVGElement>, "className" | "style" | "classes" | "children" | "color" | "fontSize" | "htmlColor" | "inheritViewBox" | "shapeRendering" | "sx" | "titleAccess" | "viewBox">} iconProps - Entrada efectiva esperada por el contrato.
 * @undefined {React.ReactElement<unknown, string | React.JSXElementConstructor<any>>} Datos efectivos después de ejecutar la operación.
 */
export function getCategoryIcon(
  tipo: CategoriaProducto | undefined,
  iconProps: React.ComponentProps<
    typeof CategoryOutlinedIcon
  > = defaultIconProps
): React.ReactElement {
  const props = { ...defaultIconProps, ...iconProps };

  if (!tipo) return <CategoryOutlinedIcon {...props} />;

  switch (tipo) {
    case CategoriaProducto.VERDURA:
      return <LocalFloristIcon {...props} />;
    case CategoriaProducto.FRUTA:
      return <AppleIcon {...props} />;
    case CategoriaProducto.CARNE:
      return <RestaurantIcon {...props} />;
    case CategoriaProducto.PESCADO:
    case CategoriaProducto.MARISCO:
      return <SetMealIcon {...props} />;
    case CategoriaProducto.LACTEO:
    case CategoriaProducto.BEBIDA:
    case CategoriaProducto.ACEITE:
      return <LocalDrinkOutlinedIcon {...props} />;
    case CategoriaProducto.HUEVO:
      return <EggIcon {...props} />;
    case CategoriaProducto.CEREAL:
    case CategoriaProducto.LEGUMBRE:
    case CategoriaProducto.AZUCAR:
      return <GrainOutlinedIcon {...props} />;
    case CategoriaProducto.CONDIMENTO:
      return <VignetteIcon {...props} />;
    case CategoriaProducto.OTRO:
    default:
      return <CategoryOutlinedIcon {...props} />;
  }
}
