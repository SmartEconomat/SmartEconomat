import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Link,
  InputAdornment,
  IconButton,
  Alert,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Checkbox from '../../../components/ui/Checkbox';
import Logo from '../../../assets/images/SVG/logo-smat-economato.svg';
import { User } from '../../../store/auth.types';
import { authService } from '../../../services/auth.service';
import {
  isStrongPassword,
  STRONG_PASSWORD_MESSAGE,
} from '../../../utils/passwordValidation';

interface JwtPayload {
  sub?: string;
  username?: string;
  email?: string;
  role?: string;
}

const visuallyHidden = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px',
} as const;

/**
 * Propiedades del componente LoginForm.
 * @interface LoginFormProps
 * @property {() => void} onToggleForm - Callback para cambiar al modo de registro.
 * @property {(user: User, token: string) => void} onLoginSuccess - Callback invocado
 *   cuando el login es exitoso. El padre se encarga de la animación de salida antes de navegar.
 */
interface LoginFormProps {
  onToggleForm: () => void;
  onLoginSuccess: (user: User, token: string) => void;
}

function parseJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error && error.message
    ? error.message
    : fallbackMessage;
}

/**
 * Formulario de inicio de sesión.
 * Delega la navegación al padre mediante `onLoginSuccess` para permitir la
 * animación de salida antes de llamar a AuthContext.login().
 */

const LoginForm: React.FC<LoginFormProps> = ({
  onToggleForm,
  onLoginSuccess,
}) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [changePassData, setChangePassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pendingLogin, setPendingLogin] = useState<{
    user: User;
    token: string;
  } | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('rememberedUser');
    if (savedUser) {
      setFormData((prev) => ({ ...prev, email: savedUser }));
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      if (rememberMe) {
        localStorage.setItem('rememberedUser', formData.email.trim());
      } else {
        localStorage.removeItem('rememberedUser');
      }

      const res = await authService.login({
        email: formData.email?.trim(),
        password: formData.password,
      });

      if (res.success) {
        const token = res.data?.access_token;
        const dec = token ? parseJwt(token) : null;
        const user = {
          id: dec?.sub || '',
          name: dec?.username || formData.email,
          email:
            dec?.email || (formData.email.includes('@') ? formData.email : ''),
          rol: dec?.role || '',
          username: dec?.username,
        };

        if (res.data?.requirePasswordChange) {
          setPendingLogin({ user, token });
          setIsChangingPassword(true);
          setChangePassData((prev) => ({
            ...prev,
            currentPassword: formData.password,
          }));
        } else {
          onLoginSuccess(user, token);
        }
      } else {
        setErrorMsg(res.message || 'Credenciales inválidas, intenta de nuevo.');
      }
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, 'Error de conexión al servidor.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');
    setForgotSuccess('');

    const emailOrUser = formData.email.trim();
    if (!emailOrUser) {
      setErrorMsg('Por favor ingresa tu usuario o correo electrónico.');
      return;
    }

    // Si no contiene @, asumimos que es un nombre de usuario (probablemente alumno)
    if (!emailOrUser.includes('@')) {
      setErrorMsg(
        'Los alumnos deben solicitar el restablecimiento de contraseña a su profesor asignado directamente.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.forgotPassword(emailOrUser);
      if (res.success) {
        setForgotSuccess(
          res.message ||
            'Si el correo electrónico figura en nuestro sistema, recibirás instrucciones próximamente.'
        );
      } else {
        setErrorMsg(res.message || 'Error al procesar la solicitud.');
      }
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, 'Error de conexión al servidor.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChangeSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setErrorMsg('');

    if (changePassData.newPassword !== changePassData.confirmPassword) {
      setErrorMsg('Las contraseñas nuevas no coinciden.');
      return;
    }

    if (!isStrongPassword(changePassData.newPassword)) {
      setErrorMsg(STRONG_PASSWORD_MESSAGE);
      return;
    }

    setIsLoading(true);
    const previousToken = localStorage.getItem('token');
    try {
      if (pendingLogin?.token) {
        localStorage.setItem('token', pendingLogin.token);
      }

      const res = await authService.changePassword({
        currentPassword: changePassData.currentPassword,
        newPassword: changePassData.newPassword,
      });

      if (res.success) {
        if (pendingLogin) {
          onLoginSuccess(pendingLogin.user, pendingLogin.token);
        }
      } else {
        setErrorMsg(res.message || 'Error al cambiar la contraseña.');
      }
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, 'Error de conexión al servidor.'));
    } finally {
      if (previousToken) {
        localStorage.setItem('token', previousToken);
      } else {
        localStorage.removeItem('token');
      }
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleChangePass = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) =>
    setChangePassData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const togglePasswordVisibility = () => setShowPassword((v) => !v);

  return (
    <Box
      sx={{
        my: { xs: 4, md: 8 },
        mx: 4,
        pt: { xs: 2, md: 0 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Typography component="h1" sx={visuallyHidden}>
        Iniciar Sesión en Smart Economat
      </Typography>

      {/* Logo responsivo: más pequeño en móvil, más grande en desktop */}
      <Box sx={{ mb: 1, mt: { xs: 0, md: 1 } }}>
        <img
          src={Logo}
          alt="SmartEconomat"
          style={{ height: 'clamp(90px, 15vw, 130px)', width: 'auto' }}
        />
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ width: '100%', maxWidth: 400, mt: 2 }}>
          {errorMsg}
        </Alert>
      )}

      {forgotSuccess && (
        <Alert severity="success" sx={{ width: '100%', maxWidth: 400, mt: 2 }}>
          {forgotSuccess}
        </Alert>
      )}

      {isChangingPassword ? (
        <Box
          component="form"
          noValidate
          onSubmit={handlePasswordChangeSubmit}
          sx={{ mt: 1, width: '100%', maxWidth: 400 }}
        >
          <Typography
            variant="h6"
            sx={{
              textAlign: 'center',
              mb: 1,
              color: 'primary.main',
              fontWeight: 'bold',
            }}
          >
            Cambio de contraseña obligatorio
          </Typography>
          <Typography
            variant="body2"
            sx={{ textAlign: 'center', mb: 3, color: 'text.secondary' }}
          >
            Su administrador ha restablecido su contraseña. Por seguridad, debe
            elegir una nueva antes de continuar.
          </Typography>

          <Input
            label="Nueva Contraseña"
            name="newPassword"
            type={showPassword ? 'text' : 'password'}
            value={changePassData.newPassword}
            onChange={handleChangePass}
            required
          />
          <Input
            label="Confirmar Nueva Contraseña"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={changePassData.confirmPassword}
            onChange={handleChangePass}
            required
          />

          <Button
            type="submit"
            isLoading={isLoading}
            disabled={
              !changePassData.newPassword || !changePassData.confirmPassword
            }
            sx={{ mt: 3, mb: 0 }}
          >
            Actualizar y Acceder
          </Button>

          <Button
            variant="text"
            fullWidth
            onClick={() => {
              setIsChangingPassword(false);
              setPendingLogin(null);
              setErrorMsg('');
            }}
            sx={{ mt: 1 }}
          >
            Cancelar
          </Button>
        </Box>
      ) : isForgotPassword ? (
        <Box
          component="form"
          noValidate
          onSubmit={handleForgotSubmit}
          sx={{ mt: 1, width: '100%', maxWidth: 400 }}
        >
          <Typography
            variant="body1"
            sx={{ textAlign: 'center', mb: 2, color: 'text.secondary' }}
          >
            Introduce la dirección de correo electrónico vinculada a tu cuenta
            para recibir un enlace temporal de reestablecimiento.
          </Typography>
          <Input
            label="Correo Electrónico"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
          />
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={!formData.email.trim()}
            sx={{ mt: 2, mb: 0 }}
          >
            Restablecer Contraseña
          </Button>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              alignItems: 'center',
              mt: 1,
            }}
          >
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                setIsForgotPassword(false);
                setForgotSuccess('');
                setErrorMsg('');
              }}
              sx={{ mt: 1 }}
            >
              Volver al inicio de sesión
            </Button>
            <Link
              href="#"
              variant="body2"
              onClick={(e) => {
                e.preventDefault();
                onToggleForm();
              }}
            >
              ¿No tienes cuenta? Regístrate aquí.
            </Link>
          </Box>
        </Box>
      ) : (
        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit}
          sx={{ mt: 1, width: '100%', maxWidth: 400 }}
        >
          <Input
            label="Usuario o Email"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
          />
          <Input
            label="Contraseña"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="revelar contraseña"
                    onClick={togglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Checkbox
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            label="Recordarme"
          />
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={!formData.email.trim() || !formData.password}
            sx={{ mt: 2, mb: 0 }}
          >
            Acceder
          </Button>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              alignItems: 'center',
              mt: 1,
            }}
          >
            <Button
              variant="outlined"
              color="primary"
              onClick={() => onToggleForm()}
              sx={{ mt: 1 }}
            >
              ¿No tienes cuenta? Regístrate aquí.
            </Button>
            <Link
              href="#"
              variant="body2"
              onClick={(e) => {
                e.preventDefault();
                setIsForgotPassword(true);
                setErrorMsg('');
                setForgotSuccess('');
              }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default LoginForm;
