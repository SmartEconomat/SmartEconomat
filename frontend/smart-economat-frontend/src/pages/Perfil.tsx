import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Breadcrumbs,
  Link,
  Stack,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

import ProfileForm from '../features/profile/components/ProfileForm';
import ChangePasswordForm from '../features/profile/components/ChangePasswordForm';

import { useAuth } from '../store/auth.hooks';
import { useToast } from '../store/toast.hooks';
import { authService as authSvc } from '../services/authService';
import { getRoleColor } from '../utils/theme/roleColors';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

/**
 * Página de Perfil - Unificada como una Ficha de Usuario.
 */
const Perfil: React.FC = () => {
  const { user, login } = useAuth();
  const toast = useToast();

  const userRole = user?.rol?.toUpperCase() || '';
  const isAlumno = userRole === 'ALUMNO';

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    usernameAlias: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailRequest, setEmailRequest] = useState({
    newEmail: '',
    confirmNewEmail: '',
    justification: '',
  });

  const isInitialized = useRef(false);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const updatedUser = await authSvc.getCurrentUser();

        setProfileData({
          username: updatedUser.username || updatedUser.name,
          email: updatedUser.email,
          usernameAlias: updatedUser.username || '',
        });

        login(updatedUser, localStorage.getItem('token') || '');
      } catch (err) {
        console.error('Error loading profile data', err);

        if (user) {
          setProfileData({
            username: user.username || user.name,
            email: user.email,
            usernameAlias: user.username || '',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (!isInitialized.current) {
      loadInitialData();
      isInitialized.current = true;
    }
  }, [login, user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProfileSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      if (profileData.username !== (user?.username || user?.name)) {
        await authSvc.updateProfile({ username: profileData.username });
      }

      if (passwordData.newPassword) {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          throw new Error('Las contraseñas no coinciden.');
        }

        await authSvc.changePassword(
          passwordData.currentPassword,
          passwordData.newPassword
        );

        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }

      toast.success('Perfil actualizado correctamente');

      const updatedUser = await authSvc.getCurrentUser();
      login(updatedUser, localStorage.getItem('token') || '');

      setIsEditingProfile(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al guardar los cambios';
      setError(message);
      toast.error('Error al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileCancel = () => {
    if (user) {
      setProfileData({
        username: user.username || user.name,
        email: user.email,
        usernameAlias: user.username || '',
      });
    }

    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });

    setIsEditingProfile(false);
    setError(null);
  };

  const handleSubmitEmailRequest = () => {
    const { newEmail, confirmNewEmail, justification } = emailRequest;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!newEmail.trim() || !confirmNewEmail.trim()) {
      toast.error('Introduce y confirma el nuevo email');
      return;
    }

    if (!emailRegex.test(newEmail)) {
      toast.error('El formato del email no es válido');
      return;
    }

    if (newEmail.trim() !== confirmNewEmail.trim()) {
      toast.error('Los emails no coinciden');
      return;
    }

    if (newEmail.trim().toLowerCase() === user?.email.toLowerCase()) {
      toast.error('El nuevo email debe ser diferente al actual');
      return;
    }

    if (!justification.trim() || justification.trim().length < 10) {
      toast.error('Indica una justificación válida (mínimo 10 caracteres)');
      return;
    }

    toast.success(
      'Solicitud enviada. El cambio de email quedará pendiente de aprobación por un rol superior.'
    );

    setEmailRequest({
      newEmail: '',
      confirmNewEmail: '',
      justification: '',
    });

    setIsEmailModalOpen(false);
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, px: { xs: 1, sm: 2, md: 3 } }}>
      <Box mb={{ xs: 3, md: 4 }}>
        <Typography
          variant="h4"
          fontWeight={700}
          gutterBottom
          sx={{
            fontSize: { xs: '1.75rem', md: '2.125rem' },
            color: getRoleColor(user?.rol || ''),
          }}
        >
          Perfil de Usuario
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
          {isAlumno &&
            'Consulta tu perfil, cambia tu nombre de usuario o contraseña y solicita cambios de email con aprobación superior.'}
          {!isAlumno &&
            'Consulta y edita tus datos personales y opciones de seguridad.'}
        </Typography>

        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          <Link underline="hover" color="inherit" component={RouterLink} to="/">
            Inicio
          </Link>
          <Typography
            sx={{ color: getRoleColor(user?.rol || ''), fontWeight: 600 }}
          >
            Mi Perfil
          </Typography>
        </Breadcrumbs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={4}>
        <Card
          elevation={2}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Stack spacing={6}>
              <Box>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Perfil y Seguridad
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isAlumno
                    ? 'Puedes editar tu nombre de usuario y contraseña. El cambio de email requiere aprobación de un rol superior.'
                    : 'Gestiona tu información personal y tu contraseña.'}
                </Typography>
              </Box>

              <ProfileForm
                isEditing={isEditingProfile}
                formData={profileData}
                onFormChange={handleProfileChange}
                onOpenEmailModal={() => setIsEmailModalOpen(true)}
                isSaving={isSaving}
              />

              <ChangePasswordForm
                isEditing={isEditingProfile}
                formData={passwordData}
                onFormChange={handlePasswordChange}
                isSaving={isSaving}
              />

              <Divider />

              <Box
                display="flex"
                flexDirection={{ xs: 'column-reverse', sm: 'row' }}
                justifyContent="flex-end"
                gap={2}
              >
                {!isEditingProfile ? (
                  <Button
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditingProfile(true)}
                    sx={{
                      borderRadius: 3,
                      px: 4,
                      width: { xs: '100%', sm: 'auto' },
                    }}
                  >
                    Editar Perfil
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outlined"
                      color="inherit"
                      startIcon={<CancelIcon />}
                      onClick={handleProfileCancel}
                      disabled={isSaving}
                      sx={{ px: 3, width: { xs: '100%', sm: 'auto' } }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      color="primary"
                      startIcon={<SaveIcon />}
                      onClick={handleProfileSave}
                      isLoading={isSaving}
                      sx={{ px: 4, width: { xs: '100%', sm: 'auto' } }}
                    >
                      Guardar Cambios
                    </Button>
                  </>
                )}
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Dialog
        open={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Solicitar Cambio de Email</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ my: 2 }}>
            El cambio de email no es inmediato. La solicitud será revisada por
            un rol superior y solo se aplicará tras su aprobación.
          </Typography>

          <Stack spacing={2}>
            <Input
              name="newEmail"
              label="Nuevo Email"
              type="email"
              value={emailRequest.newEmail}
              onChange={(e) =>
                setEmailRequest({
                  ...emailRequest,
                  newEmail: e.target.value,
                })
              }
            />
            <Input
              name="confirmNewEmail"
              label="Confirmar Nuevo Email"
              type="email"
              value={emailRequest.confirmNewEmail}
              onChange={(e) =>
                setEmailRequest({
                  ...emailRequest,
                  confirmNewEmail: e.target.value,
                })
              }
            />
            <Input
              name="justification"
              label="Justificación"
              multiline
              rows={3}
              value={emailRequest.justification}
              onChange={(e) =>
                setEmailRequest({
                  ...emailRequest,
                  justification: e.target.value,
                })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button variant="outlined" onClick={() => setIsEmailModalOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmitEmailRequest}>Enviar Solicitud</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Perfil;
