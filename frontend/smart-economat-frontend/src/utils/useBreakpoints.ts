/**
 * @fileoverview Hook centralizado de breakpoints responsivos para SmartEconomat.
 *
 * Expone flags booleanos derivados de los breakpoints MUI del proyecto.
 * Todos los componentes deben IMPORTAR ESTE HOOK en vez de llamar a
 * `useMediaQuery` directamente, para garantizar consistencia total.
 *
 * ## Tabla de breakpoints del proyecto
 * | Token        | Rango exacto         | Dispositivos típicos          |
 * |--------------|----------------------|-------------------------------|
 * | xs (mobile)  | 0 – 599 px           | Móviles en vertical           |
 * | sm (tablet)  | 600 – 899 px         | Móviles horizontal / tablets  |
 * | md (desktop) | 900 – 1199 px        | Tablets grandes / portátiles  |
 * | lg (large)   | 1200 – 1535 px       | Monitores estándar            |
 * | xl (xlarge)  | ≥ 1536 px            | Pantallas grandes / 4K        |
 *
 * ## Convención de uso
 * ```tsx
 * const { isMobile, isTabletOrBelow, isDesktop } = useBreakpoints();
 * ```
 */

import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

// ─────────────────────────────────────────────────────────────────────────────
// Tipo de retorno
// ─────────────────────────────────────────────────────────────────────────────

export interface Breakpoints {
  /** true en xs (0–599px): móviles en vertical */
  isMobile: boolean;
  /** true en sm (600–899px): móviles horizontal / tablets pequeñas */
  isTablet: boolean;
  /** true en md (900–1199px): tablets grandes / portátiles */
  isDesktop: boolean;
  /** true en lg (1200–1535px): monitores estándar */
  isLargeDesktop: boolean;
  /** true en xl (≥1536px): pantallas grandes */
  isXLarge: boolean;

  // ── Rangos compuestos (los más usados en condiciones responsive) ──

  /** true si xs o sm (< 900px): dispositivos táctiles */
  isMobileOrTablet: boolean;
  /** true si sm o superior (≥ 600px) */
  isTabletOrAbove: boolean;
  /** true si xs o sm o md (< 1200px) */
  isTabletOrBelow: boolean;
  /** true si md o superior (≥ 900px) */
  isDesktopOrAbove: boolean;

  // ── Valor numérico del ancho actual (útil para lógica JS pura) ──
  /** Anchura de pantalla en píxeles (window.innerWidth) */
  screenWidth: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook que devuelve los flags de breakpoint actuales del viewport.
 * Se reactualiza automáticamente cuando el viewport cambia de tamaño.
 *
 * @example
 * ```tsx
 * const { isMobile, isDesktop } = useBreakpoints();
 *
 * return isMobile ? <MobileLayout /> : <DesktopLayout />;
 * ```
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
