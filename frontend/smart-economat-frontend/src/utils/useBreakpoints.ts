/**
 * Documentación en español.
 */

import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

// ─────────────────────────────────────────────────────────────────────────────
// Tipo de retorno
// ─────────────────────────────────────────────────────────────────────────────

export interface Breakpoints {
        /**
     * Documentación en español.
     */
  isMobile: boolean;
        /**
     * Documentación en español.
     */
  isTablet: boolean;
        /**
     * Documentación en español.
     */
  isDesktop: boolean;
        /**
     * Documentación en español.
     */
  isLargeDesktop: boolean;
        /**
     * Documentación en español.
     */
  isXLarge: boolean;

  // ── Rangos compuestos (los más usados en condiciones responsive) ──

        /**
     * Documentación en español.
     */
  isMobileOrTablet: boolean;
        /**
     * Documentación en español.
     */
  isTabletOrAbove: boolean;
        /**
     * Documentación en español.
     */
  isTabletOrBelow: boolean;
        /**
     * Documentación en español.
     */
  isDesktopOrAbove: boolean;

  // ── Valor numérico del ancho actual (útil para lógica JS pura) ──
        /**
     * Documentación en español.
     */
  screenWidth: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Documentación en español.
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
