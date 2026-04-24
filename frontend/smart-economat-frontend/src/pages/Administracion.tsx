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
 * Renderiza el panel de contenido para una pestaña dada, con transición de aparición gradual cuando está activa.
 *
 * @param props - Props del panel de pestaña: hijos, valor actual, índice del panel e indicador opcional de carga.
 * @returns Un div que actúa como tabpanel con visibilidad de contenido animada.
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
 * Devuelve los atributos de accesibilidad (id y aria-controls) para un elemento de pestaña.
 *
 * @param index - La clave única de cadena que identifica el panel de pestaña.
 * @returns Un objeto con los atributos `id` y `aria-controls` para la pestaña.
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
   * Carga todos los datos necesarios para la pestaña Aulas y Clases.
   * Obtiene los slots propios (para profesores puros), todos los slots y la lista de
   * profesores (para administradores), y todas las ubicaciones disponibles.
   * Redirige al inicio si el usuario carece de permisos.
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
   * Carga todos los datos necesarios para la pestaña Alumnos.
   * Obtiene la lista de alumnos del profesor y, si aún no se ha cargado, su lista de slots.
   * Redirige al inicio si el usuario carece de permisos.
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
   * Gestiona los eventos de cambio de pestaña, actualiza el estado de la pestaña activa,
   * sincroniza el parámetro de búsqueda de la URL y cierra el modo de edición de slots
   * al abandonar la pestaña correspondiente.
   *
   * @param _event - El evento sintético del clic en la pestaña (no se utiliza).
   * @param newValue - La clave de la pestaña recién seleccionada.
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
   * Gestiona los cambios en los campos del formulario de nuevo slot.
   *
   * @param e - El evento de cambio generado por un campo de entrada del formulario de nuevo slot.
   */
  const handleNewSlotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewSlot((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /**
   * Gestiona el envío del formulario para crear un nuevo aula/slot.
   * Admite tanto la creación propia del profesor como la creación por parte de un administrador
   * en nombre de otro profesor. Muestra un toast en caso de éxito o error, y reinicia el
   * formulario al completarse.
   *
   * @param e - El evento de envío del formulario.
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
   * Gestiona la eliminación de un slot tras la confirmación del usuario.
   * Elimina el slot de la lista correspondiente (administrador o profesor) en caso de éxito.
   *
   * @param id - El ID del slot a eliminar.
   * @param isAdminView - Indica si la eliminación se realiza desde la vista de administrador.
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
        toast.error(res.message || t('admin.errors.eliminar'));
      }
    } catch {
      toast.error(t('admin.errors.eliminar'));
    }
  };

  /**
   * Gestiona la actualización de un slot propiedad del profesor actual.
   * Muestra un toast en caso de éxito o error.
   *
   * @param id - El ID del slot a actualizar.
   * @param data - Datos parciales del slot a actualizar (excluye id y codigoSlot).
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
        toast.error(res.message || t('admin.errors.actualizar'));
      }
    } catch {
      toast.error(t('admin.errors.actualizar'));
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Gestiona la actualización a nivel de administrador de cualquier slot, incluido el cambio
   * del profesor asignado. Recarga la lista completa de slots tras una actualización exitosa
   * para reflejar los cambios del profesor.
   *
   * @param id - El ID del slot a actualizar.
   * @param data - Datos parciales del slot a actualizar, opcionalmente con un nuevo profesorId.
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
        toast.error(res.message || t('admin.errors.actualizarAula'));
      }
    } catch {
      toast.error(t('admin.errors.actualizarAula'));
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Alterna el estado activo/inactivo de un alumno.
   * Actualiza la lista local de alumnos con el nuevo estado devuelto por la API.
   *
   * @param id - El ID del alumno cuyo estado debe alternarse.
   * @param currentStatus - El estado actual del alumno (p. ej. 'ACTIVE' o 'INACTIVE').
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
      toast.error(t('admin.errors.cambiarEstado'));
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Fuerza el restablecimiento de contraseña de un alumno y muestra la nueva
   * contraseña provisional en un toast.
   *
   * @param id - El ID del alumno cuya contraseña debe restablecerse.
   */
  const handleResetStudentPassword = async (id: string) => {
    try {
      const res = await profesorService.forcePasswordReset(id);
      if (res.success) {
        toast.success(
          t('admin.toast.contrasenaReset', {
            clave: res.data.provisionalPassword,
          }),
          10000
        );
      }
    } catch {
      toast.error(t('admin.errors.resetearContrasena'));
    }
  };

  /**
   * Gestiona la eliminación de un alumno tras la confirmación del usuario.
   * Elimina al alumno de la lista local en caso de éxito.
   *
   * @param id - El ID del alumno a eliminar.
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
   * Muestra un toast informativo indicando que la funcionalidad de gestión de permisos
   * para el alumno indicado aún no está disponible.
   *
   * @param alumno - El objeto alumno cuyos permisos se gestionarían.
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
                    {isEditingSlots
                      ? t('admin.actions.finalizarEdicion')
                      : t('admin.actions.gestionar')}
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
