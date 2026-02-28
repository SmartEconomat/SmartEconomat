import React, { useState } from 'react';
import {
    Box, Typography, Paper, Avatar, Link
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Checkbox from '../../components/ui/Checkbox';
import { useAuth } from '../../store/AuthContext';

function parseJwt(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

const visuallyHidden = {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: '1px',
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    whiteSpace: 'nowrap',
    width: '1px',
} as const;

export default function Login() {
    const [formData, setFormData] = useState({ email: '', username: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: formData.email || formData.username,
                    password: formData.password
                }),
                // The backend will set an HTTP-only cookie containing the token
            });

            if (response.ok) {
                const json = await response.json();
                // token is still returned in body, parse it for UI data
                const token = json.data?.access_token || json.access_token;
                const decoded = token ? parseJwt(token) : null;

                login({
                    name: decoded?.nombre || formData.email,
                    email: formData.email
                }, token);
            } else {
                const errJson = await response.json();
                console.error('Error logging in:', response.status, errJson);
            }
        } catch (error) {
            console.error('Network error during login:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <Box component="main" sx={{ height: '100vh', display: 'flex' }}>
            {/* Left Side - Branding */}
            <Box
                sx={{
                    flex: { xs: 0, md: 7 },
                    display: { xs: 'none', md: 'flex' },
                    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    position: 'relative',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                    }
                }}
            >
                <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', p: 4 }}>
                    {/* Placeholder for Logo */}
                    <Box
                        sx={{
                            width: 120,
                            height: 120,
                            bgcolor: 'rgba(255,255,255,0.2)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 2rem',
                            backdropFilter: 'blur(10px)',
                        }}
                    >
                        <LockOutlinedIcon sx={{ fontSize: 60, color: 'white' }} />
                    </Box>
                    <Typography component="h2" variant="h3" fontWeight="bold" gutterBottom>
                        Bienvenido a
                    </Typography>
                    <Typography component="span" variant="h2" fontWeight="bold" sx={{ display: 'block' }}>
                        SmartEconomat
                    </Typography>
                </Box>
            </Box>

            {/* Right Side - Form */}
            <Box
                component={Paper}
                elevation={6}
                square
                sx={{
                    flex: { xs: 1, md: 5 },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                }}
            >
                <Box
                    sx={{
                        my: 8,
                        mx: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    {/* Mobile Only Branding */}
                    <Box
                        sx={{
                            display: { xs: 'flex', md: 'none' },
                            flexDirection: 'column',
                            alignItems: 'center',
                            mb: 4
                        }}
                    >
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                bgcolor: 'primary.main',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 2,
                            }}
                        >
                            <LockOutlinedIcon sx={{ fontSize: 40, color: 'white' }} />
                        </Box>
                    </Box>

                    {/* Hidden H1 for accessibility */}
                    <Typography component="h1" sx={visuallyHidden}>
                        Iniciar Sesión en Smart Economat
                    </Typography>

                    <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                        <LockOutlinedIcon />
                    </Avatar>
                    <Typography component="h2" variant="h5">
                        Smart Economat
                    </Typography>
                    <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1, width: '100%', maxWidth: 400 }}>
                        <Input
                            label="Usuario o Email"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={formData.email || formData.username}
                            onChange={handleChange}
                        />
                        <Input
                            label="Contraseña"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <Checkbox
                            value="remember"
                            label="Recordarme"
                        />
                        <Button
                            type="submit"
                            isLoading={isLoading}
                        >
                            Acceder
                        </Button>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Link href="#" variant="body2">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}