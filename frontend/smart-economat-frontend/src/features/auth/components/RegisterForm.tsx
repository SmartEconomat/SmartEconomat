import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  IconButton,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import AuthLogo from './AuthLogo';
import SecondaryActionButton from './SecondaryActionButton';
import {
  authService,
  SlotReferenceResponse,
} from '../../../services/auth.service';
import { isStrongPassword } from '../../../utils/passwordValidation';
import { getAuthErrorMessage } from '../../../utils/authErrorMessages';
import { SYSTEM_ROLES } from '../../../sherlock-auth/system-roles.constants';
import { useTranslation } from 'react-i18next';

interface RegisterFormProps {
  onToggleForm: () => void;
  onRegisterSuccess: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onToggleForm,
  onRegisterSuccess,
}) => {
  const { t } = useTranslation();
  const [role, setRole] = useState<'ALUMNO' | 'PROFESOR'>(SYSTEM_ROLES.ALUMNO);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    codigoClase: '',
    cial: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [slotLoadError, setSlotLoadError] = useState('');
  const [slotReference, setSlotReference] =
    useState<SlotReferenceResponse | null>(null);

  const isAlumnoSubmitDisabled =
    formData.username.trim().length === 0 ||
    formData.password.length === 0 ||
    formData.confirmPassword.length === 0 ||
    formData.codigoClase.trim().length === 0;

  const isProfesorSubmitDisabled =
    formData.username.trim().length === 0 ||
    formData.email.trim().length === 0 ||
    formData.password.length === 0 ||
    formData.confirmPassword.length === 0 ||
    formData.cial.trim().length === 0;

  const isSubmitDisabled =
    role === SYSTEM_ROLES.ALUMNO
      ? isAlumnoSubmitDisabled
      : isProfesorSubmitDisabled;

  const slotReferenceMessage = slotReference
    ? t('auth.registerForm.slotReferenceMessage', {
        aula: slotReference.aula,
        numeroClase: slotReference.numeroClase,
        profesor: slotReference.profesor,
      })
    : '';

  const codigoClaseHelperText = slotLoadError
    ? slotLoadError
    : slotReference
      ? t('auth.registerForm.codigoVerificado')
      : t('auth.registerForm.codigoHelper');

  useEffect(() => {
    if (role !== SYSTEM_ROLES.ALUMNO) {
      setSlotReference(null);
      setSlotLoadError('');
      setIsLoadingData(false);
      return;
    }

    const normalizedCode = formData.codigoClase.trim().toUpperCase();

    if (!normalizedCode) {
      setSlotReference(null);
      setSlotLoadError('');
      setIsLoadingData(false);
      return;
    }

    setSlotReference(null);
    setSlotLoadError('');

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsLoadingData(true);
        const res = await authService.getSlotByCode(normalizedCode);

        if (!cancelled && res.success) {
          setSlotReference(res.data);
          setSlotLoadError('');
        }
      } catch (err) {
        if (!cancelled) {
          setSlotReference(null);
          setSlotLoadError(
            getAuthErrorMessage(
              err,
              'registerAlumno',
              t('auth.registerForm.errorValidarCodigo')
            )
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingData(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [formData.codigoClase, role]);

  const handleRoleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newRole: 'ALUMNO' | 'PROFESOR' | null
  ) => {
    if (!newRole) return;

    setRole(newRole);
    setErrorMsg('');
    setSlotLoadError('');
    setSlotReference(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      codigoClase: '',
      cial: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const isAlumno = role === SYSTEM_ROLES.ALUMNO;

    try {
      if (formData.password !== formData.confirmPassword) {
        setErrorMsg(t('auth.registerForm.errorPasswordMismatch'));
        return;
      }

      if (!isStrongPassword(formData.password)) {
        setErrorMsg(t('auth.registerForm.strongPasswordHint'));
        return;
      }

      if (isAlumno) {
        if (!formData.codigoClase.trim()) {
          setErrorMsg(t('auth.registerForm.errorCodigoRequerido'));
          return;
        }

        if (!slotReference) {
          setErrorMsg(
            'Debes ingresar un código de clase válido para completar el registro.'
          );
          return;
        }

        const res = await authService.registerAlumno({
          username: formData.username.trim(),
          password: formData.password,
          codigoClase: formData.codigoClase.trim().toUpperCase(),
        });

        if (res.success) {
          onRegisterSuccess();
        } else {
          setErrorMsg(
            getAuthErrorMessage(
              res.message,
              'registerAlumno',
              t('auth.registerForm.errorNoSePudo')
            )
          );
        }

        return;
      }

      const res = await authService.registerProfesor({
        username: formData.username.trim(),
        password: formData.password,
        email: formData.email.trim(),
        cial: formData.cial.trim().toUpperCase(),
      });

      if (res.success) {
        onRegisterSuccess();
      } else {
        setErrorMsg(
          getAuthErrorMessage(
            res.message,
            'registerProfesor',
            t('auth.registerForm.errorNoSePudo')
          )
        );
      }
    } catch (err) {
      setErrorMsg(
        getAuthErrorMessage(
          err,
          isAlumno ? 'registerAlumno' : 'registerProfesor',
          t('auth.registerForm.errorConexion')
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'codigoClase' ? value.toUpperCase() : value,
    }));
  };

  const togglePasswordVisibility = () => setShowPassword((v) => !v);

  return (
    <Box
      sx={{
        my: { xs: 2, md: 4 },
        mx: 4,
        pt: { xs: 2, md: 0 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <AuthLogo condensed />

      <Typography
        variant="h6"
        sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}
      >
        {t('auth.registerForm.createAccount')}
      </Typography>

      <ToggleButtonGroup
        color="primary"
        value={role}
        exclusive
        onChange={handleRoleChange}
        aria-label={t('auth.registerForm.roleAriaLabel')}
        sx={{ mb: 3 }}
        size="small"
      >
        <ToggleButton value={SYSTEM_ROLES.ALUMNO} sx={{ px: 3 }}>
          {t('auth.registerForm.roleAlumno')}
        </ToggleButton>
        <ToggleButton value={SYSTEM_ROLES.PROFESOR} sx={{ px: 3 }}>
          {t('auth.registerForm.roleProfesor')}
        </ToggleButton>
      </ToggleButtonGroup>

      {errorMsg && (
        <Alert severity="error" sx={{ width: '100%', maxWidth: 400, mb: 2 }}>
          {errorMsg}
        </Alert>
      )}

      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit}
        sx={{ width: '100%', maxWidth: 400 }}
      >
        <Input
          label={t('auth.registerForm.username')}
          name="username"
          autoComplete="username"
          value={formData.username}
          onChange={handleChange}
          required
        />

        {role === SYSTEM_ROLES.ALUMNO && slotReferenceMessage && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {slotReferenceMessage}
          </Alert>
        )}

        {role === SYSTEM_ROLES.PROFESOR && (
          <Input
            label={t('auth.registerForm.email')}
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        )}

        {role === SYSTEM_ROLES.ALUMNO ? (
          <>
            <Input
              label={t('auth.registerForm.codigoClase')}
              name="codigoClase"
              value={formData.codigoClase}
              onChange={handleChange}
              required
              error={!!slotLoadError}
              helperText={codigoClaseHelperText}
            />

            {isLoadingData && formData.codigoClase.trim().length > 0 && (
              <Alert severity="info" sx={{ mt: 1 }}>
                {t('auth.registerForm.verificandoCodigo')}
              </Alert>
            )}

            {slotReference && (
              <Alert severity="success" sx={{ mt: 1 }}>
                {t('auth.registerForm.codigoValido')}
              </Alert>
            )}
          </>
        ) : (
          <Input
            label={t('auth.registerForm.cial')}
            name="cial"
            value={formData.cial}
            onChange={handleChange}
            required
          />
        )}

        <Input
          label={t('auth.registerForm.password')}
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          value={formData.password}
          onChange={handleChange}
          required
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={t('auth.registerForm.ariaRevealPassword')}
                  onClick={togglePasswordVisibility}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          helperText={t('auth.registerForm.strongPasswordHint')}
        />

        <Input
          label="Confirmar Contraseña"
          name="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          error={
            formData.confirmPassword.length > 0 &&
            formData.password !== formData.confirmPassword
          }
          helperText={
            formData.confirmPassword.length > 0 &&
            formData.password !== formData.confirmPassword
              ? t('auth.registerForm.errorPasswordMismatch')
              : ' '
          }
        />

        <Button
          type="submit"
          isLoading={isLoading}
          disabled={isSubmitDisabled}
          sx={{ mt: 0, mb: 0 }}
        >
          {role === SYSTEM_ROLES.ALUMNO
            ? t('auth.registerForm.submitAlumno')
            : t('auth.registerForm.submitProfesor')}
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <SecondaryActionButton onClick={() => onToggleForm()}>
            {t('auth.registerForm.alreadyHaveAccount')}
          </SecondaryActionButton>
        </Box>
      </Box>
    </Box>
  );
};

export default RegisterForm;
