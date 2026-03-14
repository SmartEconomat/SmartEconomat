import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { authService } from '../../../services/authService';
import { useToast } from '../../../store/ToastContext';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import {
  isStrongPassword,
  STRONG_PASSWORD_MESSAGE,
} from '../../../utils/passwordValidation';

/**
 * Formulario para cambiar la contraseña del usuario.
 */
const ChangePasswordForm: React.FC = () => {
  const toast = useToast();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  // Estado validaciones en tiempo real
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);
  const [passwordLengthValid, setPasswordLengthValid] = useState<
    boolean | null
  >(null);

  // Validación de coincidencia y longitud
  React.useEffect(() => {
    if (formData.newPassword) {
      setPasswordLengthValid(isStrongPassword(formData.newPassword));
    } else {
      setPasswordLengthValid(null);
    }

    if (formData.newPassword && formData.confirmPassword) {
      setPasswordsMatch(formData.newPassword === formData.confirmPassword);
    } else {
      setPasswordsMatch(null);
    }
  }, [formData.newPassword, formData.confirmPassword]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleShow = (field: keyof typeof showPass) => {
    setShowPass((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones básicas
    if (formData.newPassword !== formData.confirmPassword) {
      setError('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    if (!isStrongPassword(formData.newPassword)) {
      setError(STRONG_PASSWORD_MESSAGE);
      return;
    }

    setIsSaving(true);
    try {
      await authService.changePassword(
        formData.currentPassword,
        formData.newPassword
      );
      toast.success('Contraseña actualizada correctamente');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setError(
        err.message ||
          'Error al actualizar la contraseña. Verifica tu contraseña actual.'
      );
      toast.error('Error al cambiar la contraseña');
    } finally {
      setIsSaving(false);
    }
  };

  const passwordAddon = (field: keyof typeof showPass) => (
    <InputAdornment position="end">
      <IconButton onClick={() => toggleShow(field)} edge="end">
        {showPass[field] ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        height: '100%',
      }}
    >
      <CardContent
        sx={{ p: { xs: 2, sm: 3, md: 4 }, px: { xs: 1.5, sm: 3, md: 4 } }}
      >
        <Box display="flex" alignItems="center" mb={3}>
          <LockOutlinedIcon color="secondary" sx={{ fontSize: 32, mr: 1.5 }} />
          <Typography variant="h5" fontWeight={600}>
            Cambiar Contraseña
          </Typography>
        </Box>
        <Divider sx={{ mb: 4 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Box
            display="grid"
            gridTemplateColumns="1fr"
            gap={0.5}
            sx={{ mb: 2 }}
          >
            <Box>
              <Input
                label="Contraseña Actual"
                name="currentPassword"
                type={showPass.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={handleChange}
                required
                disabled={isSaving}
                InputProps={{ endAdornment: passwordAddon('current') }}
                placeholder="Tu contraseña actual"
                helperText=" "
              />
            </Box>
            <Box>
              <Input
                label="Nueva Contraseña"
                name="newPassword"
                type={showPass.next ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleChange}
                required
                disabled={isSaving}
                InputProps={{ endAdornment: passwordAddon('next') }}
                error={passwordLengthValid === false}
                helperText={
                  passwordLengthValid === false
                    ? STRONG_PASSWORD_MESSAGE
                    : passwordLengthValid === true
                      ? 'Formato correcto'
                      : ' '
                }
                FormHelperTextProps={{
                  sx: {
                    color:
                      passwordLengthValid === false
                        ? 'error.main'
                        : passwordLengthValid === true
                          ? 'success.main'
                          : 'text.secondary',
                  },
                }}
              />
            </Box>
            <Box>
              <Input
                label="Confirmar Nueva Contraseña"
                name="confirmPassword"
                type={showPass.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={isSaving}
                InputProps={{ endAdornment: passwordAddon('confirm') }}
                error={passwordsMatch === false}
                helperText={
                  passwordsMatch === false
                    ? 'Las contraseñas no coinciden'
                    : passwordsMatch === true
                      ? 'Las contraseñas coinciden'
                      : ' '
                }
                FormHelperTextProps={{
                  sx: {
                    color:
                      passwordsMatch === false ? 'error.main' : 'success.main',
                  },
                }}
              />
            </Box>
          </Box>

          <Box sx={{ mt: 1 }}>
            <Button
              type="submit"
              color="secondary"
              isLoading={isSaving}
              sx={{ width: '100%', px: 4 }}
            >
              Actualizar
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ChangePasswordForm;
