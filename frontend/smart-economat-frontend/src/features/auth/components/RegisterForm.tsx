import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Logo from '../../../assets/images/SVG/logo-smat-economato.svg';
import {
  isStrongPassword,
  STRONG_PASSWORD_MESSAGE,
} from '../../../utils/passwordValidation';
import { authService } from '../../../services/auth.service';

interface RegisterFormProps {
  onToggleForm: () => void;
  onRegisterSuccess: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onToggleForm,
  onRegisterSuccess,
}) => {
  const [role, setRole] = useState<'ALUMNO' | 'PROFESOR'>('ALUMNO');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    aula: '',
    numeroClase: '',
    cialProfesor: '',
    cial: '',
  });

  const [aulas, setAulas] = useState<string[]>([]);
  const [clases, setClases] = useState<number[]>([]);
  const [profesores, setProfesores] = useState<{ cial: string; nombre: string }[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch aulas on mount for ALUMNO
  useEffect(() => {
    if (role === 'ALUMNO') {
      loadAulas();
    }
  }, [role]);

  // Fetch clases when aula changes
  useEffect(() => {
    if (role === 'ALUMNO' && formData.aula) {
      loadClases(formData.aula);
    } else {
      setClases([]);
      setFormData(prev => ({ ...prev, numeroClase: '', cialProfesor: '' }));
    }
  }, [formData.aula, role]);

  // Fetch profesores when clase changes
  useEffect(() => {
    if (role === 'ALUMNO' && formData.aula && formData.numeroClase) {
      loadProfesores(formData.aula, Number(formData.numeroClase));
    } else {
      setProfesores([]);
      setFormData(prev => ({ ...prev, cialProfesor: '' }));
    }
  }, [formData.numeroClase, role, formData.aula]);

  const loadAulas = async () => {
    try {
      setIsLoadingData(true);
      const res = await authService.getAulas();
      if (res.success) {
        setAulas(res.data);
      }
    } catch (err) {
      console.error('Error fetching aulas:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadClases = async (aula: string) => {
    try {
      setIsLoadingData(true);
      const res = await authService.getClases(aula);
      if (res.success) {
        setClases(res.data);
      }
    } catch (err) {
      console.error('Error fetching clases:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadProfesores = async (aula: string, clase: number) => {
    try {
      setIsLoadingData(true);
      const res = await authService.getProfesores(aula, clase);
      if (res.success) {
        setProfesores(res.data);
      }
    } catch (err) {
      console.error('Error fetching profesores:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleRoleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newRole: 'ALUMNO' | 'PROFESOR' | null
  ) => {
    if (newRole) {
      setRole(newRole);
      setErrorMsg('');
      setFormData({
        username: '',
        email: '',
        password: '',
        aula: '',
        numeroClase: '',
        cialProfesor: '',
        cial: '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const isAlumno = role === 'ALUMNO';

      if (!isStrongPassword(formData.password)) {
        setErrorMsg(STRONG_PASSWORD_MESSAGE);
        return;
      }

      const payload: any = {
        username: formData.username?.trim(),
        password: formData.password,
      };

      if (isAlumno) {
        if (!formData.aula || !formData.numeroClase || !formData.cialProfesor) {
          setErrorMsg('Por favor completa todos los campos de ubicación (Aula, Clase y Profesor).');
          return;
        }
        payload.aula = formData.aula;
        payload.numeroClase = Number(formData.numeroClase);
        payload.cialProfesor = formData.cialProfesor;
      } else {
        payload.email = formData.email?.trim();
        payload.cial = formData.cial?.trim()?.toUpperCase();
      }

      const res = isAlumno
        ? await authService.registerAlumno(payload)
        : await authService.registerProfesor(payload);

      if (res.success) {
        onRegisterSuccess();
      } else {
        setErrorMsg(res.message || 'Error en el registro');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: any
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        Crear una cuenta
      </Typography>

      <ToggleButtonGroup
        color="primary"
        value={role}
        exclusive
        onChange={handleRoleChange}
        aria-label="Rol de usuario"
        sx={{ mb: 3 }}
        size="small"
      >
        <ToggleButton value="ALUMNO" sx={{ px: 3 }}>
          Alumno
        </ToggleButton>
        <ToggleButton value="PROFESOR" sx={{ px: 3 }}>
          Profesor
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
          label="Nombre de Usuario"
          name="username"
          autoComplete="username"
          value={formData.username}
          onChange={handleChange}
          required
        />
        {role === 'PROFESOR' && (
          <Input
            label="Correo Electrónico"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        )}

        {role === 'ALUMNO' ? (
          <>
            <Select
              label="Aula"
              name="aula"
              value={formData.aula}
              onChange={handleChange}
              options={aulas.map(a => ({ value: a, label: a }))}
              required
              disabled={isLoadingData && aulas.length === 0}
            />
            <Select
              label="Número de Clase"
              name="numeroClase"
              value={formData.numeroClase}
              onChange={handleChange}
              options={clases.map(c => ({ value: String(c), label: `Clase ${c}` }))}
              required
              disabled={!formData.aula || (isLoadingData && clases.length === 0)}
            />
            <Select
              label="Profesor"
              name="cialProfesor"
              value={formData.cialProfesor}
              onChange={handleChange}
              options={profesores.map(p => ({ value: p.cial, label: p.nombre }))}
              required
              disabled={!formData.numeroClase || (isLoadingData && profesores.length === 0)}
              helperText="Selecciona el profesor encargado de evaluarte"
            />
          </>
        ) : (
          <Input
            label="CIAL (DNI o Identificador)"
            name="cial"
            value={formData.cial}
            onChange={handleChange}
            required
          />
        )}

        <Input
          label="Contraseña"
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
                  aria-label="revelar contraseña"
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

        <Button type="submit" isLoading={isLoading} sx={{ mt: 3, mb: 0 }}>
          Registrarse como {role === 'ALUMNO' ? 'Alumno' : 'Profesor'}
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <Button
            variant="text"
            onClick={() => onToggleForm()}
            sx={{ mt: 1, fontSize: '0.875rem', textTransform: 'none' }}
          >
            ¿Ya tienes cuenta? Inicia sesión aquí
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default RegisterForm;
