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
import Logo from '../../../assets/images/SVG/logo-smat-economato.svg';
import {
  authService,
  SlotReferenceResponse,
} from '../../../services/auth.service';
import {
  isStrongPassword,
  STRONG_PASSWORD_MESSAGE,
} from '../../../utils/passwordValidation';
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
    ? t('auth.register.registeringInClass', {
        aula: slotReference.aula,
        numeroClase: slotReference.numeroClase,
        profesor: slotReference.profesor,
      })
    : '';

  const codigoClaseHelperText = slotLoadError
    ? slotLoadError
    : slotReference
      ? t('auth.register.codeVerified')
      : t('auth.register.codeHelperDefault');

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
              'No se pudo validar el código de la clase.'
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
        setErrorMsg(t('auth.register.passwordMismatch'));
        return;
      }

      if (!isStrongPassword(formData.password)) {
        setErrorMsg(STRONG_PASSWORD_MESSAGE);
        return;
      }

      if (isAlumno) {
        if (!formData.codigoClase.trim()) {
          setErrorMsg(t('auth.register.classcodeRequired'));
          return;
        }

        if (!slotReference) {
          setErrorMsg(t('auth.register.classcodeInvalid'));
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
              'No se pudo completar el registro.'
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
            'No se pudo completar el registro.'
          )
        );
      }
    } catch (err) {
      setErrorMsg(
        getAuthErrorMessage(
          err,
          isAlumno ? 'registerAlumno' : 'registerProfesor',
          'Error de conexión con el servidor.'
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
      <Box sx={{ mb: 1, mt: { xs: 0, md: 1 } }}>
        <img
          src={Logo}
          alt="SmartEconomat"
          style={{ height: 'clamp(70px, 12vw, 100px)', width: 'auto' }}
        />
      </Box>

      <Typography
        variant="h6"
        sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}
      >
        {t('auth.register.title')}
      </Typography>

      <ToggleButtonGroup
        color="primary"
        value={role}
        exclusive
        onChange={handleRoleChange}
        aria-label={t('auth.register.roleLabel')}
        sx={{ mb: 3 }}
        size="small"
      >
        <ToggleButton value={SYSTEM_ROLES.ALUMNO} sx={{ px: 3 }}>
          {t('auth.register.roleAlumno')}
        </ToggleButton>
        <ToggleButton value={SYSTEM_ROLES.PROFESOR} sx={{ px: 3 }}>
          {t('auth.register.roleProfesor')}
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
          label={t('auth.register.username')}
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
            label={t('auth.register.email')}
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
              label={t('auth.register.classCode')}
              name="codigoClase"
              value={formData.codigoClase}
              onChange={handleChange}
              required
              error={!!slotLoadError}
              helperText={codigoClaseHelperText}
            />

            {isLoadingData && formData.codigoClase.trim().length > 0 && (
              <Alert severity="info" sx={{ mt: 1 }}>
                {t('auth.register.verifyingCode')}
              </Alert>
            )}

            {slotReference && (
              <Alert severity="success" sx={{ mt: 1 }}>
                {t('auth.register.codeValid')}
              </Alert>
            )}
          </>
        ) : (
          <Input
            label={t('auth.register.cial')}
            name="cial"
            value={formData.cial}
            onChange={handleChange}
            required
          />
        )}

        <Input
          label={t('auth.register.password')}
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
                  aria-label={t('auth.login.showPassword')}
                  onClick={togglePasswordVisibility}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          helperText={STRONG_PASSWORD_MESSAGE}
        />

        <Input
          label={t('auth.register.confirmPassword')}
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
              ? t('auth.register.passwordMismatch')
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
            ? t('auth.register.submitAsAlumno')
            : t('auth.register.submitAsProfesor')}
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => onToggleForm()}
            sx={{ mt: 1, fontSize: '0.875rem', textTransform: 'none' }}
          >
            {t('auth.register.alreadyHaveAccount')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default RegisterForm;
