import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { getPasswordChangeError } from '../../../utils/passwordValidation';
import { getAuthErrorMessage } from '../../../utils/authErrorMessages';

/** Utility style object for visually hiding elements while keeping them accessible. */
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
 *
 * @interface LoginFormProps
 * @property {() => void} onToggleForm - Callback para cambiar al modo de registro.
 * @property {(user: User) => void} onLoginSuccess - Callback invocado
 *   cuando el login es exitoso. El padre se encarga de la animación de salida antes de navegar.
 */
interface LoginFormProps {
  onToggleForm: () => void;
  onLoginSuccess: (user: User) => void;
}

/**
 * Formulario de inicio de sesión.
 *
 * Delega la navegación al padre mediante `onLoginSuccess` para permitir la
 * animación de salida antes de llamar a AuthContext.login().
 * Todos los textos visibles se obtienen del sistema i18n.
 *
 * @param {LoginFormProps} props - Propiedades del componente.
 * @returns {JSX.Element} Formulario de inicio de sesión.
 */
const LoginForm: React.FC<LoginFormProps> = ({
  onToggleForm,
  onLoginSuccess,
}) => {
  const { t } = useTranslation();
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
  const [pendingLogin, setPendingLogin] = useState<User | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const isLoginSubmitDisabled =
    formData.email.trim().length === 0 || formData.password.length === 0;
  const isForgotSubmitDisabled = formData.email.trim().length === 0;
  const forcedPasswordChangeError = getPasswordChangeError({
    currentPassword: changePassData.currentPassword,
    newPassword: changePassData.newPassword,
    confirmPassword: changePassData.confirmPassword,
    requireCurrentPassword: true,
  });
  const isForcedPasswordChangeDisabled =
    changePassData.currentPassword.length === 0 ||
    changePassData.newPassword.length === 0 ||
    changePassData.confirmPassword.length === 0 ||
    forcedPasswordChangeError !== null;

  useEffect(() => {
    const savedUser = localStorage.getItem('rememberedUser');
    if (savedUser) {
      setFormData((prev) => ({ ...prev, email: savedUser }));
      setRememberMe(true);
    }
  }, []);

  /**
   * Handles login form submission.
   * Stores the remember-me preference, calls the auth service and either triggers
   * a forced password change flow or calls `onLoginSuccess`.
   *
   * @param {React.FormEvent<HTMLFormElement>} e - The form submit event.
   */
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
        const user = {
          id: '',
          name: formData.email.trim(),
          email: formData.email.includes('@') ? formData.email.trim() : '',
          rol: '',
          username: formData.email.includes('@')
            ? undefined
            : formData.email.trim(),
        };

        if (res.data?.requirePasswordChange) {
          setPendingLogin(user);
          setIsChangingPassword(true);
          setChangePassData((prev) => ({
            ...prev,
            currentPassword: formData.password,
          }));
        } else {
          onLoginSuccess(user);
        }
      } else {
        setErrorMsg(
          getAuthErrorMessage(
            res.message,
            'login',
            t('auth.loginForm.errors.loginFailed')
          )
        );
      }
    } catch (err: unknown) {
      setErrorMsg(
        getAuthErrorMessage(err, 'login', t('auth.loginForm.errors.conexion'))
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles forgot-password form submission.
   * Validates the input format (rejects non-email usernames) and calls the API.
   *
   * @param {React.FormEvent<HTMLFormElement>} e - The form submit event.
   */
  const handleForgotSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');
    setForgotSuccess('');

    const emailOrUser = formData.email.trim();
    if (!emailOrUser) {
      setErrorMsg(t('auth.loginForm.forgotPassword.errorEmpty'));
      return;
    }

    // Si no contiene @, asumimos que es un nombre de usuario (probablemente alumno)
    if (!emailOrUser.includes('@')) {
      setErrorMsg(t('auth.loginForm.forgotPassword.errorAlumno'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.forgotPassword(emailOrUser);
      if (res.success) {
        setForgotSuccess(
          res.message || t('auth.loginForm.forgotPassword.successDefault')
        );
      } else {
        setErrorMsg(
          getAuthErrorMessage(
            res.message,
            'forgotPassword',
            t('auth.loginForm.forgotPassword.errorNoSePudo')
          )
        );
      }
    } catch (err: unknown) {
      setErrorMsg(
        getAuthErrorMessage(
          err,
          'forgotPassword',
          t('auth.loginForm.errors.conexion')
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles forced password-change form submission after an admin reset.
   *
   * @param {React.FormEvent<HTMLFormElement>} e - The form submit event.
   */
  const handlePasswordChangeSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setErrorMsg('');

    if (forcedPasswordChangeError) {
      setErrorMsg(forcedPasswordChangeError);
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.changePassword({
        currentPassword: changePassData.currentPassword,
        newPassword: changePassData.newPassword,
      });

      if (res.success) {
        if (pendingLogin) {
          onLoginSuccess(pendingLogin);
        }
      } else {
        setErrorMsg(
          getAuthErrorMessage(
            res.message,
            'changePassword',
            t('auth.loginForm.changePassword.errorNoSePudo')
          )
        );
      }
    } catch (err: unknown) {
      setErrorMsg(
        getAuthErrorMessage(
          err,
          'changePassword',
          t('auth.loginForm.errors.conexion')
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generic change handler for the login / forgot-password inputs.
   *
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - Change event.
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  /**
   * Generic change handler for the forced-password-change inputs.
   *
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - Change event.
   */
  const handleChangePass = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) =>
    setChangePassData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  /** Toggles password visibility for all password fields on the active sub-form. */
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
        {t('auth.loginForm.pageTitle')}
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
            {t('auth.loginForm.changePassword.title')}
          </Typography>
          <Typography
            variant="body2"
            sx={{ textAlign: 'center', mb: 3, color: 'text.secondary' }}
          >
            {t('auth.loginForm.changePassword.description')}
          </Typography>

          <Input
            label={t('auth.loginForm.changePassword.newPassword')}
            name="newPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={changePassData.newPassword}
            onChange={handleChangePass}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={t('auth.loginForm.ariaShowNewPassword')}
                    onClick={togglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            error={Boolean(
              changePassData.newPassword.length > 0 && forcedPasswordChangeError
            )}
            helperText={
              changePassData.newPassword.length > 0
                ? forcedPasswordChangeError
                : ''
            }
          />
          <Input
            label={t('auth.loginForm.changePassword.confirmPassword')}
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={changePassData.confirmPassword}
            onChange={handleChangePass}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={t('auth.loginForm.ariaShowConfirmPassword')}
                    onClick={togglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            error={Boolean(
              changePassData.confirmPassword.length > 0 &&
              forcedPasswordChangeError
            )}
            helperText={
              changePassData.confirmPassword.length > 0
                ? forcedPasswordChangeError
                : ''
            }
          />

          <Button
            type="submit"
            isLoading={isLoading}
            disabled={isForcedPasswordChangeDisabled}
            sx={{ mt: 3, mb: 0 }}
          >
            {t('auth.loginForm.changePassword.submit')}
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
            {t('comun.cancelar')}
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
            {t('auth.loginForm.forgotPassword.description')}
          </Typography>
          <Input
            label={t('auth.loginForm.forgotPassword.emailLabel')}
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
          />
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={isForgotSubmitDisabled}
            sx={{ mt: 2, mb: 0 }}
          >
            {t('auth.loginForm.forgotPassword.submit')}
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
              {t('auth.loginForm.forgotPassword.backToLogin')}
            </Button>
            <Link
              href="#"
              variant="body2"
              onClick={(e) => {
                e.preventDefault();
                onToggleForm();
              }}
            >
              {t('auth.loginForm.noAccount')}
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
            label={t('auth.loginForm.usernameOrEmail')}
            name="email"
            autoComplete="username"
            autoFocus
            value={formData.email}
            onChange={handleChange}
          />
          <Input
            label={t('auth.loginForm.password')}
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={t('auth.loginForm.ariaRevealPassword')}
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
            label={t('auth.loginForm.rememberMe')}
          />
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={isLoginSubmitDisabled}
            sx={{ mt: 2, mb: 0 }}
          >
            {t('auth.loginForm.submit')}
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
              {t('auth.loginForm.noAccount')}
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
              {t('auth.loginForm.forgotPassword.link')}
            </Link>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default LoginForm;
