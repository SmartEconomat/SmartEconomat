import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Divider,
  InputAdornment,
  IconButton,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Input from '../../../components/ui/Input';
import {
  isStrongPassword,
  STRONG_PASSWORD_MESSAGE,
} from '../../../utils/passwordValidation';

interface ChangePasswordFormProps {
  isEditing: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData: any;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSaving: boolean;
}

/**
 * Documentación en español.
 */
const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  isEditing,
  formData,
  onFormChange,
  isSaving,
}) => {
  const { t } = useTranslation();
  const [showPass, setShowPass] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const toggleShow = (field: keyof typeof showPass) => {
    setShowPass((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const passwordAddon = (field: keyof typeof showPass) => (
    <InputAdornment position="end">
      <IconButton onClick={() => toggleShow(field)} edge="end">
        {showPass[field] ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </InputAdornment>
  );

  // Validaciones en tiempo real para UI
  const passwordLengthValid = formData.newPassword
    ? isStrongPassword(formData.newPassword)
    : null;
  const passwordsMatch =
    formData.newPassword && formData.confirmPassword
      ? formData.newPassword === formData.confirmPassword
      : null;

  if (!isEditing) {
    return (
      <Box>
        <Box display="flex" alignItems="center" mb={{ xs: 2, md: 3 }}>
          <LockOutlinedIcon
            color="primary"
            sx={{ fontSize: { xs: 28, md: 32 }, mr: 1.5 }}
          />
          <Typography
            variant="h5"
            fontWeight={600}
            sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}
          >
            Seguridad
          </Typography>
        </Box>
        <Divider sx={{ mb: { xs: 3, md: 4 } }} />
        <Typography variant="body2" color="text.secondary">
          La contraseña está protegida. Para cambiarla, activa el modo de
          edición de la ficha.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={{ xs: 2, md: 3 }}>
        <LockOutlinedIcon
          color="primary"
          sx={{ fontSize: { xs: 28, md: 32 }, mr: 1.5 }}
        />
        <Typography
          variant="h5"
          fontWeight={600}
          sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}
        >
          Cambiar Contraseña
        </Typography>
      </Box>
      <Divider sx={{ mb: { xs: 3, md: 4 } }} />

      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }}
        gap={3}
      >
        <Box>
          <Input
            label={t('perfil.contrasenaActual')}
            name="currentPassword"
            type={showPass.current ? 'text' : 'password'}
            autoComplete="current-password"
            value={formData.currentPassword}
            onChange={onFormChange}
            required
            disabled={isSaving}
            InputProps={{ endAdornment: passwordAddon('current') }}
          />
        </Box>
        <Box sx={{ display: { xs: 'none', sm: 'block' } }} /> {/* Spacer */}
        <Box>
          <Input
            label={t('perfil.nuevaContrasena')}
            name="newPassword"
            type={showPass.next ? 'text' : 'password'}
            autoComplete="new-password"
            value={formData.newPassword}
            onChange={onFormChange}
            required
            disabled={isSaving}
            InputProps={{ endAdornment: passwordAddon('next') }}
            error={passwordLengthValid === false}
            helperText={
              passwordLengthValid === false
                ? STRONG_PASSWORD_MESSAGE
                : passwordLengthValid === true
                  ? 'Formato fuerte'
                  : 'Mínimo 8 caracteres, mayúsculas, números y símbolos'
            }
          />
        </Box>
        <Box>
          <Input
            label={t('perfil.confirmarNuevaContrasena')}
            name="confirmPassword"
            type={showPass.confirm ? 'text' : 'password'}
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={onFormChange}
            required
            disabled={isSaving}
            InputProps={{ endAdornment: passwordAddon('confirm') }}
            error={passwordsMatch === false}
            helperText={
              passwordsMatch === false ? 'Las contraseñas no coinciden' : ' '
            }
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ChangePasswordForm;
