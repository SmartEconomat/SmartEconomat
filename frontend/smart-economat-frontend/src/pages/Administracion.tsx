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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Link as RouterLink,
  useLocation,
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
import ProfessorStudentList from '../features/profile/components/ProfessorStudentList';
import PlantillasRolesView from '../features/admin/components/PlantillasRolesView';
import UbicacionesAdminManager from '../features/admin/components/ubicaciones-admin-manager';
import WarehouseIcon from '@mui/icons-material/HomeWorkOutlined';
import UsuariosView from './Usuarios/UsuariosView';

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
  /** Coincide con la pestaña de MUI; `false` cuando no hay selección. */
  value: string | false;
  isLoading?: boolean;
}

import { Fade } from '@mui/material';

/**
 * Ejecuta la lógica de custom tab panel dentro del flujo de la aplicación.
 *
 * @param props Parámetro de entrada para la operación.
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
 * Ejecuta la lógica de a11y props dentro del flujo de la aplicación.
 *
 * @param index Parámetro de entrada para la operación.
 */
function a11yProps(index: string) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

type AdminTabKey =
  | 'slots'
  | 'alumnos'
  | 'usuarios'
  | 'plantillas'
  | 'ubicaciones';

const ADMIN_TAB_KEYS: readonly AdminTabKey[] = [
  'slots',
  'alumnos',
  'usuarios',
  'plantillas',
  'ubicaciones',
];

function isAdminTabKey(value: string): value is AdminTabKey {
  return (ADMIN_TAB_KEYS as readonly string[]).includes(value);
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
const Administracion: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const adminTabsCompact = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const userRole = user?.rol?.toUpperCase() || '';
  const canViewAdmin = useAnyPermission([
    PERMISSIONS.profesor.ver_alumnos,
    PERMISSIONS.profesor.gestionar_slots,
    PERMISSIONS.usuarios.listar,
    PERMISSIONS.ubicaciones.listar,
  ]);
  const isAdmin = usePermission(PERMISSIONS.usuarios.listar);
  const canManageSlots = usePermission(PERMISSIONS.profesor.gestionar_slots);
  const canViewStudents = useAnyPermission([
    PERMISSIONS.profesor.ver_alumnos,
    PERMISSIONS.profesor.gestionar_slots,
  ]);
  const canViewRoleTemplates = usePermission(PERMISSIONS.roles.listar);
  const canEditRoleTemplates = usePermission(PERMISSIONS.roles.editar);
  const canViewUbicacionesAdmin = usePermission(PERMISSIONS.ubicaciones.listar);

  // isPureProfesor: para cargar datos propios (esto se mantiene un poco por lógica de negocio del backend)
  const isPureProfesor = userRole === SYSTEM_ROLES.PROFESOR;

  const availableTabKeys = useMemo((): AdminTabKey[] => {
    return [
      canManageSlots ? ('slots' as const) : null,
      canViewStudents ? ('alumnos' as const) : null,
      isAdmin ? ('usuarios' as const) : null,
      canViewRoleTemplates ? ('plantillas' as const) : null,
      canViewUbicacionesAdmin ? ('ubicaciones' as const) : null,
    ].filter((k): k is AdminTabKey => k !== null);
  }, [
    canManageSlots,
    canViewStudents,
    isAdmin,
    canViewRoleTemplates,
    canViewUbicacionesAdmin,
  ]);

  const tabParam = useMemo(
    () => new URLSearchParams(location.search).get('tab'),
    [location.search]
  );

  /** Pestaña resuelta; `false` si no hay pestañas visibles (evita value inválido en MUI Tabs). */
  const activeTab = useMemo<AdminTabKey | false>(() => {
    if (availableTabKeys.length === 0) {
      return false;
    }
    if (
      tabParam &&
      isAdminTabKey(tabParam) &&
      availableTabKeys.includes(tabParam)
    ) {
      return tabParam;
    }
    return availableTabKeys[0];
  }, [tabParam, availableTabKeys]);

  // Alinear `?tab=` con la pestaña efectiva. No incluir `searchParams` en deps: cada render
  // trae una nueva instancia de URLSearchParams y re-disparaba el efecto (riesgo de bucle con el router).
  useEffect(() => {
    if (activeTab === false) {
      return;
    }
    if (tabParam === activeTab) {
      return;
    }
    setSearchParams(
      (prev) => {
        if (prev.get('tab') === activeTab) {
          return prev;
        }
        const next = new URLSearchParams(prev);
        next.set('tab', activeTab);
        return next;
      },
      { replace: true }
    );
  }, [activeTab, tabParam, setSearchParams]);
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
      availableTabKeys.map((key) => {
        const iconByKey: Record<AdminTabKey, React.ReactElement> = {
          slots: <SchoolIcon />,
          alumnos: <PeopleIcon />,
          usuarios: <PeopleIcon />,
          plantillas: <SecurityIcon />,
          ubicaciones: <WarehouseIcon />,
        };

        const labelByKey: Record<AdminTabKey, string> = {
          slots: t('admin.tabs.aulasClases'),
          alumnos: t('admin.tabs.alumnos'),
          usuarios: t('admin.tabs.gestionUsuarios'),
          plantillas: t('admin.tabs.plantillasRoles'),
          ubicaciones: t('admin.tabs.ubicaciones'),
        };

        return {
          key,
          label: labelByKey[key],
          icon: iconByKey[key],
        };
      }),
    [availableTabKeys, t]
  );

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
      setError(t('admin.errors.cargarDatos'));
    } finally {
      setLoadingTab((current) => (current === 'slots' ? null : current));
    }
  }, [canViewAdmin, navigate, isPureProfesor, isAdmin, t]);

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
    if (activeTab === false) {
      return;
    }
    if (activeTab === 'slots' && !loadedTabs.slots) {
      void loadSlotsTabData();
    }

    if (activeTab === 'alumnos' && !loadedTabs.alumnos) {
      void loadStudentsTabData();
    }
  }, [activeTab, loadedTabs, loadSlotsTabData, loadStudentsTabData]);

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: AdminTabKey
  ) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', newValue);
    setSearchParams(nextParams, { replace: true });
    // Si cambiamos de tab, cerramos el modo edición de slots por seguridad visual
    if (newValue !== 'slots') setIsEditingSlots(false);
  };

  /**
   * Gestiona new slot change y aplica la lógica correspondiente.
   *
   * @param e Parámetro de entrada para la operación.
   */
  const handleNewSlotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewSlot((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /**
   * Gestiona create slot y aplica la lógica correspondiente.
   *
   * @param e Parámetro de entrada para la operación.
   */
  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = {
        aula: newSlot.aula.trim(),
        numeroClase: Number(newSlot.numeroClase),
        capacidad: Number(newSlot.capacidad),
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
   * Gestiona delete slot y aplica la lógica correspondiente.
   *
   * @param id Parámetro de entrada para la operación.
   * @param isAdminView Parámetro de entrada para la operación. Opcional.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
   * Gestiona reset student password y aplica la lógica correspondiente.
   *
   * @param id Parámetro de entrada para la operación.
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
   * Gestiona delete student y aplica la lógica correspondiente.
   *
   * @param id Parámetro de entrada para la operación.
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
      toast.error(t('admin.errors.eliminar'));
    }
  };

  /**
   * Gestiona manage permissions y aplica la lógica correspondiente.
   *
   * @param alumno Parámetro de entrada para la operación.
   */
  const handleManagePermissions = (alumno: Alumno) => {
    toast.info(
      t('admin.toast.permisosProximamente', { username: alumno.username })
    );
  };

  // Métodos de administración eliminados en favor de UsuariosView

  return (
    <Container maxWidth="lg" sx={{ py: 4, px: { xs: 1, sm: 2, md: 3 } }}>
      <Box id="admin-header" mb={{ xs: 3, md: 4 }}>
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
            id="admin-tabs"
            value={activeTab === false ? false : activeTab}
            onChange={handleTabChange}
            aria-label={t('admin.tabs.ariaLabel')}
            variant={adminTabsCompact ? 'scrollable' : 'fullWidth'}
            {...(adminTabsCompact
              ? {
                  scrollButtons: 'auto' as const,
                  allowScrollButtonsMobile: true,
                }
              : { scrollButtons: false })}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              width: '100%',
              '& .MuiTab-root': {
                minHeight: 48,
                ...(adminTabsCompact
                  ? { flexShrink: 0 }
                  : { minWidth: 0, maxWidth: 'none' }),
              },
            }}
          >
            {availableTabs.map((tab) => (
              <Tab
                key={tab.key}
                value={tab.key}
                icon={tab.icon}
                label={tab.label}
                {...a11yProps(tab.key)}
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
                isLoading={loadingTab === 'slots'}
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
                    id="btn-gestionar-slots"
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
              {activeTab === 'usuarios' ? <UsuariosView /> : null}
            </CustomTabPanel>
          )}

          {canViewRoleTemplates && (
            <CustomTabPanel value={activeTab} index="plantillas">
              {activeTab === 'plantillas' ? (
                <PlantillasRolesView canEdit={canEditRoleTemplates} />
              ) : null}
            </CustomTabPanel>
          )}

          {canViewUbicacionesAdmin && (
            <CustomTabPanel value={activeTab} index="ubicaciones">
              {activeTab === 'ubicaciones' ? <UbicacionesAdminManager /> : null}
            </CustomTabPanel>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Administracion;
