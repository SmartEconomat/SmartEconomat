import React, { useState, useRef } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WavingHandOutlinedIcon from '@mui/icons-material/WavingHandOutlined';
import AuthSlide from './components/AuthSlide';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import { useAuth } from '../../store/auth.hooks';
import { User } from '../../store/auth.types';
import { useTranslation } from 'react-i18next';

// ─────────────────────────────────────────────
// Constantes de layout y animación
// ─────────────────────────────────────────────

const SLIDE_W = 58;
const FORM_W = 100 - SLIDE_W; // 42

/** Duración base del efecto Elastic Wall Peel (ms). */
const PEEL_DURATION = 1000;

/** Duración de la animación de salida en login/registro (ms). */
const EXIT_DURATION = 2000;

/** Tiempo de espera de la pantalla de confirmación de registro (ms). */
const REGISTER_MSG_MS = 2500;

/**
 * Fases de la pantalla de autenticación.
 * - `idle`            → Pantalla en reposo mostrando login o registro.
 * - `login-exit`      → El layout se desliza hacia la izquierda y desaparece tras un login exitoso.
 * - `register-exit`   → El layout sale hacia la derecha tras un registro exitoso.
 * - `register-return` → El layout vuelve desde la izquierda (vuelta a login).
 */
type AuthPhase = 'idle' | 'login-exit' | 'register-exit' | 'register-return';

// ─────────────────────────────────────────────
// Keyframes del Elastic Wall Peel
// ─────────────────────────────────────────────

const peelKeyframes = {
  '@keyframes formPeelToLeft': {
    '0%': { left: `${SLIDE_W}%`, width: `${FORM_W}%` },
    '42%': { left: '0%', width: '100%' },
    '44%': { left: '0%', width: '100%' },
    '100%': { left: '0%', width: `${FORM_W}%` },
  },
  '@keyframes formPeelToRight': {
    '0%': { left: '0%', width: `${FORM_W}%` },
    '42%': { left: '0%', width: '100%' },
    '44%': { left: '0%', width: '100%' },
    '100%': { left: `${SLIDE_W}%`, width: `${FORM_W}%` },
  },
  '@keyframes slidePeelToRight': {
    '0%': { left: '0%', width: `${SLIDE_W}%` },
    '42%': { left: '0%', width: '100%' },
    '44%': { left: '0%', width: '100%' },
    '100%': { left: `${FORM_W}%`, width: `${SLIDE_W}%` },
  },
  '@keyframes slidePeelToLeft': {
    '0%': { left: `${FORM_W}%`, width: `${SLIDE_W}%` },
    '42%': { left: '0%', width: '100%' },
    '44%': { left: '0%', width: '100%' },
    '100%': { left: '0%', width: `${SLIDE_W}%` },
  },
  // ── Animaciones de salida completa del layout ──
  '@keyframes layoutExitLeft': {
    '0%': { transform: 'translateX(0)', opacity: 1 },
    '100%': { transform: 'translateX(-100%)', opacity: 0 },
  },
  '@keyframes layoutExitRight': {
    '0%': { transform: 'translateX(0)', opacity: 1 },
    '100%': { transform: 'translateX(100%)', opacity: 0 },
  },
  '@keyframes layoutEnterLeft': {
    '0%': { transform: 'translateX(-100%)', opacity: 0 },
    '100%': { transform: 'translateX(0)', opacity: 1 },
  },
  // ── Overlay de confirmación ──
  '@keyframes overlayFadeIn': {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  '@keyframes overlayContentPop': {
    '0%': { opacity: 0, transform: 'scale(0.85) translateY(16px)' },
    '60%': { opacity: 1, transform: 'scale(1.03) translateY(-4px)' },
    '100%': { opacity: 1, transform: 'scale(1)    translateY(0)' },
  },
  // ── Formulario interno ──
  '@keyframes fadeSlideUp': {
    from: { opacity: 0, transform: 'translateY(18px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
};

const PEEL_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

// ─────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────

/**
 * Página principal de Autenticación.
 *
 * Gestiona tres estados visuales principales:
 *
 * 1. **Login exitoso** (`login-exit`):
 *    El layout completo se desliza hacia la izquierda con fade-out.
 *    Aparece un overlay blanco con "✋ ¡Bienvenido!" mientras se navega al dashboard.
 *
 * 2. **Registro exitoso** (`register-exit`):
 *    El layout sale hacia la derecha con fade-out.
 *    Aparece un overlay blanco con "✅ ¡Registro exitoso!" y el mensaje de confirmación.
 *    Tras 3.5 s el overlay desaparece y el layout vuelve en modo login.
 *
 * 3. **Idle / toggle** (`idle`):
 *    Los paneles intercambian posición con el efecto Elastic Wall Peel.
 *
 * @returns {JSX.Element} Vista controladora de autenticación.
 */
export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [phase, setPhase] = useState<AuthPhase>('idle');
  const hasToggled = useRef(false);

  /**
   * Datos del usuario almacenados temporalmente hasta que termina
   * la animación de salida del login, momento en que se llama a `login()`.
   */
  const pendingAuth = useRef<{ user: User } | null>(null);

  /** Posición final de cada panel según el modo activo. */
  const slideLeft = isLogin ? '0%' : `${FORM_W}%`;
  const formLeft = isLogin ? `${SLIDE_W}%` : '0%';

  /** Nombre de los keyframes del peel según la dirección del viaje. */
  const animated = hasToggled.current && phase === 'idle';
  const formAnim = animated
    ? isLogin
      ? 'formPeelToRight'
      : 'formPeelToLeft'
    : 'none';
  const slideAnim = animated
    ? isLogin
      ? 'slidePeelToLeft'
      : 'slidePeelToRight'
    : 'none';
  const peelCss = (name: string) =>
    name === 'none' ? 'none' : `${name} ${PEEL_DURATION}ms ${PEEL_EASE} both`;

  // ── Layout exit animation name ──
  const layoutAnim =
    phase === 'login-exit'
      ? `layoutExitLeft ${EXIT_DURATION}ms ease forwards`
      : phase === 'register-exit'
        ? `layoutExitRight ${EXIT_DURATION}ms ease forwards`
        : phase === 'register-return'
          ? `layoutEnterLeft ${EXIT_DURATION}ms ease both`
          : 'none';

  // ── Alterna entre login y registro ──
  const toggleForm = () => {
    if (phase !== 'idle') return;
    hasToggled.current = true;
    setIsLogin((prev) => !prev);
  };

  // ─────────────────────────────────────────
  // Caso 1: Login exitoso
  // ─────────────────────────────────────────

  /**
   * Recibe los datos base del usuario tras un login correcto.
   * Activa la animación de salida del layout y, cuando termina, navega al dashboard.
   *
   * @param {User} user - Datos del usuario.
   */
  const handleLoginSuccess = (user: User) => {
    pendingAuth.current = { user };
    setPhase('login-exit');
    // Cuando el layout termina de salir, ejecutamos login() → navega al dashboard
    setTimeout(async () => {
      if (pendingAuth.current) {
        await login(pendingAuth.current.user);
      }
    }, EXIT_DURATION + 200);
  };

  // ─────────────────────────────────────────
  // Caso 2: Registro exitoso
  // ─────────────────────────────────────────

  /**
   * Activa la animación de salida hacia la derecha y muestra el mensaje de confirmación.
   * Tras `REGISTER_MSG_MS` ms, hace volver el layout en modo login.
   */
  const handleRegisterSuccess = () => {
    setPhase('register-exit');
    setTimeout(() => {
      // Volvemos a modo login y animamos la vuelta desde la izquierda
      setIsLogin(true);
      hasToggled.current = false; // evitamos que se dispare el peel al cambiar isLogin
      setPhase('register-return');
      setTimeout(() => {
        setPhase('idle');
      }, EXIT_DURATION + 100);
    }, EXIT_DURATION + REGISTER_MSG_MS);
  };

  /** Indica si hay que mostrar el overlay de feedback (login o registro). */
  const showOverlay =
    phase === 'login-exit' ||
    phase === 'register-exit' ||
    phase === 'register-return';
  const overlayIsRegister =
    phase === 'register-exit' || phase === 'register-return';

  return (
    <>
      {/* ── Layout principal (paneles deslizantes) ── */}
      <Box
        component="main"
        sx={{
          ...peelKeyframes,
          height: '100vh',
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          display: { xs: 'flex', md: 'block' },
          flexDirection: { xs: 'column', md: undefined },
          animation: { xs: 'none', md: layoutAnim },
        }}
      >
        {/* Panel Slide */}
        <Box
          sx={{
            position: { xs: 'relative', md: 'absolute' },
            top: 0,
            left: { xs: 'unset', md: slideLeft },
            width: { xs: '100%', md: `${SLIDE_W}%` },
            height: { xs: '260px', md: '100%' },
            minHeight: { md: '100vh' },
            zIndex: 1,
            animation: { xs: 'none', md: peelCss(slideAnim) },
          }}
        >
          <AuthSlide isLogin={isLogin} />
        </Box>

        {/* Panel Formulario */}
        <Box
          component={Paper}
          elevation={6}
          square
          sx={{
            position: { xs: 'relative', md: 'absolute' },
            top: 0,
            left: { xs: 'unset', md: formLeft },
            width: { xs: '100%', md: `${FORM_W}%` },
            height: { xs: 'auto', md: '100%' },
            flexGrow: { xs: 1, md: 0 },
            display: 'flex',
            flexDirection: 'column',
            // En móvil: alineamos desde arriba para que el scroll sea natural.
            // En desktop: centramos verticalmente (el panel tiene 100vh).
            justifyContent: { xs: 'flex-start', md: 'center' },
            // En móvil habilitamos scroll para formularios largos (registro).
            // En desktop ocultamos overflow para que la animación de peel no se vea fuera.
            overflow: 'auto',
            zIndex: 2,
            animation: { xs: 'none', md: peelCss(formAnim) },
          }}
        >
          <Box
            key={String(isLogin)}
            sx={{
              animation: `fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) ${Math.round(PEEL_DURATION * 0.65)}ms both`,
              width: '100%',
            }}
          >
            {isLogin ? (
              <LoginForm
                onToggleForm={toggleForm}
                onLoginSuccess={handleLoginSuccess}
              />
            ) : (
              <RegisterForm
                onToggleForm={toggleForm}
                onRegisterSuccess={handleRegisterSuccess}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* ══════════════════════════════════════════════════════
                Overlay de feedback — aparece sobre el layout
                - Login exitoso  → ✋ "¡Bienvenido!"
                - Registro ok    → ✅ "¡Registro exitoso!"
            ══════════════════════════════════════════════════════ */}
      {showOverlay && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'background.default',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'overlayFadeIn 0.45s ease both',
          }}
        >
          <Box
            sx={{
              textAlign: 'center',
              animation:
                'overlayContentPop 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.2s both',
            }}
          >
            {overlayIsRegister ? (
              <>
                <CheckCircleOutlineIcon
                  sx={{ fontSize: 80, color: 'secondary.main', mb: 2 }}
                />
                <Typography variant="h3" fontWeight={700} gutterBottom>
                  {t('auth.overlay.registerSuccess')}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  {t('auth.overlay.waitForActivation')}
                </Typography>
              </>
            ) : (
              <>
                <WavingHandOutlinedIcon
                  sx={{ fontSize: 80, color: 'primary.main', mb: 2 }}
                />
                <Typography variant="h3" fontWeight={700} gutterBottom>
                  {t('auth.overlay.welcome')}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  {t('auth.overlay.loadingApp')}
                </Typography>
              </>
            )}
          </Box>
        </Box>
      )}
    </>
  );
}
