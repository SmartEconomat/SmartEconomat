import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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

function a11yProps(index: string) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

type AdminTabKey = 'slots' | 'alumnos' | 'usuarios' | 'plantillas';

/**
 * Página de Administración Académica para Profesores con Tabs.
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
              label: t('administracion.tabs.slots'),
              icon: <SchoolIcon />,
            }
          : null,
        canViewStudents
          ? {
              key: 'alumnos' as const,
              label: t('administracion.tabs.alumnos'),
              icon: <PeopleIcon />,
            }
          : null,
        isAdmin
          ? {
              key: 'usuarios' as const,
              label: t('administracion.tabs.usuarios'),
              icon: <PeopleIcon />,
            }
          : null,
        canViewRoleTemplates
          ? {
              key: 'plantillas' as const,
              label: t('administracion.tabs.plantillas'),
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
      setError(t('administracion.errors.loadData'));
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
      setError(t('administracion.errors.loadStudents'));
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
          toast.error(t('administracion.toast.noProfesorProfile'));
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
        toast.success(t('administracion.toast.slotCreated'));
      } else {
        toast.error(res.message || t('administracion.toast.slotCreateError'));
      }
    } catch {
      toast.error(t('administracion.toast.slotCreateError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSlot = async (id: string, isAdminView?: boolean) => {
    if (!window.confirm(t('administracion.confirm.deleteSlot'))) return;
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
        toast.success(t('administracion.toast.slotDeleted'));
      } else {
        toast.error(
          res.message || t('administracion.toast.slotDeleteErrorMsg')
        );
      }
    } catch {
      toast.error(t('administracion.toast.slotDeleteError'));
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
        toast.success(t('administracion.toast.slotUpdated'));
      } else {
        toast.error(res.message || t('administracion.toast.slotUpdateError'));
      }
    } catch {
      toast.error(t('administracion.toast.slotUpdateError'));
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
        toast.success(t('administracion.toast.aulaUpdated'));
      } else {
        toast.error(res.message || t('administracion.toast.aulaUpdateError'));
      }
    } catch {
      toast.error(t('administracion.toast.aulaUpdateError'));
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
        toast.success(t('administracion.toast.studentStatusUpdated'));
      }
    } catch {
      toast.error(t('administracion.toast.studentStatusError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetStudentPassword = async (id: string) => {
    try {
      const res = await profesorService.forcePasswordReset(id);
      if (res.success) {
        toast.success(
          t('administracion.toast.passwordReset', {
            password: res.data.provisionalPassword,
          }),
          10000
        );
      }
    } catch {
      toast.error(t('administracion.toast.passwordResetError'));
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm(t('administracion.confirm.deleteStudent'))) return;

    try {
      const res = await profesorService.removeStudent(id);
      if (res.success) {
        setStudents((prev) => prev.filter((s) => s.id !== id));
        toast.success(t('administracion.toast.studentDeleted'));
      }
    } catch {
      toast.error(t('administracion.toast.studentDeleteError'));
    }
  };

  const handleManagePermissions = (alumno: Alumno) => {
    toast.info(
      t('administracion.toast.permissionsComingSoon', {
        username: alumno.username,
      })
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
          {t('administracion.pageTitle')}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
          {t('administracion.pageSubtitle')}
        </Typography>

        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          <Link underline="hover" color="inherit" component={RouterLink} to="/">
            {t('administracion.breadcrumbHome')}
          </Link>
          <Typography color="text.primary" fontWeight={500}>
            {t('administracion.breadcrumbAdmin')}
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
                      ? t('administracion.buttons.finishEditing')
                      : t('administracion.buttons.manage')}
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
