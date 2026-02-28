import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';

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

/** Slides que se muestran en modo inicio de sesión. */
const LOGIN_SLIDES: SlideData[] = [
    {
        title: 'Bienvenido a SmartEconomat',
        description: 'Gestiona tu economat de forma eficiente, rápida y desde cualquier dispositivo.',
    },
    {
        title: 'Control en tiempo real',
        description: 'Consulta el stock, movimientos y pedidos al momento, sin retrasos ni sorpresas.',
    },
    {
        title: 'Siempre disponible',
        description: 'Tu economat accesible 24/7 con un sistema seguro y fiable.',
    },
];

/** Slides que se muestran en modo registro. */
const REGISTER_SLIDES: SlideData[] = [
    {
        title: 'Únete a SmartEconomat',
        description: 'Regístrate en segundos y empieza a gestionar tu economat hoy mismo.',
    },
    {
        title: 'Todo en un lugar',
        description: 'Productos, recetas, pedidos, incidencias y más, todo integrado en una sola plataforma.',
    },
    {
        title: 'Interfaz moderna y sencilla',
        description: 'Diseño intuitivo para que puedas centrarte en lo que realmente importa.',
    },
];

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
    const theme = useTheme();
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
                height: '100%',         // ← hereda el alto del wrapper absoluto de Login.tsx
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
                    background: 'radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.12) 0%, transparent 60%)',
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
                    flex: 1,                // ocupa todo el espacio vertical disponible
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    px: 5,
                    color: 'white',
                    pb: 8,                  // padding-bottom para dejar espacio a los dots fijos
                }}
            >
                {/* Icono con animación de spin natural al cambiar de modo */}
                <Box
                    key={isLogin ? 'icon-lock' : 'icon-person'}
                    sx={{
                        /*
                         * 0%   → empieza a –360 deg (vuelta completa atrás) y pequeño scale↓
                         * 65%  → llega a 0 deg con un leve overshoot (+8 deg)
                         * 100% → se asienta en 0 deg
                         * Duración 1.1 s para que el movimiento sea perceptible y fluido.
                         */
                        '@keyframes iconSpinNatural': {
                            '0%': { transform: 'rotate(-360deg) scale(0.75)', opacity: 0 },
                            '55%': { opacity: 1 },
                            '65%': { transform: 'rotate(8deg) scale(1.04)', opacity: 1 },
                            '100%': { transform: 'rotate(0deg) scale(1)', opacity: 1 },
                        },
                        animation: 'iconSpinNatural 1.1s cubic-bezier(0.34, 1.2, 0.64, 1) both',
                        width: 110,
                        height: 110,
                        bgcolor: 'rgba(255,255,255,0.15)',
                        border: '1.5px solid rgba(255,255,255,0.30)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(10px)',
                        mb: 3,
                    }}
                >
                    {isLogin
                        ? <LockOutlinedIcon sx={{ fontSize: 52, color: 'white' }} />
                        : <PersonAddOutlinedIcon sx={{ fontSize: 52, color: 'white' }} />
                    }
                </Box>

                {/* Texto del slide activo */}
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
                    <Typography variant="h4" fontWeight={700} gutterBottom sx={{ lineHeight: 1.3 }}>
                        {slides[activeSlide].title}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.82, lineHeight: 1.7 }}>
                        {slides[activeSlide].description}
                    </Typography>
                </Box>
            </Box>

            {/* ═══════════════════════════════════════════════
                Dots de navegación — FIJADOS AL FONDO del panel
                position: absolute para que nunca afecten al
                layout del contenido superior.
            ═══════════════════════════════════════════════ */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: 32,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 1.5,
                    zIndex: 3,
                }}
                role="tablist"
                aria-label="Navegación de slides informativos"
            >
                {slides.map((_, idx) => (
                    <Box
                        key={idx}
                        component="button"
                        role="tab"
                        aria-selected={idx === activeSlide}
                        aria-label={`Slide ${idx + 1} de ${slides.length}`}
                        onClick={() => goToSlide(idx)}
                        sx={{
                            width: idx === activeSlide ? 28 : 10,
                            height: 10,
                            borderRadius: 5,
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            bgcolor: idx === activeSlide
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
