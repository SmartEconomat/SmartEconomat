import React, { useState, useEffect, useCallback } from 'react';
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
  Tabs,
  Tab,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import SchoolIcon from '@mui/icons-material/SchoolOutlined';
import PeopleIcon from '@mui/icons-material/PeopleOutlined';

import ProfessorSlotsManager from '../features/profile/components/ProfessorSlotsManager';
import ProfessorStudentList from '../features/profile/components/ProfessorStudentList';
import UsuariosView from './Usuarios/UsuariosView';

import { useAuth } from '../store/auth.hooks';
import { useToast } from '../store/toast.hooks';
import {
  profesorService,
  AlumnoSlot,
  Alumno,
  ProfesorInfo,
} from '../services/profesor.service';
import Button from '../components/ui/Button';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

/**
 * Página de Administración Académica para Profesores con Tabs.
 */
const Administracion: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const userRole = user?.rol?.toUpperCase() || '';
  // isProfesor: controla acceso a la página (admins también tienen acceso)
  const isProfesor =
    userRole === 'PROFESOR' ||
    userRole === 'ADMIN' ||
    userRole === 'SUPER_ADMIN';
  // isPureProfesor: solo el rol PROFESOR tiene perfil de Profesor en BD (los admins NO)
  const isPureProfesor = userRole === 'PROFESOR';

  const [tabValue, setTabValue] = useState(0);
  const [isEditingSlots, setIsEditingSlots] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [slots, setSlots] = useState<AlumnoSlot[]>([]);
  const [allSlots, setAllSlots] = useState<AlumnoSlot[]>([]);
  const [allProfesores, setAllProfesores] = useState<ProfesorInfo[]>([]);
  const [newSlot, setNewSlot] = useState({
    aula: '',
    numeroClase: '',
    capacidad: '',
  });
  const [students, setStudents] = useState<Alumno[]>([]);

  // Estado para Administrador
  const isAdmin =
    userRole === 'ADMIN' ||
    userRole === 'SUPER_ADMIN' ||
    userRole === 'ADMINISTRADOR';

  const loadAlumnos = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isPureProfesor) {
        const studentRes = await profesorService.getAlumnos();
        if (studentRes.success) {
          setStudents(studentRes.data);
        }
      }
    } catch (_err) {
      console.error('Error loading students', _err);
      setError('Error al cargar los alumnos');
    } finally {
      setIsLoading(false);
    }
  }, [isPureProfesor]);

  const loadAulas = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isPureProfesor) {
        const slotsRes = await profesorService.getSlots();
        if (slotsRes.success) setSlots(slotsRes.data);
      }
      if (isAdmin) {
        const allSlotsRes = await profesorService.getAllSlots();
        if (allSlotsRes.success) setAllSlots(allSlotsRes.data);
      }
    } catch {
      console.error('Error loading slots');
      setError('Error al cargar las aulas');
    } finally {
      setIsLoading(false);
    }
  }, [isPureProfesor, isAdmin]);

  const loadProfesores = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isAdmin) {
        const profesoresRes = await profesorService.getAllProfesores();
        if (profesoresRes.success) setAllProfesores(profesoresRes.data);
      }
    } catch {
      console.error('Error loading profesores');
      setError('Error al cargar los profesores');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isProfesor) {
      navigate('/');
      return;
    }

    loadAlumnos();
    loadAulas();
    loadProfesores();
  }, [isProfesor, navigate, loadAlumnos, loadAulas, loadProfesores]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Si cambiamos de tab, cerramos el modo edición de slots por seguridad visual
    if (newValue !== 0) setIsEditingSlots(false);
  };

  const handleNewSlotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewSlot((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await profesorService.createSlot({
        aula: newSlot.aula.trim(),
        numeroClase: Number(newSlot.numeroClase),
        capacidad: Number(newSlot.capacidad),
      });

      if (res.success) {
        setSlots((prev) => [...prev, res.data]);
        setNewSlot({ aula: '', numeroClase: '', capacidad: '' });
        toast.success('Aula/Clase añadida con éxito');
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Error al crear la clase');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    try {
      const res = await profesorService.deleteSlot(id);
      if (res.success) {
        setSlots((prev) => prev.filter((s) => s.id !== id));
        toast.success('Ubicación eliminada');
      }
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  const handleUpdateSlot = async (
    id: string,
    data: Partial<Omit<AlumnoSlot, 'id' | 'codigoSlot'>>
  ) => {
    setIsSaving(true);
    try {
      const res = await profesorService.updateSlot(id, data);
      if (res.success) {
        setSlots((prev) => prev.map((s) => (s.id === id ? res.data : s)));
        toast.success('Ubicación actualizada');
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdminUpdateSlot = async (
    id: string,
    data: Partial<Omit<AlumnoSlot, 'id' | 'codigoSlot'>> & {
      profesorId?: string;
    }
  ) => {
    setIsSaving(true);
    try {
      const res = await profesorService.adminUpdateSlot(id, data);
      if (res.success) {
        // Recargar todos los slots para reflejar el nuevo profesor
        const allSlotsRes = await profesorService.getAllSlots();
        if (allSlotsRes.success) setAllSlots(allSlotsRes.data);
        toast.success('Aula actualizada correctamente');
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Error al actualizar el aula');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStudentStatus = async (
    id: string,
    currentStatus: string
  ) => {
    setIsSaving(true);
    try {
      const res = await profesorService.activateAlumno(id);
      if (res.success) {
        const newStatus =
          res.data?.status ||
          (currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
        setStudents((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
        );
        toast.success('Estado de alumno actualizado');
      }
    } catch {
      toast.error('Error al cambiar estado');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetStudentPassword = async (id: string) => {
    try {
      const res = await profesorService.forcePasswordReset(id);
      if (res.success) {
        toast.success(
          `Contraseña reseteada. Nueva clave: ${res.data.provisionalPassword}`,
          10000
        );
      }
    } catch {
      toast.error('Error al resetear contraseña');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm('¿Seguro que quieres eliminar a este alumno?')) return;

    try {
      const res = await profesorService.removeStudent(id);
      if (res.success) {
        setStudents((prev) => prev.filter((s) => s.id !== id));
        toast.success('Alumno eliminado');
      }
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  const handleManagePermissions = (alumno: Alumno) => {
    toast.info(
      `Funcionalidad de permisos para ${alumno.username} próximamente`
    );
  };

  // Métodos de administración eliminados en favor de UsuariosView

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, px: { xs: 1, sm: 2, md: 3 } }}>
      <Box mb={{ xs: 3, md: 4 }}>
        <Typography
          variant="h4"
          fontWeight={700}
          gutterBottom
          color="primary.main"
          sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}
        >
          Administración Académica
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
          Gestiona tus aulas, clases y alumnos vinculados desde un solo lugar.
        </Typography>

        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          <Link underline="hover" color="inherit" component={RouterLink} to="/">
            Inicio
          </Link>
          <Typography color="text.primary" fontWeight={500}>
            Administración
          </Typography>
        </Breadcrumbs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Card
        elevation={2}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="admin tabs"
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab
              icon={<SchoolIcon />}
              iconPosition="start"
              label="Aulas y Clases"
              {...a11yProps(0)}
              sx={{ fontWeight: 600, py: 2 }}
            />
            <Tab
              icon={<PeopleIcon />}
              iconPosition="start"
              label="Alumnos"
              {...a11yProps(1)}
              sx={{ fontWeight: 600, py: 2 }}
            />
            {isAdmin && (
              <Tab
                icon={<PeopleIcon />}
                iconPosition="start"
                label="Gestión Usuarios"
                {...a11yProps(2)}
                sx={{ fontWeight: 600, py: 2 }}
              />
            )}
          </Tabs>
        </Box>

        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <CustomTabPanel value={tabValue} index={0}>
            <Stack spacing={4}>
              <ProfessorSlotsManager
                isEditing={isEditingSlots}
                slots={slots}
                allSlots={allSlots}
                allProfesores={allProfesores}
                isLoading={false}
                isSaving={isSaving}
                newSlot={newSlot}
                onNewSlotChange={handleNewSlotChange}
                onCreateSlot={handleCreateSlot}
                onDeleteSlot={handleDeleteSlot}
                onUpdateSlot={handleUpdateSlot}
                onAdminUpdateSlot={handleAdminUpdateSlot}
              />

              <Divider />

              <Box display="flex" justifyContent="flex-end">
                <Button
                  variant={isEditingSlots ? 'outlined' : 'contained'}
                  color={isEditingSlots ? 'inherit' : 'success'}
                  startIcon={isEditingSlots ? <CancelIcon /> : <EditIcon />}
                  onClick={() => setIsEditingSlots(!isEditingSlots)}
                  sx={{
                    borderRadius: 3,
                    px: 4,
                    width: { xs: '100%', sm: 'auto' },
                  }}
                >
                  {isEditingSlots ? 'Finalizar Edición' : 'Gestionar'}
                </Button>
              </Box>
            </Stack>
          </CustomTabPanel>

          <CustomTabPanel value={tabValue} index={1}>
            <ProfessorStudentList
              students={students}
              slots={slots}
              onToggleStatus={handleToggleStudentStatus}
              onResetPassword={handleResetStudentPassword}
              onManagePermissions={handleManagePermissions}
              onDeleteStudent={handleDeleteStudent}
              isSaving={isSaving}
            />
          </CustomTabPanel>

          {isAdmin && (
            <CustomTabPanel value={tabValue} index={2}>
              <UsuariosView />
            </CustomTabPanel>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Administracion;
