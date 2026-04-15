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
import SecurityIcon from '@mui/icons-material/SecurityOutlined';
import { useTranslation } from 'react-i18next';

import ProfessorSlotsManager from '../features/profile/components/ProfessorSlotsManager';
import { UbicacionService } from '../services/ubicacion.service';
import type { Ubicacion } from '../services/ubicacion.types';
import ProfessorStudentList from '../features/profile/components/ProfessorStudentList';
import { UsuariosView } from './Usuarios/UsuariosView';
import PlantillasRolesView from '../features/admin/components/PlantillasRolesView';

import { useAuth, usePermission, useAnyPermission } from '../store/auth.hooks';
import { SYSTEM_ROLES } from '../sherlock-auth/system-roles.constants';
import { PERMISSIONS } from '../sherlock-auth/permissions.constants';
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

import { Fade } from '@mui/material';

/**
 * Renders the content panel for a given tab, with a fade-in transition when active.
 *
 * @param props - Tab panel props including children, current value, panel index, and optional loading flag.
 * @returns A div acting as a tabpanel with animated content visibility.
 */
function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  const isActive = value === index;

  return (
    <div
      role="tabpanel"
      hidden={!isActive}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
      style={{ display: isActive ? 'block' : 'none' }}
    >
      <Fade in={isActive} timeout={400}>
        <Box sx={{ py: { xs: 2, md: 3 } }}>{children}</Box>
      </Fade>
    </div>
  );
}

/**
 * Returns the accessibility props (id and aria-controls) for a tab element.
 *
 * @param index - The unique string key identifying the tab panel.
 * @returns An object with `id` and `aria-controls` attributes for the tab.
 */
function a11yProps(index: string) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

type AdminTabKey = 'slots' | 'alumnos' | 'usuarios' | 'plantillas';

/**
 * Página de Administración Académica para Profesores con Tabs.
 * Gestiona aulas/clases, alumnos, usuarios del sistema y plantillas de roles
 * según los permisos del usuario autenticado.
 *
 * @returns The full administration page with permission-based tab navigation.
 */
const Administracion: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const userRole = user?.rol?.toUpperCase() || '';
  const canViewAdmin = useAnyPermission([
    PERMISSIONS.profesor.ver_alumnos,
    PERMISSIONS.profesor.gestionar_slots,
    PERMISSIONS.usuarios.listar,
  ]);
  const isAdmin = usePermission(PERMISSIONS.usuarios.listar);
  const canManageSlots = usePermission(PERMISSIONS.profesor.gestionar_slots);
  const canViewStudents = usePermission(PERMISSIONS.profesor.ver_alumnos);
  const canViewRoleTemplates = usePermission(PERMISSIONS.roles.listar);
  const canEditRoleTemplates = usePermission(PERMISSIONS.roles.editar);

  // isPureProfesor: para cargar datos propios (esto se mantiene un poco por lógica de negocio del backend)
  const isPureProfesor = userRole === SYSTEM_ROLES.PROFESOR;

  const [activeTab, setActiveTab] = useState<AdminTabKey>('slots');
  const [isEditingSlots, setIsEditingSlots] = useState(false);
  const [loadingTab, setLoadingTab] = useState<AdminTabKey | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [slots, setSlots] = useState<AlumnoSlot[]>([]);
  const [allSlots, setAllSlots] = useState<AlumnoSlot[]>([]);
  const [allProfesores, setAllProfesores] = useState<ProfesorInfo[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [newSlot, setNewSlot] = useState({
    aula: '',
    numeroClase: '',
    capacidad: '',
    profesorId: '',
    ubicacionId: '',
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
              label: t('admin.tabs.aulasClases'),
              icon: <SchoolIcon />,
            }
          : null,
        canViewStudents
          ? {
              key: 'alumnos' as const,
              label: t('admin.tabs.alumnos'),
              icon: <PeopleIcon />,
            }
          : null,
        isAdmin
          ? {
              key: 'usuarios' as const,
              label: t('admin.tabs.gestionUsuarios'),
              icon: <PeopleIcon />,
            }
          : null,
        canViewRoleTemplates
          ? {
              key: 'plantillas' as const,
              label: t('admin.tabs.plantillasRoles'),
              icon: <SecurityIcon />,
            }
          : null,
      ].filter(Boolean) as Array<{
        key: AdminTabKey;
        label: string;
        icon: React.ReactElement;
      }>,
    [canManageSlots, canViewStudents, isAdmin, canViewRoleTemplates, t]
  );

  const initialTab = useMemo<AdminTabKey>(() => {
    const requestedTab = searchParams.get('tab');

    if (requestedTab === 'usuarios' && isAdmin) {
      return 'usuarios';
    }

    if (requestedTab === 'plantillas' && canViewRoleTemplates) {
      return 'plantillas';
    }

    if (requestedTab === 'alumnos' && canViewStudents) {
      return 'alumnos';
    }

    if (requestedTab === 'slots' && canManageSlots) {
      return 'slots';
    }

    return availableTabs[0]?.key ?? 'slots';
  }, [
    searchParams,
    isAdmin,
    canViewRoleTemplates,
    canViewStudents,
    canManageSlots,
    availableTabs,
  ]);

  useEffect(() => {
    if (activeTab !== initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, activeTab]);

  /**
   * Loads all data required for the Aulas y Clases tab.
   * Fetches own slots (for pure professors), all slots and professor list (for admins),
   * and all available ubicaciones. Redirects to home if user lacks permissions.
   */
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

      const ubicacionesRes = await UbicacionService.findAll();

      if (slotsRes?.success) {
        setSlots(slotsRes.data);
      }

      if (allSlotsRes?.success) {
        setAllSlots(allSlotsRes.data);
      }

      if (profesoresRes?.success) {
        setAllProfesores(profesoresRes.data);
      }

      setUbicaciones(ubicacionesRes);

      setLoadedTabs((prev) => ({ ...prev, slots: true }));
    } catch (loadError) {
      console.error('Error loading administración data', loadError);
      setError(t('admin.errors.cargarDatos'));
    } finally {
      setLoadingTab((current) => (current === 'slots' ? null : current));
    }
  }, [canViewAdmin, navigate, isPureProfesor, isAdmin, t]);

  /**
   * Loads all data required for the Alumnos tab.
   * Fetches the professor's student list and, if not yet loaded, their slot list.
   * Redirects to home if user lacks permissions.
   */
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
      setError(t('admin.errors.cargarAlumnos'));
    } finally {
      setLoadingTab((current) => (current === 'alumnos' ? null : current));
    }
  }, [canViewAdmin, navigate, isPureProfesor, slots.length, t]);

  useEffect(() => {
    if (activeTab === 'slots' && !loadedTabs.slots) {
      void loadSlotsTabData();
    }

    if (activeTab === 'alumnos' && !loadedTabs.alumnos) {
      void loadStudentsTabData();
    }
  }, [activeTab, loadedTabs, loadSlotsTabData, loadStudentsTabData]);

  /**
   * Handles tab change events, updates the active tab state, syncs the URL search param,
   * and closes slot editing mode when leaving the slots tab.
   *
   * @param _event - The synthetic event from the tab click (unused).
   * @param newValue - The key of the newly selected tab.
   */
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

  /**
   * Handles input changes on the new slot form fields.
   *
   * @param e - The change event from an input element inside the new slot form.
   */
  const handleNewSlotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewSlot((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /**
   * Handles form submission to create a new aula/slot.
   * Supports both professor self-creation and admin creation on behalf of another professor.
   * Shows a toast on success or error, and resets the form on success.
   *
   * @param e - The form submit event.
   */
  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = {
        aula: newSlot.aula.trim(),
        numeroClase: Number(newSlot.numeroClase),
        capacidad: Number(newSlot.capacidad),
        ubicacionId: newSlot.ubicacionId || undefined,
      };

      let targetProfesorId = newSlot.profesorId;

      // Si es admin y elige "-- Mío (Propio) --" (vacío), buscamos si tiene perfil de profesor
      if (isAdmin && !targetProfesorId) {
        const myProfile = allProfesores.find((p) => p.userId === user?.id);
        if (myProfile) {
          targetProfesorId = myProfile.id;
        } else if (!isPureProfesor) {
          // Si no es "puro profesor" y no tiene perfil, el backend fallará con PROFESSOR_PROFILE_NOT_FOUND
          toast.error(t('admin.errors.sinProfesorVinculado'));
          setIsSaving(false);
          return;
        }
      }

      const res =
        isAdmin && targetProfesorId
          ? await profesorService.adminCreateSlot({
              ...data,
              profesorId: targetProfesorId,
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
          ubicacionId: '',
        });
        toast.success(t('admin.toast.aulaCreada'));
      } else {
        toast.error(res.message || t('admin.toast.errorCrearClase'));
      }
    } catch {
      toast.error(t('admin.toast.errorCrearClase'));
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handles deletion of a slot after user confirmation.
   * Removes the slot from the appropriate list (admin or professor) on success.
   *
   * @param id - The ID of the slot to delete.
   * @param isAdminView - Whether the deletion is performed from the admin view.
   */
  const handleDeleteSlot = async (id: string, isAdminView?: boolean) => {
    if (!window.confirm(t('admin.confirm.eliminarClase'))) return;
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
        toast.success(t('admin.toast.ubicacionEliminada'));
      } else {
        toast.error(res.message || 'Error al eliminar');
      }
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  /**
   * Handles updating a slot owned by the current professor.
   * Shows a toast on success or error.
   *
   * @param id - The ID of the slot to update.
   * @param data - Partial slot data to update (excluding id and codigoSlot).
   */
  const handleUpdateSlot = async (
    id: string,
    data: Partial<Omit<AlumnoSlot, 'id' | 'codigoSlot'>>
  ) => {
    setIsSaving(true);
    try {
      const res = await profesorService.updateSlot(id, data);
      if (res.success) {
        setSlots((prev) => prev.map((s) => (s.id === id ? res.data : s)));
        toast.success(t('admin.toast.ubicacionActualizada'));
      } else {
        toast.error(res.message || 'Error al actualizar');
      }
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handles admin-level update of any slot, including changing the assigned professor.
   * Reloads the full slot list after a successful update to reflect professor changes.
   *
   * @param id - The ID of the slot to update.
   * @param data - Partial slot data to update, optionally including a new profesorId.
   */
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
        toast.success(t('admin.toast.aulaActualizada'));
      } else {
        toast.error(res.message || 'Error al actualizar el aula');
      }
    } catch {
      toast.error('Error al actualizar el aula');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Toggles the active/inactive status of a student.
   * Updates the local student list with the new status returned by the API.
   *
   * @param id - The ID of the student whose status should be toggled.
   * @param currentStatus - The student's current status string (e.g. 'ACTIVE' or 'INACTIVE').
   */
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
        toast.success(t('admin.toast.estadoAlumnoActualizado'));
      }
    } catch {
      toast.error('Error al cambiar estado');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Forces a password reset for a student and displays the new provisional password in a toast.
   *
   * @param id - The ID of the student whose password should be reset.
   */
  const handleResetStudentPassword = async (id: string) => {
    try {
      const res = await profesorService.forcePasswordReset(id);
      if (res.success) {
        toast.success(
          t('admin.toast.contrasenaReset', { clave: res.data.provisionalPassword }),
          10000
        );
      }
    } catch {
      toast.error('Error al resetear contraseña');
    }
  };

  /**
   * Handles deletion of a student after user confirmation.
   * Removes the student from the local list on success.
   *
   * @param id - The ID of the student to delete.
   */
  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm(t('admin.confirm.eliminarAlumno'))) return;

    try {
      const res = await profesorService.removeStudent(id);
      if (res.success) {
        setStudents((prev) => prev.filter((s) => s.id !== id));
        toast.success(t('admin.toast.alumnoEliminado'));
      }
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  /**
   * Shows an informational toast indicating that the permissions management feature
   * for the given student is not yet available.
   *
   * @param alumno - The student object whose permissions would be managed.
   */
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
          {t('admin.titulo')}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
          {t('admin.subtitulo')}
        </Typography>

        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          <Link underline="hover" color="inherit" component={RouterLink} to="/">
            {t('admin.breadcrumb.inicio')}
          </Link>
          <Typography color="text.primary" fontWeight={500}>
            {t('admin.breadcrumb.administracion')}
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
            aria-label={t('admin.tabs.ariaLabel')}
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
          <CustomTabPanel value={activeTab} index="slots">
            <Stack spacing={4}>
              <ProfessorSlotsManager
                isEditing={isEditingSlots}
                slots={slots}
                allSlots={allSlots}
                allProfesores={allProfesores}
                ubicaciones={ubicaciones}
                isLoading={loadingTab === 'slots'}
                isSaving={isSaving}
                newSlot={newSlot}
                onNewSlotChange={handleNewSlotChange}
                onCreateSlot={handleCreateSlot}
                onDeleteSlot={handleDeleteSlot}
                onUpdateSlot={handleUpdateSlot}
                onAdminUpdateSlot={handleAdminUpdateSlot}
                onRefreshUbicaciones={loadSlotsTabData}
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
                    {isEditingSlots ? t('admin.actions.finalizarEdicion') : t('admin.actions.gestionar')}
                  </Button>
                </Box>
              )}
            </Stack>
          </CustomTabPanel>
          <CustomTabPanel value={activeTab} index="alumnos">
            <ProfessorStudentList
              students={students}
              slots={slots}
              onToggleStatus={handleToggleStudentStatus}
              onResetPassword={handleResetStudentPassword}
              onManagePermissions={handleManagePermissions}
              onDeleteStudent={handleDeleteStudent}
              isSaving={isSaving}
              isLoading={loadingTab === 'alumnos'}
            />
          </CustomTabPanel>

          {isAdmin && (
            <CustomTabPanel value={activeTab} index="usuarios">
              <UsuariosView />
            </CustomTabPanel>
          )}

          {canViewRoleTemplates && (
            <CustomTabPanel value={activeTab} index="plantillas">
              <PlantillasRolesView canEdit={canEditRoleTemplates} />
            </CustomTabPanel>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Administracion;
