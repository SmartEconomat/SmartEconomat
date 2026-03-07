import React, { useState } from 'react';
import { Box, Typography, Link, InputAdornment, IconButton, Alert, ToggleButton, ToggleButtonGroup } from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Logo from '../../../assets/images/SVG/logo-smat-economato.svg';

interface RegisterFormProps {
    onToggleForm: () => void;
    onRegisterSuccess: () => void;
}

import { authService } from '../../../services/auth.service';

const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleForm, onRegisterSuccess }) => {
    const [role, setRole] = useState<'ALUMNO' | 'PROFESOR'>('ALUMNO');
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        aula: '',
        numeroClase: 1,
        cialProfesor: '',
        cial: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleRoleChange = (
        _event: React.MouseEvent<HTMLElement>,
        newRole: 'ALUMNO' | 'PROFESOR' | null,
    ) => {
        if (newRole) {
            setRole(newRole);
            setErrorMsg('');
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);

        try {
            const isAlumno = role === 'ALUMNO';
            const payload: any = {
                username: formData.username,
                password: formData.password
            };

            if (formData.email && formData.email.trim() !== '') {
                payload.email = formData.email.trim();
            }

            if (isAlumno) {
                payload.aula = formData.aula;
                payload.numeroClase = Number(formData.numeroClase);
                payload.cialProfesor = formData.cialProfesor;
            } else {
                payload.cial = formData.cial;
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const togglePasswordVisibility = () => setShowPassword(v => !v);

    return (
        <Box sx={{ my: { xs: 2, md: 4 }, mx: 4, pt: { xs: 2, md: 0 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            <Box sx={{ mb: 1, mt: { xs: 0, md: 1 } }}>
                <img
                    src={Logo}
                    alt="SmartEconomat"
                    style={{ height: 'clamp(70px, 12vw, 100px)', width: 'auto' }}
                />
            </Box>

            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
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
                <ToggleButton value="ALUMNO" sx={{ px: 3 }}>Alumno</ToggleButton>
                <ToggleButton value="PROFESOR" sx={{ px: 3 }}>Profesor</ToggleButton>
            </ToggleButtonGroup>

            {errorMsg && <Alert severity="error" sx={{ width: '100%', maxWidth: 400, mb: 2 }}>{errorMsg}</Alert>}

            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 400 }}>
                <Input label="Nombre de Usuario" name="username" autoComplete="username" value={formData.username} onChange={handleChange} required />
                <Input label="Correo Electrónico (Opcional)" name="email" type="email" value={formData.email} onChange={handleChange} />

                {role === 'ALUMNO' ? (
                    <>
                        <Input label="Aula" name="aula" value={formData.aula} onChange={handleChange} required />
                        <Input label="Número de Clase" name="numeroClase" type="number" value={formData.numeroClase} onChange={handleChange} required />
                        <Input label="CIAL del Profesor" name="cialProfesor" value={formData.cialProfesor} onChange={handleChange} required />
                    </>
                ) : (
                    <Input label="CIAL (DNI o Identificador)" name="cial" value={formData.cial} onChange={handleChange} required />
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
                                <IconButton aria-label="revelar contraseña" onClick={togglePasswordVisibility} edge="end">
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                <Button type="submit" isLoading={isLoading} sx={{ mt: 3, mb: 0 }}>Registrarse como {role === 'ALUMNO' ? 'Alumno' : 'Profesor'}</Button>

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
