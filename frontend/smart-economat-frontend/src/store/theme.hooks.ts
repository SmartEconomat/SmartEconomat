import { useContext } from 'react';
import { ThemeContext } from './theme.context';

/**
 * Ejecuta la lógica de use theme context dentro del flujo de la aplicación.
 */
/**
 * Expone "useThemeContext" en smart-economat-frontend (SPA).
 * @undefined {import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/store/theme.types").ThemeContextType} Datos efectivos después de ejecutar la operación.
 */
export const useThemeContext = () => useContext(ThemeContext);
