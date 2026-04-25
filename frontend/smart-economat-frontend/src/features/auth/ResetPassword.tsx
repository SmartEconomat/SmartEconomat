import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Alert,
  IconButton,
  InputAdornment,
  Container,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AuthLogo from './components/AuthLogo';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { authService } from '../../services/auth.service';
import {
  isStrongPassword,
  STRONG_PASSWORD_MESSAGE,
} from '../../utils/passwordValidation';
import { getAuthErrorMessage } from '../../utils/authErrorMessages';

/**
 * Page component for resetting a user's password via a token link.
 *
 * The reset token is read from the URL path parameter (`:token`) or, as a
 * fallback, from the `token` query-string parameter. Validates that the two
 * password fields match and that the new password meets the strength policy
 * before calling the API. On success the user is redirected to `/login` after
 * a short delay.
 */
const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const resetToken = token ?? searchParams.get('token') ?? '';
  const isSubmitDisabled =
    resetToken.length === 0 ||
    formData.password.length === 0 ||
    formData.confirmPassword.length === 0;

  /**
   * Generic controlled-input change handler.
   * Updates the matching field in `formData` state using the input's `name` attribute.
   *
   * @param e - The change event from the password or confirmPassword input.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /**
   * Handles form submission for the password reset flow.
   *
   * Validates that a token is present, that both password fields match and
   * that the new password satisfies the strength policy. On success a
   * localised success message is shown and the user is redirected to `/login`
   * after 4 seconds. Displays localised error messages for all failure cases.
   *
   * @param e - The form submit event.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (resetToken.length === 0) {
      setErrorMsg(t('auth.resetPassword.errors.tokenInvalido'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg(t('auth.resetPassword.errors.contrasenasNoCoinciden'));
      return;
    }

    if (!isStrongPassword(formData.password)) {
      setErrorMsg(STRONG_PASSWORD_MESSAGE);
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.resetPassword({
        token: resetToken,
        newPassword: formData.password,
      });
      if (res.success) {
        setSuccessMsg(t('auth.resetPassword.exito'));
        setTimeout(() => navigate('/login'), 4000);
      } else {
        setErrorMsg(
          getAuthErrorMessage(
            res.message,
            'resetPassword',
            t('auth.resetPassword.errors.noSePudo')
          )
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setErrorMsg(
        getAuthErrorMessage(
          err,
          'resetPassword',
          t('auth.resetPassword.errors.conexion')
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper
        elevation={6}
        sx={{
          p: 4,
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 2,
        }}
      >
        <AuthLogo />
        <Typography
          variant="h5"
          component="h1"
          gutterBottom
          fontWeight="bold"
          textAlign="center"
        >
          {t('auth.resetPassword.titulo')}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{ mb: 3 }}
        >
          {t('auth.resetPassword.descripcion')}
        </Typography>

        {errorMsg && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {errorMsg}
          </Alert>
        )}
        {successMsg && (
          <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
            {successMsg}
          </Alert>
        )}

        {!successMsg && (
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <Input
              label={t('auth.resetPassword.nuevaContrasena')}
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Input
              label={t('auth.resetPassword.confirmarContrasena')}
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <Button
              type="submit"
              isLoading={isLoading}
              loadingText={t('auth.resetPassword.guardando')}
              disabled={isSubmitDisabled}
              sx={{ mt: 3 }}
            >
              {t('auth.resetPassword.guardar')}
            </Button>
          </Box>
        )}

        <Button
          variant="text"
          onClick={() => navigate('/login')}
          sx={{ mt: 2 }}
        >
          {t('auth.resetPassword.volver')}
        </Button>
      </Paper>
    </Container>
  );
};

export default ResetPassword;
