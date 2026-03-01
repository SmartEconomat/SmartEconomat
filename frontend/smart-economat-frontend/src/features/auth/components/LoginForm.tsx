import React, { useState } from 'react';
import { Box, Typography, Link, InputAdornment, IconButton, Alert } from '@mui/material';
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
 * Delega la navegación al padre mediante `onLoginSuccess` para permitir la
 * animación de salida antes de llamar a AuthContext.login().
 */
const LoginForm: React.FC<LoginFormProps> = ({ onToggleForm, onLoginSuccess }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [forgotSuccess, setForgotSuccess] = useState('');

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

    const handleForgotSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMsg('');
        setForgotSuccess('');

        if (!formData.email.trim()) {
            setErrorMsg('Por favor ingresa tu correo electrónico.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/v1/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email }),
            });
            if (res.ok) {
                setForgotSuccess('Si el correo electrónico figura en nuestro sistema, recibirás instrucciones para restablecer tu contraseña en breve.');
            } else {
                const err = await res.json();
                console.error('Forgot password error:', res.status, err);
                setErrorMsg(err.message || 'Error al procesar la solicitud.');
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

    const togglePasswordVisibility = () => setShowPassword(v => !v);

    return (
        <Box sx={{ my: { xs: 4, md: 8 }, mx: 4, pt: { xs: 2, md: 0 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography component="h1" sx={visuallyHidden}>Iniciar Sesión en Smart Economat</Typography>

            {/* Logo responsivo: más pequeño en móvil, más grande en desktop */}
            <Box sx={{ mb: 1, mt: { xs: 0, md: 1 } }}>
                <img
                    src={Logo}
                    alt="SmartEconomat"
                    style={{ height: 'clamp(90px, 15vw, 130px)', width: 'auto' }}
                />
            </Box>

            {errorMsg && (
                <Alert severity="error" sx={{ width: '100%', maxWidth: 400, mt: 2 }}>
                    {errorMsg}
                </Alert>
            )}

            {forgotSuccess && (
                <Alert severity="success" sx={{ width: '100%', maxWidth: 400, mt: 2 }}>
                    {forgotSuccess}
                </Alert>
            )}

            {isForgotPassword ? (
                <Box component="form" noValidate onSubmit={handleForgotSubmit} sx={{ mt: 1, width: '100%', maxWidth: 400 }}>
                    <Typography variant="body1" sx={{ textAlign: 'center', mb: 2, color: 'text.secondary' }}>
                        Introduce la dirección de correo electrónico vinculada a tu cuenta para recibir un enlace temporal de reestablecimiento.
                    </Typography>
                    <Input
                        label="Correo Electrónico"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={formData.email}
                        onChange={handleChange}
                    />
                    <Button type="submit" isLoading={isLoading} sx={{ mt: 2, mb: 0 }}>Restablecer Contraseña</Button>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center', mt: 1 }}>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => { setIsForgotPassword(false); setForgotSuccess(''); setErrorMsg(''); }}
                            sx={{ mt: 1 }}
                        >
                            Volver al inicio de sesión
                        </Button>
                        <Link
                            href="#"
                            variant="body2"
                            onClick={e => { e.preventDefault(); onToggleForm(); }}
                        >
                            ¿No tienes cuenta? Regístrate aquí.
                        </Link>
                    </Box>
                </Box>
            ) : (
                <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1, width: '100%', maxWidth: 400 }}>
                    <Input
                        label="Usuario o Email"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={formData.email}
                        onChange={handleChange}
                    />
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
                    <Button type="submit" isLoading={isLoading} sx={{ mt: 2, mb: 0 }}>Acceder</Button>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center', mt: 1 }}>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => onToggleForm()}
                            sx={{ mt: 1 }}
                        >
                            ¿No tienes cuenta? Regístrate aquí.
                        </Button>
                        <Link href="#" variant="body2" onClick={(e) => { e.preventDefault(); setIsForgotPassword(true); setErrorMsg(''); setForgotSuccess(''); }}>
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default LoginForm;
