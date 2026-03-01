import React, { useState } from 'react';
import { Box, Typography, Link, InputAdornment, IconButton, Alert } from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Logo from '../../../assets/images/SVG/logo-smat-economato.svg';

/**
 * Propiedades del componente RegisterForm.
 * @interface RegisterFormProps
 * @property {() => void} onToggleForm     - Vuelve al formulario de inicio de sesión.
 * @property {() => void} onRegisterSuccess - Invocado cuando el registro es exitoso.
 *   El padre (`Login.tsx`) se encarga de la animación de salida y el mensaje de confirmación.
 */
interface RegisterFormProps {
    onToggleForm: () => void;
    onRegisterSuccess: () => void;
}

/**
 * Formulario de alta de nuevos usuarios.
 *
 * Recopila nombre, username, email y contraseña con toggle de visibilidad.
 * Al completar el registro con éxito invoca `onRegisterSuccess` para que el
 * componente padre ejecute la animación de transición y el mensaje de confirmación.
 *
 * @param {RegisterFormProps} props - Propiedades del componente.
 * @returns {JSX.Element} Formulario de registro interactivo.
 */
const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleForm, onRegisterSuccess }) => {
    const [formData, setFormData] = useState({ nombre: '', username: '', email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                // El padre gestiona la animación y el mensaje de éxito
                onRegisterSuccess();
            } else {
                const err = await res.json();
                setErrorMsg(Array.isArray(err.message) ? err.message.join(', ') : err.message || 'Error en el registro');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setErrorMsg('Error de conexión con el servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    /** Alterna la visibilidad del campo de contraseña. */
    const togglePasswordVisibility = () => setShowPassword(v => !v);

    return (
        <Box sx={{ my: { xs: 4, md: 8 }, mx: 4, pt: { xs: 2, md: 0 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            {/* Logo responsivo: más pequeño en móvil, más grande en desktop */}
            <Box sx={{ mb: 1, mt: { xs: 0, md: 1 } }}>
                <img
                    src={Logo}
                    alt="SmartEconomat"
                    style={{ height: 'clamp(90px, 15vw, 130px)', width: 'auto' }}
                />
            </Box>

            {errorMsg && <Alert severity="error" sx={{ width: '100%', maxWidth: 400, mt: 2 }}>{errorMsg}</Alert>}

            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1, width: '100%', maxWidth: 400 }}>
                <Input label="Nombre Completo" name="nombre" autoComplete="name" autoFocus value={formData.nombre} onChange={handleChange} />
                <Input label="Nombre de Usuario" name="username" autoComplete="username" value={formData.username} onChange={handleChange} />
                <Input label="Correo Electrónico" name="email" type="email" autoComplete="email" value={formData.email} onChange={handleChange} />
                <Input
                    label="Contraseña"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
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

                <Button type="submit" isLoading={isLoading} sx={{ mt: 4, mb: 0 }}>Registrarse</Button>

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => onToggleForm()}
                        sx={{ mt: 1 }}
                    >
                        ¿Ya tienes cuenta? Inicia sesión
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default RegisterForm;
