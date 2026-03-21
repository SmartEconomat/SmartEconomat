import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import {
  Link as RouterLink,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import SchoolIcon from '@mui/icons-material/SchoolOutlined';
import PeopleIcon from '@mui/icons-material/PeopleOutlined';

import ProfessorSlotsManager from '../features/profile/components/ProfessorSlotsManager';
import ProfessorStudentList from '../features/profile/components/ProfessorStudentList';
import UsuariosView from './Usuarios/UsuariosView';

import { useAuth, usePermission, useAnyPermission } from '../store/auth.hooks';
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
  index: string;
  value: string;
  isLoading?: boolean;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, isLoading = false, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress />
            </Box>
          ) : (
            children
          )}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: string) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

type AdminTabKey = 'slots' | 'alumnos' | 'usuarios';

/**
 * Página de Administración Académica para Profesores con Tabs.
 */
const Administracion: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const userRole = user?.rol?.toUpperCase() || '';
  const canViewAdmin = useAnyPermission([
    'profesor:ver_alumnos',
    'profesor:gestionar_slots',
    'usuarios:listar',
  ]);
  const isAdmin = usePermission('usuarios:listar');
  const canManageSlots = usePermission('profesor:gestionar_slots');
  const canViewStudents = usePermission('profesor:ver_alumnos');

  // isPureProfesor: para cargar datos propios (esto se mantiene un poco por lógica de negocio del backend)
  const isPureProfesor = userRole === 'PROFESOR';

  const [activeTab, setActiveTab] = useState<AdminTabKey>('slots');
  const [isEditingSlots, setIsEditingSlots] = useState(false);
  const [loadingTab, setLoadingTab] = useState<AdminTabKey | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [slots, setSlots] = useState<AlumnoSlot[]>([]);
  const [allSlots, setAllSlots] = useState<AlumnoSlot[]>([]);
  const [allProfesores, setAllProfesores] = useState<ProfesorInfo[]>([]);
  const [newSlot, setNewSlot] = useState({
    aula: '',
    numeroClase: '',
    capacidad: '',
    profesorId: '',
  });
  const [students, setStudents] = useState<Alumno[]>([]);
  const [loadedTabs, setLoadedTabs] = useState<
    Partial<Record<AdminTabKey, boolean>>
  >({});

  const availableTabs = useMemo(
    () =>
      [
        canManageSlots
          ? {
              key: 'slots' as const,
              label: 'Aulas y Clases',
              icon: <SchoolIcon />,
            }
          : null,
        canViewStudents
          ? {
              key: 'alumnos' as const,
              label: 'Alumnos',
              icon: <PeopleIcon />,
            }
          : null,
        isAdmin
          ? {
              key: 'usuarios' as const,
              label: 'Gestión Usuarios',
              icon: <PeopleIcon />,
            }
          : null,
      ].filter(Boolean) as Array<{
        key: AdminTabKey;
        label: string;
        icon: React.ReactElement;
      }>,
    [canManageSlots, canViewStudents, isAdmin]
  );

  const initialTab = useMemo<AdminTabKey>(() => {
    const requestedTab = searchParams.get('tab');

    if (requestedTab === 'usuarios' && isAdmin) {
      return 'usuarios';
    }

    if (requestedTab === 'alumnos' && canViewStudents) {
      return 'alumnos';
    }

    if (requestedTab === 'slots' && canManageSlots) {
      return 'slots';
    }

    return availableTabs[0]?.key ?? 'slots';
  }, [searchParams, isAdmin, canViewStudents, canManageSlots, availableTabs]);

  useEffect(() => {
    if (activeTab !== initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, activeTab]);

  const loadSlotsTabData = useCallback(async () => {
    if (canViewAdmin === false) {
      navigate('/');
      return;
    }

    setLoadingTab('slots');
    setError(null);

    try {
      const [slotsRes, allSlotsRes, profesoresRes] = await Promise.all([
        isPureProfesor ? profesorService.getSlots() : Promise.resolve(null),
        isAdmin ? profesorService.getAllSlots() : Promise.resolve(null),
        isAdmin ? profesorService.getAllProfesores() : Promise.resolve(null),
      ]);

      if (slotsRes?.success) {
        setSlots(slotsRes.data);
      }

      if (allSlotsRes?.success) {
        setAllSlots(allSlotsRes.data);
      }

      if (profesoresRes?.success) {
        setAllProfesores(profesoresRes.data);
      }

      setLoadedTabs((prev) => ({ ...prev, slots: true }));
    } catch (loadError) {
      console.error('Error loading administración data', loadError);
      setError('Error al cargar los datos de administración');
    } finally {
      setLoadingTab((current) => (current === 'slots' ? null : current));
    }
  }, [canViewAdmin, navigate, isPureProfesor, isAdmin]);

  const loadStudentsTabData = useCallback(async () => {
    if (canViewAdmin === false) {
      navigate('/');
      return;
    }

    setLoadingTab('alumnos');
    setError(null);

    try {
      const [studentRes, slotsRes] = await Promise.all([
        isPureProfesor ? profesorService.getAlumnos() : Promise.resolve(null),
        isPureProfesor && slots.length === 0
          ? profesorService.getSlots()
          : Promise.resolve(null),
      ]);

      if (studentRes?.success) {
        setStudents(studentRes.data);
      }

      if (slotsRes?.success) {
        setSlots(slotsRes.data);
      }

      setLoadedTabs((prev) => ({
        ...prev,
        alumnos: true,
        ...(slotsRes?.success ? { slots: true } : {}),
      }));
    } catch (loadError) {
      console.error('Error loading administración students', loadError);
      setError('Error al cargar los alumnos');
    } finally {
      setLoadingTab((current) => (current === 'alumnos' ? null : current));
    }
  }, [canViewAdmin, navigate, isPureProfesor, slots.length]);

  useEffect(() => {
    if (activeTab === 'slots' && !loadedTabs.slots) {
      void loadSlotsTabData();
    }

    if (activeTab === 'alumnos' && !loadedTabs.alumnos) {
      void loadStudentsTabData();
    }
  }, [activeTab, loadedTabs, loadSlotsTabData, loadStudentsTabData]);

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: AdminTabKey
  ) => {
    setActiveTab(newValue);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', newValue);
    setSearchParams(nextParams, { replace: true });
    // Si cambiamos de tab, cerramos el modo edición de slots por seguridad visual
    if (newValue !== 'slots') setIsEditingSlots(false);
  };

  const handleNewSlotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewSlot((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = {
        aula: newSlot.aula.trim(),
        numeroClase: Number(newSlot.numeroClase),
        capacidad: Number(newSlot.capacidad),
      };

      const res =
        isAdmin && newSlot.profesorId
          ? await profesorService.adminCreateSlot({
              ...data,
              profesorId: newSlot.profesorId,
            })
          : await profesorService.createSlot(data);

      if (res.success) {
        if (isAdmin && newSlot.profesorId) {
          // Si lo crea un admin para otro, recargamos la lista total
          const allSlotsRes = await profesorService.getAllSlots();
          if (allSlotsRes.success) setAllSlots(allSlotsRes.data);
        } else {
          setSlots((prev) => [...prev, res.data]);
        }
        setNewSlot({
          aula: '',
          numeroClase: '',
          capacidad: '',
          profesorId: '',
        });
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

  const handleDeleteSlot = async (id: string, isAdminView?: boolean) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta clase?')) return;
    try {
      const res = isAdminView
        ? await profesorService.adminDeleteSlot(id)
        : await profesorService.deleteSlot(id);

      if (res.success) {
        if (isAdminView) {
          setAllSlots((prev) => prev.filter((s) => s.id !== id));
        } else {
          setSlots((prev) => prev.filter((s) => s.id !== id));
        }
        toast.success('Ubicación eliminada');
      } else {
        toast.error(res.message || 'Error al eliminar');
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
            value={activeTab}
            onChange={handleTabChange}
            aria-label="admin tabs"
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
          >
            {availableTabs.map((tab) => (
              <Tab
                key={tab.key}
                value={tab.key}
                icon={tab.icon}
                iconPosition="start"
                label={tab.label}
                {...a11yProps(tab.key)}
                sx={{ fontWeight: 600, py: 2 }}
              />
            ))}
          </Tabs>
        </Box>

        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <CustomTabPanel
            value={activeTab}
            index="slots"
            isLoading={loadingTab === 'slots'}
          >
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

              {canManageSlots && (
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
              )}
            </Stack>
          </CustomTabPanel>

          <CustomTabPanel
            value={activeTab}
            index="alumnos"
            isLoading={loadingTab === 'alumnos'}
          >
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
            <CustomTabPanel value={activeTab} index="usuarios">
              <UsuariosView />
            </CustomTabPanel>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Administracion;
