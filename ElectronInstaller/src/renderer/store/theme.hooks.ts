import { useContext } from "react";

import { ThemeContext } from "./theme.context";

/**
 * Expone la operación "useThemeContext" del instalador SmartEconomat.
 * @returns {import("/home/psych/projects/SmartEconomat/ElectronInstaller/src/renderer/store/theme.types").ThemeContextType} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export const useThemeContext = () => useContext(ThemeContext);
