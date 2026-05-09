/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */

import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

// ─────────────────────────────────────────────────────────────────────────────
// Tipo de retorno
// ─────────────────────────────────────────────────────────────────────────────

/** Contrato de tipos público (Breakpoints). Contexto: smart-economat-frontend (SPA). */
export interface Breakpoints {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  isMobile: boolean;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  isTablet: boolean;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  isDesktop: boolean;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  isLargeDesktop: boolean;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  isXLarge: boolean;

  // ── Rangos compuestos (los más usados en condiciones responsive) ──

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  isMobileOrTablet: boolean;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  isTabletOrAbove: boolean;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  isTabletOrBelow: boolean;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  isDesktopOrAbove: boolean;

  // ── Valor numérico del ancho actual (útil para lógica JS pura) ──
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  screenWidth: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ejecuta la lógica de use breakpoints dentro del flujo de la aplicación.
 * @returns Valor resultante de la operación.
 */
/**
 * Expone "useBreakpoints" en smart-economat-frontend (SPA).
 * @undefined {Breakpoints} Datos efectivos después de ejecutar la operación.
 */
export function useBreakpoints(): Breakpoints {
  const theme = useTheme();

  // Puntos de corte exactos (solo UNO activo a la vez)
  const isMobile = useMediaQuery(theme.breakpoints.only('xs')); // 0–599
  const isTablet = useMediaQuery(theme.breakpoints.only('sm')); // 600–899
  const isDesktop = useMediaQuery(theme.breakpoints.only('md')); // 900–1199
  const isLargeDesktop = useMediaQuery(theme.breakpoints.only('lg')); // 1200–1535
  const isXLarge = useMediaQuery(theme.breakpoints.up('xl')); // ≥1536

  // Rangos compuestos (más útiles en práctica)
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down('md')); // < 900
  const isTabletOrAbove = useMediaQuery(theme.breakpoints.up('sm')); // ≥ 600
  const isTabletOrBelow = useMediaQuery(theme.breakpoints.down('lg')); // < 1200
  const isDesktopOrAbove = useMediaQuery(theme.breakpoints.up('md')); // ≥ 900

  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 0;

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isXLarge,
    isMobileOrTablet,
    isTabletOrAbove,
    isTabletOrBelow,
    isDesktopOrAbove,
    screenWidth,
  };
}
