import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    CircularProgress,
    Box
} from '@mui/material';
import { Usuario, CrearUsuarioDTO, ActualizarUsuarioDTO } from '../../types/usuario';
import { useToast } from '../../store/ToastContext';
import SelectField from '../../components/ui/SelectField';
import InputField from '../../components/ui/InputField';

export interface UserModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: CrearUsuarioDTO | ActualizarUsuarioDTO) => Promise<void>;
    userToEdit?: Usuario | null;
    isSaving?: boolean;
    usuariosList: Usuario[];
}

const UserModal: React.FC<UserModalProps> = ({
    open,
    onClose,
    onSave,
    userToEdit,
    isSaving = false,
    usuariosList
}) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        rol: 'Alumno',
        estado: 'Inactivo'
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const toast = useToast();

    useEffect(() => {
        if (open) {
            if (userToEdit) {
                setFormData({
                    username: userToEdit.username,
                    email: userToEdit.email,
                    rol: userToEdit.rol,
                    estado: userToEdit.estado
                });
            } else {
                setFormData({
                    username: '',
                    email: '',
                    rol: 'Alumno',
                    estado: 'Inactivo'
                });
            }
            setErrors({});
        }
    }, [open, userToEdit]);

    const handleChange = (field: keyof typeof formData) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const isLastAdmin = () => {
        if (!userToEdit || userToEdit.rol !== 'Administrador') return false;

        // Count how many administrators currently exist
        const adminCount = usuariosList.filter(u => u.rol === 'Administrador' && u.estado === 'Activo').length;

        // If we only have 1 active admin (this one), they cannot change their role or status to Inactive
        return adminCount <= 1;
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.username.trim()) newErrors.username = 'El usuario es obligatorio';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.rol !== 'Alumno') {
            if (!formData.email.trim()) {
                newErrors.email = 'El correo es obligatorio';
            } else if (!emailRegex.test(formData.email)) {
                newErrors.email = 'Formato de correo inválido';
            }
        }

        if (isLastAdmin()) {
            if (formData.rol !== 'Administrador') {
                newErrors.rol = 'No puedes quitar el último administrador activo.';
                toast.error('Operación denegada. El sistema debe retener al menos un Administrador activo.');
            }
            if (formData.estado === 'Inactivo') {
                newErrors.estado = 'No puedes desactivar el último administrador.';
                if (!newErrors.rol) toast.error('Operación denegada. El sistema debe retener al menos un Administrador activo.');
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validate()) {
            onSave(formData as CrearUsuarioDTO | ActualizarUsuarioDTO);
        }
    };

    const isEditMode = !!userToEdit;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>
                {isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
            <DialogContent dividers>
                <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 1 }}>
                    <InputField
                        id="user-username"
                        fullWidth
                        label="Nombre de Usuario"
                        value={formData.username}
                        onChange={handleChange('username')}
                        error={!!errors.username}
                        helperText={errors.username}
                        disabled={isSaving}
                        required
                    />
                    {formData.rol !== 'Alumno' && (
                        <InputField
                            id="user-email"
                            fullWidth
                            label="Correo Electrónico"
                            type="email"
                            value={formData.email}
                            onChange={handleChange('email')}
                            error={!!errors.email}
                            helperText={errors.email}
                            disabled={isSaving}
                            required
                        />
                    )}
                    <Box display="flex" gap={2} flexWrap="wrap">
                        <Box flex={1} minWidth="200px">
                            <SelectField
                                fullWidth
                                id="user-role-select"
                                label="Rol"
                                value={formData.rol}
                                onChange={handleChange('rol') as any}
                                error={!!errors.rol}
                                helperText={errors.rol}
                                disabled={isSaving}
                                options={[
                                    { value: 'Administrador', label: 'Administrador' },
                                    { value: 'Profesor', label: 'Profesor' },
                                    { value: 'Alumno', label: 'Alumno' }
                                ]}
                            />
                        </Box>
                        <Box flex={1} minWidth="200px">
                            <SelectField
                                fullWidth
                                id="user-status-select"
                                label="Estado"
                                value={formData.estado}
                                onChange={handleChange('estado') as any}
                                error={!!errors.estado}
                                helperText={errors.estado}
                                disabled={isSaving}
                                options={[
                                    { value: 'Activo', label: 'Activo' },
                                    { value: 'Inactivo', label: 'Inactivo' }
                                ]}
                            />
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit" disabled={isSaving}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    color="primary"
                    disabled={isSaving}
                    startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserModal;
