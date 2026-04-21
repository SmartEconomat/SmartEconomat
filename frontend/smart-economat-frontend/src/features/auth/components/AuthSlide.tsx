import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import { useTranslation } from 'react-i18next';

// ─────────────────────────────────────────────
// Datos del carrusel informativo
// ─────────────────────────────────────────────

/**
 * Estructura de cada slide del carrusel informativo.
 * @interface SlideData
 */
interface SlideData {
  title: string;
  description: string;
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

/**
 * Propiedades del componente AuthSlide.
 * @interface AuthSlideProps
 * @property {boolean} isLogin - Indica si se muestra el modo de inicio de sesión o de registro.
 */
interface AuthSlideProps {
  isLogin: boolean;
}

// ─────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────

/**
 * Panel informativo lateral animado de la pantalla de autenticación.
 *
 * - Rellena el 100% del alto de su contenedor padre (posicionado de forma absoluta desde Login.tsx).
 * - Usa dos capas de gradiente superpuestas animadas por `opacity` para transicionar los colores:
 *   una basada en `primary.main` del tema MUI y otra en `secondary.main`.
 * - Muestra un carrusel de 3 slides informativos con dots de navegación fijados al fondo del panel.
 * - El icono (candado / agregar usuario) cambia con una animación de spin suave y llega
 *   siempre en posición vertical (0 deg).
 *
 * @param {AuthSlideProps} props - Propiedades del componente.
 * @returns {JSX.Element} Panel lateral de autenticación.
 */
const AuthSlide: React.FC<AuthSlideProps> = ({ isLogin }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const LOGIN_SLIDES: SlideData[] = [
    {
      title: t('auth.slides.login.slide1Title'),
      description: t('auth.slides.login.slide1Desc'),
    },
    {
      title: t('auth.slides.login.slide2Title'),
      description: t('auth.slides.login.slide2Desc'),
    },
    {
      title: t('auth.slides.login.slide3Title'),
      description: t('auth.slides.login.slide3Desc'),
    },
  ];

  const REGISTER_SLIDES: SlideData[] = [
    {
      title: t('auth.slides.register.slide1Title'),
      description: t('auth.slides.register.slide1Desc'),
    },
    {
      title: t('auth.slides.register.slide2Title'),
      description: t('auth.slides.register.slide2Desc'),
    },
    {
      title: t('auth.slides.register.slide3Title'),
      description: t('auth.slides.register.slide3Desc'),
    },
  ];

  const slides = isLogin ? LOGIN_SLIDES : REGISTER_SLIDES;

  const [activeSlide, setActiveSlide] = useState(0);
  /** slideKey es incrementado para disparar la animación del texto en cada cambio. */
  const [slideKey, setSlideKey] = useState(0);

  /** Navega a un slide concreto y dispara la animación de texto. */
  const goToSlide = useCallback((index: number) => {
    setActiveSlide(index);
    setSlideKey((k) => k + 1);
  }, []);

  /** Al cambiar de modo (login ↔ registro), resetea al primer slide. */
  useEffect(() => {
    setActiveSlide(0);
    setSlideKey((k) => k + 1);
  }, [isLogin]);

  /** Auto-avance cada 4 s; se reinicia cuando el modo cambia. */
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % slides.length;
        setSlideKey((k) => k + 1);
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length, isLogin]);

  // Derivamos colores del tema para que funcionen en cualquier variante
  const loginGradient = `linear-gradient(145deg, ${theme.palette.primary.dark ?? '#b0003a'} 0%, ${theme.palette.primary.main} 45%, ${theme.palette.primary.light ?? '#ff5983'} 100%)`;
  const registerGradient = `linear-gradient(145deg, ${theme.palette.secondary.dark ?? '#00695c'} 0%, ${theme.palette.secondary.main} 45%, ${theme.palette.secondary.light ?? '#4db6ac'} 100%)`;

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%', // ← hereda el alto del wrapper absoluto de Login.tsx
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Capa gradiente Login (primary del tema) ── */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: loginGradient,
          opacity: isLogin ? 1 : 0,
          transition: 'opacity 0.85s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 0,
        }}
      />
      {/* ── Capa gradiente Registro (secondary del tema) ── */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: registerGradient,
          opacity: isLogin ? 0 : 1,
          transition: 'opacity 0.85s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 0,
        }}
      />

      {/* ── Destello radial decorativo ── */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.12) 0%, transparent 60%)',
          zIndex: 1,
        }}
      />

      {/* ═══════════════════════════════════════════════
                Zona central: icono + texto del slide activo
                Usa flex-grow para empujar los dots al fondo
            ═══════════════════════════════════════════════ */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          px: 5,
          color: 'white',
          // En móvil damos más pb para que los dots (48px) no tapen el texto
          pb: { xs: 7, md: 8 },
          pt: { xs: 3, md: 0 },
        }}
      >
        {/* Icono — oculto en móvil para ahorrar espacio vertical */}
        <Box
          key={isLogin ? 'icon-lock' : 'icon-person'}
          sx={{
            '@keyframes iconSpinNatural': {
              '0%': { transform: 'rotate(-360deg) scale(0.75)', opacity: 0 },
              '55%': { opacity: 1 },
              '65%': { transform: 'rotate(8deg) scale(1.04)', opacity: 1 },
              '100%': { transform: 'rotate(0deg) scale(1)', opacity: 1 },
            },
            animation:
              'iconSpinNatural 1.1s cubic-bezier(0.34, 1.2, 0.64, 1) both',
            display: { xs: 'none', md: 'flex' }, // ← oculto en móvil
            width: 110,
            height: 110,
            bgcolor: 'rgba(255,255,255,0.15)',
            border: '1.5px solid rgba(255,255,255,0.30)',
            borderRadius: '50%',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            mb: 3,
          }}
        >
          {isLogin ? (
            <LockOutlinedIcon sx={{ fontSize: 52, color: 'white' }} />
          ) : (
            <PersonAddOutlinedIcon sx={{ fontSize: 52, color: 'white' }} />
          )}
        </Box>

        <Box
          key={`slide-text-${slideKey}`}
          sx={{
            '@keyframes textFadeUp': {
              from: { opacity: 0, transform: 'translateY(16px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
            animation: 'textFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
            maxWidth: 440,
          }}
        >
          {/* Título más pequeño en móvil para que quepa en el panel reducido */}
          <Typography
            variant="h4"
            fontWeight={700}
            gutterBottom
            sx={{
              lineHeight: 1.3,
              fontSize: { xs: '1.55rem', md: '2.125rem' },
            }}
          >
            {slides[activeSlide].title}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              opacity: 0.9,
              lineHeight: 1.7,
              fontSize: { xs: '1em', md: '1rem' },
            }}
          >
            {slides[activeSlide].description}
          </Typography>
        </Box>
      </Box>

      {/* ═══════════════════════════════════════════════
                Dots de navegación — FIJADOS AL FONDO del panel
                position: absolute para que nunca afecten al
                layout del contenido superior.
            ═══════════════════════════════════════════════ */}
      {/* Dots — bottom adaptado a móvil (más cerca del fondo por el panel más alto) */}
      <Box
        sx={{
          position: 'absolute',
          bottom: { xs: 16, md: 32 },
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 1.5,
          zIndex: 3,
        }}
        role="tablist"
        aria-label={t('auth.slides.navAriaLabel')}
      >
        {slides.map((_, idx) => (
          <Box
            key={idx}
            component="button"
            role="tab"
            aria-selected={idx === activeSlide}
            aria-label={t('auth.slides.slideAriaLabel', {
              num: idx + 1,
              total: slides.length,
            })}
            onClick={() => goToSlide(idx)}
            sx={{
              width: idx === activeSlide ? 28 : 10,
              height: 10,
              borderRadius: 5,
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              bgcolor:
                idx === activeSlide
                  ? 'rgba(255,255,255,0.95)'
                  : 'rgba(255,255,255,0.40)',
              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.75)',
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default AuthSlide;
