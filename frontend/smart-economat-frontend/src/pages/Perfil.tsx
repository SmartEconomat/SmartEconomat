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
import { useTranslation } from 'react-i18next';

import ProfileForm from '../features/profile/components/ProfileForm';
import ChangePasswordForm from '../features/profile/components/ChangePasswordForm';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

import { useAuth } from '../store/auth.hooks';
import { useToast } from '../store/toast.hooks';
import { authService } from '../services/auth.service';
import { getRoleColor } from '../utils/theme/roleColors';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { SYSTEM_ROLES } from '../sherlock-auth/system-roles.constants';

/**
 * User profile page rendered as a unified user card.
 *
 * Displays the authenticated user's profile information and allows them to:
 * - Edit their username.
 * - Change their password.
 * - Request an e-mail change (requires approval from a higher-privilege role).
 *
 * On mount the component loads the current user from the auth store; if the
 * user object is not yet available it fetches it via `refreshUser`.
 *
 * @returns JSX rendered profile page
 */
const Perfil: React.FC = () => {
  const { t } = useTranslation();
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
   * Loads the initial profile data from the auth store or fetches it via
   * `refreshUser` when not yet available.  Runs only once thanks to the
   * `isInitialized` ref guard.
   *
   * @returns {Promise<void>}
   */
  useEffect(() => {
    const loadInitialData = async () => {
      const fallbackUser = user;

      if (user) {
        setProfileData({
          username: user.username || user.name,
          email: user.email,
          usernameAlias: user.username || '',
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
        });
      } catch (err) {
        console.error('Error loading profile data', err);

        if (fallbackUser) {
          setProfileData({
            username: fallbackUser.username || fallbackUser.name,
            email: fallbackUser.email,
            usernameAlias: fallbackUser.username || '',
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
   * Generic change handler for the profile form inputs.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
   * @returns {void}
   */
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /**
   * Generic change handler for the password form inputs.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
   * @returns {void}
   */
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /**
   * Submits the profile form: persists username and/or password changes via
   * the auth service, refreshes the auth store, and collapses the edit panel
   * on success.  Displays toast notifications for both success and error cases.
   *
   * @returns {Promise<void>}
   */
  const handleProfileSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      if (profileData.username !== (user?.username || user?.name)) {
        await authService.updateProfile({ username: profileData.username });
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
   * Discards any unsaved profile changes, resets the form fields back to the
   * current user values, and exits edit mode.
   *
   * @returns {void}
   */
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

  /**
   * Validates and submits the e-mail change request.
   *
   * Performs client-side checks: non-empty fields, valid e-mail format,
   * matching confirmation, difference from the current e-mail, and minimum
   * justification length.  On success it shows a toast, clears the form, and
   * closes the modal.
   *
   * @returns {void}
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
            <Stack spacing={3}>
              <Box>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  {t('perfil.preferencias.titulo')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('perfil.preferencias.descripcion')}
                </Typography>
              </Box>
              <Divider />
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                flexWrap="wrap"
                gap={2}
              >
                <Typography variant="body1">
                  {t('perfil.preferencias.idioma')}
                </Typography>
                <LanguageSwitcher />
              </Box>
            </Stack>
          </CardContent>
        </Card>

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
