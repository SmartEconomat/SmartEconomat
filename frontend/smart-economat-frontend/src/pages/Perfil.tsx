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
    DialogActions
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

import ProfileForm from '../features/profile/components/ProfileForm';
import ChangePasswordForm from '../features/profile/components/ChangePasswordForm';
import ProfessorSlotsManager from '../features/profile/components/ProfessorSlotsManager';
import ProfessorStudentList from '../features/profile/components/ProfessorStudentList';

import { useAuth, User } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import { authService as authSvc } from '../services/authService';
import { profesorService, AlumnoSlot, Alumno } from '../services/profesor.service';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

/**
 * Página de Perfil - Unificada como una Ficha de Usuario.
 */
const Perfil: React.FC = () => {
    const { user, login } = useAuth();
    const toast = useToast();
    const isProfesor = user?.rol?.toUpperCase() === 'PROFESOR';

    // Estados de la Ficha
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isEditingSlots, setIsEditingSlots] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Datos del formulario unificado
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

    // Datos de Slots (para profesores)
    const [slots, setSlots] = useState<AlumnoSlot[]>([]);
    const [newSlot, setNewSlot] = useState({ aula: '', numeroClase: '', capacidad: '' });

    // Datos de Alumnos (para profesores)
    const [students, setStudents] = useState<Alumno[]>([]);

    // Estado para modal de email
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailRequest, setEmailRequest] = useState({ newEmail: '', confirmNewEmail: '', justification: '' });

    const isInitialized = useRef(false);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                // Forzamos actualización desde el backend para tener datos frescos
                const updatedUser = await authSvc.getCurrentUser();
                setProfileData({
                    username: updatedUser.username || updatedUser.name,
                    email: updatedUser.email,
                    usernameAlias: updatedUser.username || '',
                });
                login(updatedUser, localStorage.getItem('token') || '');

                if (isProfesor) {
                    // [BACKEND PENDIENTE] Falta implementar GET /profesores/slots
                    // const slotRes = await profesorService.getSlots();
                    // if (slotRes.success) setSlots(slotRes.data);
                    
                    const studentRes = await profesorService.getAlumnos();
                    if (studentRes.success) setStudents(studentRes.data);
                }
            } catch (err) {
                console.error("Error loading profile data", err);
                if (user) {
                    setProfileData({
                        username: user.username || user.name,
                        email: user.email,
                        usernameAlias: user.username || '',
                    });
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (!isInitialized.current) {
            loadInitialData();
            isInitialized.current = true;
        }
    }, [isProfesor, login, user]);

    // Handlers
    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleNewSlotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewSlot(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleProfileSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            // 1. Guardar cambios de perfil si el nombre cambió
            if (profileData.username !== (user?.username || user?.name)) {
                await authSvc.updateProfile({ username: profileData.username });
            }

            // 2. Cambiar contraseña si se rellenaron los campos
            if (passwordData.newPassword) {
                if (passwordData.newPassword !== passwordData.confirmPassword) {
                    throw new Error("Las contraseñas no coinciden.");
                }
                await authSvc.changePassword(passwordData.currentPassword, passwordData.newPassword);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }

            toast.success("Perfil actualizado correctamente");
            
            // Refrescar datos locales
            const updatedUser = await authSvc.getCurrentUser();
            login(updatedUser, localStorage.getItem('token') || '');
            
            setIsEditingProfile(false);
        } catch (err: any) {
            setError(err.message || "Error al guardar los cambios");
            toast.error("Error al actualizar el perfil");
        } finally {
            setIsSaving(false);
        }
    };

    const handleProfileCancel = () => {
        // Resetear a datos actuales
        if (user) {
            setProfileData({
                username: user.username || user.name,
                email: user.email,
                usernameAlias: user.username || '',
            });
        }
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setIsEditingProfile(false);
        setError(null);
    };

    // Slot Management Actions
    const handleCreateSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await profesorService.createSlot({
                aula: newSlot.aula.trim(),
                numeroClase: Number(newSlot.numeroClase),
                capacidad: Number(newSlot.capacidad)
            });
            if (res.success) {
                setSlots(prev => [...prev, res.data]);
                setNewSlot({ aula: '', numeroClase: '', capacidad: '' });
                toast.success("Aula/Clase añadida con éxito");
            } else {
                toast.error(res.message);
            }
        } catch (err) {
            toast.error("Error al crear la clase");
        }
    };

    const handleDeleteSlot = async (id: string) => {
        try {
            const res = await profesorService.deleteSlot(id);
            if (res.success) {
                setSlots(prev => prev.filter(s => s.id !== id));
                toast.success("Ubicación eliminada");
            }
        } catch (err) {
            toast.error("No se pudo eliminar");
        }
    };

    // Student Management Actions
    const handleToggleStudentStatus = async (id: string, currentStatus: string) => {
        setIsSaving(true);
        try {
            const res = await profesorService.activateAlumno(id);
            if (res.success) {
                // El backend devuelve el nuevo status en res.data.status
                const newStatus = res.data?.status || (currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
                setStudents(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
                toast.success(`Estado de alumno actualizado`);
            }
        } catch (err) {
            toast.error("Error al cambiar estado");
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetStudentPassword = async (id: string) => {
        try {
            const res = await profesorService.forcePasswordReset(id);
            if (res.success) {
                toast.success(`Contraseña reseteada. Nueva clave: ${res.data.provisionalPassword}`, 10000);
            }
        } catch (err) {
            toast.error("Error al resetear contraseña");
        }
    };

    const handleDeleteStudent = async (id: string) => {
        if (!window.confirm("¿Seguro que quieres eliminar a este alumno?")) return;
        try {
            const res = await profesorService.removeStudent(id);
            if (res.success) {
                setStudents(prev => prev.filter(s => s.id !== id));
                toast.success("Alumno eliminado");
            }
        } catch (err) {
            toast.error("No se pudo eliminar");
        }
    };

    const handleManagePermissions = (alumno: Alumno) => {
        toast.info(`Funcionalidad de permisos para ${alumno.username} proximamente`);
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4, px: { xs: 1, sm: 2, md: 3 } }}>
            {/* Cabecera */}
            <Box mb={{ xs: 3, md: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom color="primary.main" sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
                    Perfil de Usuario
                </Typography>
                <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
                    <Link underline="hover" color="inherit" component={RouterLink} to="/">Inicio</Link>
                    <Typography color="text.primary" fontWeight={500}>Mi Perfil</Typography>
                </Breadcrumbs>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            <Stack spacing={4}>
                {/* TARJETA 1: DATOS PERSONALES Y SEGURIDAD */}
                <Card elevation={2} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                    <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                        <Stack spacing={6}>
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
                                        sx={{ borderRadius: 3, px: 4, width: { xs: '100%', sm: 'auto' } }}
                                    >
                                        Editar Perfil
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
                                            Cancelar
                                        </Button>
                                        <Button 
                                            color="primary" 
                                            startIcon={<SaveIcon />} 
                                            onClick={handleProfileSave}
                                            isLoading={isSaving}
                                            sx={{ px: 4, width: { xs: '100%', sm: 'auto' } }}
                                        >
                                            Guardar Cambios
                                        </Button>
                                    </>
                                )}
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>

                {/* TARJETA 2: GESTIÓN EDUCATIVA (SOLO PROFESORES) */}
                {isProfesor && (
                    <Card elevation={2} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                            <Stack spacing={6}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h5" fontWeight={700}>Gestión Académica</Typography>
                                </Box>
                                
                                <ProfessorSlotsManager 
                                    isEditing={isEditingSlots}
                                    slots={slots}
                                    isLoading={false}
                                    isSaving={false}
                                    newSlot={newSlot}
                                    onNewSlotChange={handleNewSlotChange}
                                    onCreateSlot={handleCreateSlot}
                                    onDeleteSlot={handleDeleteSlot}
                                />

                                <Divider />

                                <ProfessorStudentList 
                                    students={students}
                                    slots={slots}
                                    isLoading={isLoading}
                                    onToggleStatus={handleToggleStudentStatus}
                                    onResetPassword={handleResetStudentPassword}
                                    onManagePermissions={handleManagePermissions}
                                    onDeleteStudent={handleDeleteStudent}
                                    isSaving={isSaving}
                                />

                                <Divider />

                                <Box 
                                    display="flex" 
                                    flexDirection={{ xs: 'column-reverse', sm: 'row' }} 
                                    justifyContent="flex-end" 
                                    gap={2}
                                    pt={2}
                                >
                                    <Button 
                                        variant={isEditingSlots ? "outlined" : "contained"}
                                        color={isEditingSlots ? "inherit" : "primary"}
                                        startIcon={isEditingSlots ? <CancelIcon /> : <EditIcon />}
                                        onClick={() => setIsEditingSlots(!isEditingSlots)}
                                        sx={{ borderRadius: 3, px: 4, width: { xs: '100%', sm: 'auto' } }}
                                    >
                                        {isEditingSlots ? "Finalizar Edición" : "Gestionar Clases"}
                                    </Button>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                )}
            </Stack>

            {/* Modal para solicitud de email */}
            <Dialog open={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Solicitar Cambio de Email</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ my: 2 }}>
                        Contacta con administración para realizar este cambio. Por favor, indica el nuevo email y el motivo.
                    </Typography>
                    <Stack spacing={2}>
                        <Input name="newEmail" label="Nuevo Email" type="email" value={emailRequest.newEmail} onChange={e => setEmailRequest({...emailRequest, newEmail: e.target.value})} />
                        <Input name="justification" label="Justificación" multiline rows={3} value={emailRequest.justification} onChange={e => setEmailRequest({...emailRequest, justification: e.target.value})} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button variant="outlined" onClick={() => setIsEmailModalOpen(false)}>Cancelar</Button>
                    <Button onClick={() => { toast.success("Solicitud enviada"); setIsEmailModalOpen(false); }}>Enviar Solicitud</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Perfil;
