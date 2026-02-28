import React, { useState } from 'react';
import { Box, Typography, Link, InputAdornment, IconButton, Alert } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Checkbox from '../../../components/ui/Checkbox';
import Logo from '../../../assets/images/SVG/logo-smat-economato.svg';
import { User } from '../../../store/AuthContext';

const visuallyHidden = {
    border: 0, clip: 'rect(0 0 0 0)', height: '1px', margin: -1,
    overflow: 'hidden', padding: 0, position: 'absolute', whiteSpace: 'nowrap', width: '1px',
} as const;

/**
 * Propiedades del componente LoginForm.
 * @interface LoginFormProps
 * @property {() => void} onToggleForm - Callback para cambiar al modo de registro.
 * @property {(user: User, token: string) => void} onLoginSuccess - Callback invocado
 *   cuando el login es exitoso. El padre se encarga de la animación de salida antes de navegar.
 */
interface LoginFormProps {
    onToggleForm: () => void;
    onLoginSuccess: (user: User, token: string) => void;
}

/**
 * Parsea un JWT y devuelve el payload deserializado, o `null` si no es válido.
 * @param {string} token - JWT crudo.
 * @returns {Record<string, any> | null}
 */
function parseJwt(token: string): Record<string, any> | null {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        );
        return JSON.parse(json);
    } catch {
        return null;
    }
}

/**
 * Formulario de inicio de sesión.
 *
 * - Incluye campo de email/usuario y contraseña con toggle de visibilidad.
 * - Al completar correctamente, invoca `onLoginSuccess` con los datos del usuario y el token.
 *   El componente padre (`Login.tsx`) es responsable de ejecutar la animación de salida
 *   y luego llamar a `AuthContext.login()` para navegar al dashboard.
 *
 * @param {LoginFormProps} props - Propiedades del componente.
 * @returns {JSX.Element} Formulario de acceso.
 */
const LoginForm: React.FC<LoginFormProps> = ({ onToggleForm, onLoginSuccess }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);
        try {
            const res = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, password: formData.password }),
            });

            if (res.ok) {
                const json = await res.json();
                const token = json.data?.access_token || json.access_token;
                const dec = token ? parseJwt(token) : null;
                // Delegamos al padre la animación y la navegación
                onLoginSuccess({
                    id: dec?.sub || '',
                    name: dec?.nombre || formData.email,
                    email: formData.email,
                    rol: dec?.role || '',
                    username: dec?.username,
                }, token);
            } else {
                const err = await res.json();
                console.error('Login error:', res.status, err);
                setErrorMsg('Credenciales inválidas, intenta de nuevo.');
            }
        } catch (err) {
            console.error('Network error:', err);
            setErrorMsg('Error de conexión al servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    /** Alterna la visibilidad del campo de contraseña. */
    const togglePasswordVisibility = () => setShowPassword(v => !v);

    return (
        <Box sx={{ my: 8, mx: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Logo visible solo en móvil */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                <Box sx={{ width: 80, height: 80, bgcolor: 'primary.main', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    <LockOutlinedIcon sx={{ fontSize: 40, color: 'white' }} />
                </Box>
            </Box>

            <Typography component="h1" sx={visuallyHidden}>Iniciar Sesión en Smart Economat</Typography>

            {/* Logo de SmartEconomat en lugar del icono de candado */}
            <Box sx={{ mb: 1, mt: 1 }}>
                <img src={Logo} alt="SmartEconomat" style={{ height: 150, width: 'auto' }} />
            </Box>
            {/* <Typography component="h2" variant="h5">Smart Economat</Typography> */}

            {errorMsg && <Alert severity="error" sx={{ width: '100%', maxWidth: 400, mt: 2 }}>{errorMsg}</Alert>}

            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1, width: '100%', maxWidth: 400 }}>
                <Input label="Usuario o Email" name="email" autoComplete="email" autoFocus value={formData.email} onChange={handleChange} />
                <Input
                    label="Contraseña"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
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
                <Checkbox value="remember" label="Recordarme" />
                <Button type="submit" isLoading={isLoading} sx={{ mt: 2, mb: 1 }}>Acceder</Button>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center', mt: 2 }}>
                    <Link href="#" variant="body2">¿Olvidaste tu contraseña?</Link>
                    <Link href="#" variant="body2" onClick={e => { e.preventDefault(); onToggleForm(); }}>
                        ¿No tienes cuenta? Regístrate aquí.
                    </Link>
                </Box>
            </Box>
        </Box>
    );
};

export default LoginForm;
