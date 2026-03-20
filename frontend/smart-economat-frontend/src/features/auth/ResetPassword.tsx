import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
import Logo from '../../assets/images/SVG/logo-smat-economato.svg';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { authService } from '../../services/auth.service';
import {
  isStrongPassword,
  STRONG_PASSWORD_MESSAGE,
} from '../../utils/passwordValidation';
import { getAuthErrorMessage } from '../../utils/authErrorMessages';

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (resetToken.length === 0) {
      setErrorMsg(
        'El enlace de recuperación no es válido o no contiene token.'
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
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
        setSuccessMsg(
          'Tu contraseña ha sido restablecida correctamente. Serás redirigido al inicio de sesión.'
        );
        setTimeout(() => navigate('/login'), 4000);
      } else {
        setErrorMsg(
          getAuthErrorMessage(
            res.message,
            'resetPassword',
            'No se pudo restablecer la contraseña.'
          )
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setErrorMsg(
        getAuthErrorMessage(
          err,
          'resetPassword',
          'Error de conexión con el servidor.'
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
        <Box sx={{ mb: 3 }}>
          <img src={Logo} alt="SmartEconomat" style={{ height: 80 }} />
        </Box>
        <Typography
          variant="h5"
          component="h1"
          gutterBottom
          fontWeight="bold"
          textAlign="center"
        >
          Restablecer Contraseña
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{ mb: 3 }}
        >
          Por favor, introduce tu nueva contraseña a continuación.
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
              label="Nueva Contraseña"
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
              label="Confirmar Contraseña"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={isSubmitDisabled}
              sx={{ mt: 3 }}
            >
              Guardar Nueva Contraseña
            </Button>
          </Box>
        )}

        <Button
          variant="text"
          onClick={() => navigate('/login')}
          sx={{ mt: 2 }}
        >
          Volver al inicio de sesión
        </Button>
      </Paper>
    </Container>
  );
};

export default ResetPassword;
