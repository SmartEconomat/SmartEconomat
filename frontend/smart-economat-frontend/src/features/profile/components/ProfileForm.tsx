import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Divider } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import Input from '../../../components/ui/Input';

interface ProfileFormProps {
  isEditing: boolean;
  formData: {
    username: string;
    email: string;
    usernameAlias: string;
  };
  onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenEmailModal: () => void;
  isSaving: boolean;
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
const ProfileForm: React.FC<ProfileFormProps> = ({
  isEditing,
  formData,
  onFormChange,
  onOpenEmailModal,
  isSaving,
}) => {
  const { t } = useTranslation();
  return (
    <Box>
      <Box display="flex" alignItems="center" mb={{ xs: 2, md: 3 }}>
        <PersonOutlineIcon
          color="primary"
          sx={{ fontSize: { xs: 28, md: 32 }, mr: 1.5 }}
        />
        <Typography
          variant="h5"
          fontWeight={600}
          sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}
        >
          {t('perfil.datosPersonalesTitulo')}
        </Typography>
      </Box>
      <Divider sx={{ mb: { xs: 3, md: 4 } }} />

      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }}
        gap={3}
      >
        {/* Nombre de Usuario */}
        <Box>
          {isEditing ? (
            <Input
              label={t('perfil.nombreUsuario')}
              name="username"
              value={formData.username}
              onChange={onFormChange}
              required
              disabled={isSaving}
              helperText={t('perfil.form.helperNombre')}
            />
          ) : (
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}
              >
                Nombre de Usuario
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {formData.username || 'No configurado'}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Username Alias (Solo lectura siempre) */}
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}
          >
            ID de Usuario
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {formData.usernameAlias}
          </Typography>
        </Box>

        {/* Correo Electrónico */}
        <Box sx={{ gridColumn: { sm: 'span 2' } }}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}
          >
            Correo Electrónico
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body1">{formData.email}</Typography>
            {!isEditing && (
              <Typography
                variant="caption"
                color="primary"
                onClick={onOpenEmailModal}
                sx={{
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  ml: 1,
                  '&:hover': { color: 'primary.dark' },
                }}
              >
                {t('perfil.solicitarCambioEmail')}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ProfileForm;
