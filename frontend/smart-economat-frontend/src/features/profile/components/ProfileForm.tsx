import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Divider, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { authService } from '../../../services/authService';
import { useAuth, User } from '../../../store/AuthContext';
import { useToast } from '../../../store/ToastContext';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

/**
 * Formulario para editar los datos básicos del perfil.
 */
const ProfileForm: React.FC = () => {
    const { user, login } = useAuth();
    const toast = useToast();

    const [formData, setFormData] = useState({
        nombre: user?.name || '',
        email: user?.email || '',
        username: user?.username || ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estado para el modal de cambio de email
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailFormData, setEmailFormData] = useState({
        newEmail: '',
        confirmNewEmail: '',
        justification: ''
    });
    const [emailError, setEmailError] = useState<string | null>(null);
    const [emailsMatch, setEmailsMatch] = useState<boolean | null>(null);

    // Validación en tiempo real de correos
    useEffect(() => {
        if (emailFormData.newEmail && emailFormData.confirmNewEmail) {
            setEmailsMatch(emailFormData.newEmail === emailFormData.confirmNewEmail);
        } else {
            setEmailsMatch(null);
        }
    }, [emailFormData.newEmail, emailFormData.confirmNewEmail]);

    const isInitialized = React.useRef(false);

    useEffect(() => {
        if (isInitialized.current) return;

        const fetchUserData = async () => {
            setIsLoading(true);
            try {
                const updatedUser = await authService.getCurrentUser();
                setFormData({
                    nombre: updatedUser.name,
                    email: updatedUser.email,
                    username: updatedUser.username || ''
                });
                const token = localStorage.getItem('token') || '';
                login(updatedUser, token);
                isInitialized.current = true;
            } catch (err: any) {
                console.error('Error fetching profile:', err);
                // Si falla pero tenemos el user del context, lo usamos
                if (user) {
                    setFormData({
                        nombre: user.name,
                        email: user.email,
                        username: user.username || ''
                    });
                    isInitialized.current = true;
                } else {
                    setError('No se pudo cargar la información del perfil.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [login, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleEmailModalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setEmailFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleOpenEmailModal = () => {
        setIsEmailModalOpen(true);
        setEmailError(null);
        setEmailFormData({ newEmail: '', confirmNewEmail: '', justification: '' });
    };

    const handleCloseEmailModal = () => {
        setIsEmailModalOpen(false);
    };

    const handleEmailRequestSubmit = async () => {
        setEmailError(null);
        if (emailFormData.newEmail !== emailFormData.confirmNewEmail) {
            setEmailError('Los correos electrónicos no coinciden.');
            return;
        }
        if (!emailFormData.justification.trim()) {
            setEmailError('Debes describir brevemente el por qué deseas cambiarlo.');
            return;
        }

        // Simulación de envío a administración
        setTimeout(() => {
            toast.success('Solicitud enviada a administración correctamente.');
            handleCloseEmailModal();
        }, 1000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            await authService.updateProfile({ nombre: formData.nombre });

            // Actualizar contexto localmente
            if (user) {
                const updatedUser: User = { ...user, name: formData.nombre };
                const token = localStorage.getItem('token') || '';
                login(updatedUser, token);
            }

            toast.success('Perfil actualizado con éxito');
        } catch (err: any) {
            setError(err.message || 'Error al actualizar el perfil');
            toast.error('Error al actualizar el perfil');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    return (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 }, px: { xs: 1.5, sm: 3, md: 4 } }}>
                <Box display="flex" alignItems="center" mb={3}>
                    <PersonOutlineIcon color="primary" sx={{ fontSize: 32, mr: 1.5 }} />
                    <Typography variant="h5" fontWeight={600}>
                        Datos Personales
                    </Typography>
                </Box>
                <Divider sx={{ mb: 4 }} />

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleSubmit}>
                    <Box
                        display="grid"
                        gridTemplateColumns="1fr"
                        gap={0.5}
                        sx={{ mb: 2 }}
                    >
                        <Box>
                            <Input
                                label="Nombre Completo"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                required
                                disabled={isSaving}
                                helperText=" "
                            />
                        </Box>
                        <Box>
                            <Input
                                label="Nombre de Usuario"
                                name="username"
                                value={formData.username}
                                disabled
                                helperText="El nombre de usuario no se puede cambiar"
                            />
                        </Box>
                        <Box>
                            <Input
                                label="Correo Electrónico"
                                name="email"
                                type="email"
                                value={formData.email}
                                disabled
                                helperText="Contacta con administración para cambiar tu email"
                            />
                        </Box>
                    </Box>

                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                        <Button
                            type="submit"
                            color="primary"
                            isLoading={isSaving}
                            sx={{ width: '100%', px: 4 }}
                        >
                            Actualizar
                        </Button>

                        <Button
                            type="button"
                            variant="outlined"
                            color="secondary"
                            onClick={handleOpenEmailModal}
                            sx={{ width: '100%', px: 4 }}
                        >
                            Contactar
                        </Button>
                    </Box>
                </Box>
            </CardContent>

            {/* Modal para solicitar cambio de email */}
            <Dialog
                open={isEmailModalOpen}
                onClose={handleCloseEmailModal}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Solicitar Cambio de Correo</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Typography variant="body2" color="text.secondary">
                            Para cambiar tu correo electrónico necesitas la aprobación de un administrador.
                            Por favor, completa el siguiente formulario.
                        </Typography>

                        {emailError && <Alert severity="error">{emailError}</Alert>}

                        <Input
                            label="Nuevo Correo Electrónico"
                            name="newEmail"
                            type="email"
                            value={emailFormData.newEmail}
                            onChange={handleEmailModalChange}
                            required
                            helperText=" "
                        />
                        <Input
                            label="Confirmar Nuevo Correo"
                            name="confirmNewEmail"
                            type="email"
                            value={emailFormData.confirmNewEmail}
                            onChange={handleEmailModalChange}
                            required
                            error={emailsMatch === false}
                            helperText={
                                emailsMatch === false ? "Los correos no coinciden" :
                                    emailsMatch === true ? "Los correos coinciden" : " "
                            }
                            FormHelperTextProps={{
                                sx: { color: emailsMatch === false ? 'error.main' : 'success.main' }
                            }}
                        />
                        <Input
                            label="Motivo del cambio"
                            name="justification"
                            value={emailFormData.justification}
                            onChange={handleEmailModalChange}
                            required
                            multiline
                            rows={4}
                            placeholder="Justifica brevemente por qué necesitas cambiar tu correo..."
                            helperText=" "
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button variant="outlined" color="inherit" onClick={handleCloseEmailModal}>
                        Cancelar
                    </Button>
                    <Button color="primary" onClick={handleEmailRequestSubmit}>
                        Solicitar Cambio
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

export default ProfileForm;
