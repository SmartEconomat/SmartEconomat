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
import LanguageIcon from '@mui/icons-material/Language';
import { useTranslation } from 'react-i18next';

import ProfileForm from '../features/profile/components/ProfileForm';
import ChangePasswordForm from '../features/profile/components/ChangePasswordForm';

import { useAuth } from '../store/auth.hooks';
import { useToast } from '../store/toast.hooks';
import { authService } from '../services/auth.service';
import { getRoleColor } from '../utils/theme/roleColors';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { SYSTEM_ROLES } from '../sherlock-auth/system-roles.constants';

/**
 * Documentación en español.
 */
const Perfil: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const userRole = user?.rol?.toUpperCase() || '';
  const isAlumno = userRole === SYSTEM_ROLES.ALUMNO;

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    usernameAlias: '',
    idioma: 'es' as 'es' | 'en',
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

  /**
   * Documentación en español.
   */
  useEffect(() => {
    const loadInitialData = async () => {
      const fallbackUser = user;

      if (user) {
        setProfileData({
          username: user.username || user.name,
          email: user.email,
          usernameAlias: user.username || '',
          idioma: user.idioma || 'es',
        });
        isInitialized.current = true;
        return;
      }

      setIsLoading(true);
      try {
        const updatedUser = await refreshUser();

        if (!updatedUser) {
          return;
        }

        setProfileData({
          username: updatedUser.username || updatedUser.name,
          email: updatedUser.email,
          usernameAlias: updatedUser.username || '',
          idioma: updatedUser.idioma || 'es',
        });
      } catch (err) {
        console.error('Error loading profile data', err);

        if (fallbackUser) {
          setProfileData({
            username: fallbackUser.username || fallbackUser.name,
            email: fallbackUser.email,
            usernameAlias: fallbackUser.username || '',
            idioma: fallbackUser.idioma || 'es',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (!isInitialized.current) {
      void loadInitialData();
      isInitialized.current = true;
    }
  }, [refreshUser, user]);

  /**
   * Documentación en español.
   */
  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    setProfileData((prev) => ({
      ...prev,
      [e.target.name as string]: e.target.value,
    }));
  };

  /**
   * Documentación en español.
   */
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /**
   * Documentación en español.
   */
  const handleProfileSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      if (
        profileData.username !== (user?.username || user?.name) ||
        profileData.idioma !== user?.idioma
      ) {
        await authService.updateProfile({
          username: profileData.username,
          idioma: profileData.idioma,
        });
        if (profileData.idioma !== user?.idioma) {
          await i18n.changeLanguage(profileData.idioma);
        }
      }

      if (passwordData.newPassword) {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          throw new Error(t('perfil.errors.passwordMismatch'));
        }

        await authService.changePassword({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        });

        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }

      toast.success(t('perfil.toast.updated'));

      await refreshUser();

      setIsEditingProfile(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('perfil.errors.saveFailed');
      setError(message);
      toast.error(t('perfil.toast.updateError'));
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Documentación en español.
   */
  const handleProfileCancel = () => {
    if (user) {
      setProfileData({
        username: user.username || user.name,
        email: user.email,
        usernameAlias: user.username || '',
        idioma: user.idioma || 'es',
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

  /**
   * Documentación en español.
   */
  const handleSubmitEmailRequest = () => {
    const { newEmail, confirmNewEmail, justification } = emailRequest;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!newEmail.trim() || !confirmNewEmail.trim()) {
      toast.error(t('perfil.emailModal.errors.required'));
      return;
    }

    if (!emailRegex.test(newEmail)) {
      toast.error(t('perfil.emailModal.errors.invalidFormat'));
      return;
    }

    if (newEmail.trim() !== confirmNewEmail.trim()) {
      toast.error(t('perfil.emailModal.errors.mismatch'));
      return;
    }

    if (newEmail.trim().toLowerCase() === user?.email.toLowerCase()) {
      toast.error(t('perfil.emailModal.errors.sameEmail'));
      return;
    }

    if (!justification.trim() || justification.trim().length < 10) {
      toast.error(t('perfil.emailModal.errors.justificationTooShort'));
      return;
    }

    toast.success(t('perfil.emailModal.toast.requestSent'));

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
          {t('perfil.titulo')}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
          {isAlumno && t('perfil.descripcionAlumno')}
          {!isAlumno && t('perfil.descripcionOtros')}
        </Typography>

        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          <Link underline="hover" color="inherit" component={RouterLink} to="/">
            {t('layout.menu.inicio')}
          </Link>
          <Typography
            sx={{ color: getRoleColor(user?.rol || ''), fontWeight: 600 }}
          >
            {t('perfil.miPerfil')}
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
                  {t('perfil.seccion.titulo')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isAlumno
                    ? t('perfil.seccion.descripcionAlumno')
                    : t('perfil.seccion.descripcionOtros')}
                </Typography>
              </Box>

              <ProfileForm
                isEditing={isEditingProfile}
                formData={profileData}
                onFormChange={handleProfileChange}
                onOpenEmailModal={() => setIsEmailModalOpen(true)}
                isSaving={isSaving}
              />

              <Box>
                <Box display="flex" alignItems="center" mb={{ xs: 2, md: 3 }}>
                  <LanguageIcon
                    color="primary"
                    sx={{ fontSize: { xs: 28, md: 32 }, mr: 1.5 }}
                  />
                  <Typography
                    variant="h5"
                    fontWeight={600}
                    sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}
                  >
                    {t('perfil.idiomaTitulo') || 'Preferencias de Idioma'}
                  </Typography>
                </Box>
                <Divider sx={{ mb: { xs: 3, md: 4 } }} />

                <Box maxWidth={{ sm: '300px' }}>
                  <Input
                    select
                    label={t('perfil.idioma') || 'Idioma'}
                    name="idioma"
                    value={profileData.idioma}
                    onChange={handleProfileChange}
                    disabled={!isEditingProfile || isSaving}
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </Input>
                </Box>
              </Box>

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
                    {t('perfil.actions.editarPerfil')}
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
                      {t('comun.cancelar')}
                    </Button>
                    <Button
                      color="primary"
                      startIcon={<SaveIcon />}
                      onClick={handleProfileSave}
                      isLoading={isSaving}
                      loadingText={t('comun.cargando')}
                      sx={{ px: 4, width: { xs: '100%', sm: 'auto' } }}
                    >
                      {t('perfil.actions.guardarCambios')}
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
        <DialogTitle>{t('perfil.emailModal.titulo')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ my: 2 }}>
            {t('perfil.emailModal.descripcion')}
          </Typography>

          <Stack spacing={2}>
            <Input
              name="newEmail"
              label={t('perfil.emailModal.nuevoEmail')}
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
              label={t('perfil.emailModal.confirmarNuevoEmail')}
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
              label={t('perfil.emailModal.justificacion')}
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
            {t('comun.cancelar')}
          </Button>
          <Button onClick={handleSubmitEmailRequest}>
            {t('perfil.emailModal.enviarSolicitud')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Perfil;
