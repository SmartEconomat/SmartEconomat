import React, { useCallback, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SecurityIcon from '@mui/icons-material/Security';
import type { Permiso, RolOption } from '../../../types/usuario';
import type { PlantillaRol } from '../../../types/plantillaRol';
import { plantillaRolService } from '../../../services/plantillaRolService';
import { usuarioService } from '../../../services/usuarioService';
import { ApiError } from '../../../services/api.service';
import { useToast } from '../../../store/toast.hooks';
import { useTranslation } from 'react-i18next';

/**
 * Documentación en español.
 */
interface PlantillasRolesViewProps {
        /**
     * Documentación en español.
     */
  canEdit: boolean;
}

/**
 * Documentación en español.
 */
function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

/**
 * Documentación en español.
 */
const KNOWN_TEMPLATE_NAMES = ['SUPER_ADMIN', 'ADMIN', 'PROFESOR', 'ALUMNO'];

/**
 * Documentación en español.
 */
const SUPERADMIN_KEYWORDS = ['SUPERADMIN', 'SUPER_ADMIN'];

/**
 * Documentación en español.
 */
function isSuperadminPlantilla(nombre: string): boolean {
  const upper = nombre.toUpperCase();
  return SUPERADMIN_KEYWORDS.some((kw) => upper.includes(kw));
}

/**
 * Documentación en español.
 */
const PlantillasRolesView: React.FC<PlantillasRolesViewProps> = ({
  canEdit,
}) => {
  const toast = useToast();
  const { t } = useTranslation();

  const [plantillas, setPlantillas] = useState<PlantillaRol[]>([]);
  const [roles, setRoles] = useState<RolOption[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlantilla, setEditingPlantilla] = useState<PlantillaRol | null>(
    null
  );
  const [selectedPermisoIds, setSelectedPermisoIds] = useState<Set<string>>(
    new Set()
  );
  const [isReadonly, setIsReadonly] = useState(false);

        /**
     * Documentación en español.
     */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [plantillasRes, rolesRes, permisosRes] = await Promise.all([
        plantillaRolService.getPlantillas(),
        usuarioService.getRoles(),
        usuarioService.getPermissions(),
      ]);

      setPlantillas(
        plantillasRes.data.filter((p: PlantillaRol) =>
          KNOWN_TEMPLATE_NAMES.includes(p.nombre.toUpperCase())
        )
      );
      setRoles(rolesRes.data);
      setPermisos(permisosRes.data);
    } catch (loadError) {
      const message = getApiErrorMessage(
        loadError,
        t('plantillasRoles.errorCargar')
      );
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

        /**
     * Documentación en español.
     */
  const rolesCountByPlantillaId = useMemo(() => {
    const counts = new Map<string, number>();

    for (const role of roles) {
      if (!role.plantillaRolId) {
        continue;
      }

      const current = counts.get(role.plantillaRolId) ?? 0;
      counts.set(role.plantillaRolId, current + 1);
    }

    return counts;
  }, [roles]);

        /**
     * Documentación en español.
     */
  const groupedPermissions = useMemo(() => {
    const grouped = new Map<string, Permiso[]>();

    for (const permiso of permisos) {
      const modulo = (permiso.modulo || 'general').trim().toLowerCase();
      const current = grouped.get(modulo) || [];
      current.push(permiso);
      grouped.set(modulo, current);
    }

    const entries: Array<[string, Permiso[]]> = Array.from(
      grouped.entries()
    ).map(([modulo, modulePermisos]) => [
      modulo,
      [...modulePermisos].sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
      ),
    ]);

    entries.sort(([moduleA], [moduleB]) =>
      moduleA.localeCompare(moduleB, 'es', { sensitivity: 'base' })
    );

    return entries;
  }, [permisos]);

        /**
     * Documentación en español.
     */
  const togglePermisoSelection = useCallback((permisoId: string) => {
    setSelectedPermisoIds((prev) => {
      const next = new Set(prev);
      if (next.has(permisoId)) {
        next.delete(permisoId);
      } else {
        next.add(permisoId);
      }
      return next;
    });
  }, []);

        /**
     * Documentación en español.
     */
  const toggleModuleSelection = useCallback((modulePermisos: Permiso[]) => {
    setSelectedPermisoIds((prev) => {
      const moduleIds = modulePermisos.map((p) => p.id);
      const allSelected = moduleIds.every((id) => prev.has(id));
      const next = new Set(prev);

      if (allSelected) {
        for (const id of moduleIds) next.delete(id);
      } else {
        for (const id of moduleIds) next.add(id);
      }

      return next;
    });
  }, []);

        /**
     * Documentación en español.
     */
  const openEditDialog = useCallback(
    (plantilla: PlantillaRol) => {
      const isSuperadmin = isSuperadminPlantilla(plantilla.nombre);
      setEditingPlantilla(plantilla);
      setIsReadonly(isSuperadmin);

      if (isSuperadmin) {
        setSelectedPermisoIds(new Set(permisos.map((p) => p.id)));
      } else {
        setSelectedPermisoIds(new Set(plantilla.permisos.map((p) => p.id)));
      }

      setDialogOpen(true);
    },
    [permisos]
  );

        /**
     * Documentación en español.
     */
  const closeDialog = () => {
    if (saving) {
      return;
    }

    setDialogOpen(false);
    setEditingPlantilla(null);
    setSelectedPermisoIds(new Set());
    setIsReadonly(false);
  };

        /**
     * Documentación en español.
     */
  const handleSubmit = async () => {
    if (!editingPlantilla || isReadonly) {
      return;
    }

    setSaving(true);

    try {
      const updatedPlantilla = await plantillaRolService.updatePermisos(
        editingPlantilla.id,
        Array.from(selectedPermisoIds)
      );

      const linkedRoles = rolesCountByPlantillaId.get(editingPlantilla.id) ?? 0;
      const syncMessage =
        linkedRoles > 0
          ? t(
              linkedRoles === 1
                ? 'plantillasRoles.syncRoles_one'
                : 'plantillasRoles.syncRoles_other',
              { count: linkedRoles }
            )
          : '';

      toast.success(
        t('plantillasRoles.actualizadoExito', {
          nombre: editingPlantilla.nombre,
          sync: syncMessage,
        })
      );

      setPlantillas((prev) =>
        prev.map((p) =>
          p.id === editingPlantilla.id ? updatedPlantilla.data : p
        )
      );

      setDialogOpen(false);
      setEditingPlantilla(null);
      setSelectedPermisoIds(new Set());
    } catch (submitError) {
      const message = getApiErrorMessage(
        submitError,
        t('plantillasRoles.errorActualizar')
      );
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = selectedPermisoIds.size;
  const totalCount = permisos.length;
  const progressPercent =
    totalCount > 0 ? (selectedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Stack spacing={2.5}>
      {error && <Alert severity="error">{error}</Alert>}

      <Box display="flex" alignItems="center" gap={1.5}>
        <SecurityIcon color="primary" />
        <Typography variant="h6" fontWeight={700}>
          {t('plantillasRoles.titulo')}
        </Typography>
      </Box>

      <Alert severity="info" variant="outlined">
        {t('plantillasRoles.descripcionInfo')}
      </Alert>

      <TableContainer
        sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('plantillasRoles.columnas.plantilla')}</TableCell>
              <TableCell>{t('plantillasRoles.columnas.estado')}</TableCell>
              <TableCell align="center">
                {t('plantillasRoles.columnas.permisos')}
              </TableCell>
              <TableCell align="center">
                {t('plantillasRoles.columnas.rolesVinculados')}
              </TableCell>
              {canEdit && (
                <TableCell align="right">
                  {t('plantillasRoles.columnas.acciones')}
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {plantillas.map((plantilla) => {
              const linkedRoles =
                rolesCountByPlantillaId.get(plantilla.id) ?? 0;
              const isSuperadmin = isSuperadminPlantilla(plantilla.nombre);

              return (
                <TableRow key={plantilla.id} hover>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography fontWeight={600}>
                        {plantilla.nombre}
                      </Typography>
                      {plantilla.descripcion && (
                        <Typography variant="caption" color="text.secondary">
                          {plantilla.descripcion}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={
                        plantilla.activo
                          ? t('plantillasRoles.activa')
                          : t('plantillasRoles.inactiva')
                      }
                      color={plantilla.activo ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={
                        isSuperadmin
                          ? `${permisos.length} / ${permisos.length}`
                          : `${plantilla.permisos.length} / ${permisos.length}`
                      }
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">{linkedRoles}</TableCell>
                  {canEdit && (
                    <TableCell align="right">
                      <Tooltip
                        title={
                          isSuperadmin
                            ? t('plantillasRoles.verPermisos')
                            : plantilla.esEditable
                              ? t('plantillasRoles.editarPermisos')
                              : t('plantillasRoles.plantillaSistema')
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => openEditDialog(plantilla)}
                            disabled={!plantilla.esEditable && !isSuperadmin}
                          >
                            {isSuperadmin ? (
                              <VisibilityIcon fontSize="small" />
                            ) : (
                              <EditIcon fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="md">
        <DialogTitle>
          {isReadonly
            ? t('plantillasRoles.dialogTituloVer')
            : t('plantillasRoles.dialogTituloEditar')}{' '}
          — {editingPlantilla?.nombre}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={0.5}>
            {isReadonly ? (
              <Alert severity="info" variant="outlined">
                {t('plantillasRoles.superadminInfo')}
              </Alert>
            ) : (
              <Alert severity="warning" variant="outlined">
                {t('plantillasRoles.warningGuardar')}
                {editingPlantilla
                  ? t(
                      (rolesCountByPlantillaId.get(editingPlantilla.id) ??
                        0) === 1
                        ? 'plantillasRoles.warningRolesLinked_one'
                        : 'plantillasRoles.warningRolesLinked_other',
                      {
                        count:
                          rolesCountByPlantillaId.get(editingPlantilla.id) ??
                          0,
                      }
                    )
                  : ''}
              </Alert>
            )}

            <Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={0.5}
              >
                <Typography variant="subtitle2" fontWeight={700}>
                  {t('plantillasRoles.permisosActivos', {
                    selected: selectedCount,
                    total: totalCount,
                  })}
                </Typography>
                {!isReadonly && (
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      onClick={() =>
                        setSelectedPermisoIds(
                          new Set(permisos.map((p) => p.id))
                        )
                      }
                    >
                      {t('plantillasRoles.seleccionarTodos')}
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setSelectedPermisoIds(new Set())}
                    >
                      {t('plantillasRoles.deseleccionarTodos')}
                    </Button>
                  </Stack>
                )}
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressPercent}
                sx={{ borderRadius: 1, height: 6 }}
              />
            </Box>

            <Box sx={{ maxHeight: '55vh', overflowY: 'auto', pr: 1 }}>
              {groupedPermissions.map(([module, modulePermisos]) => {
                const moduleIds = modulePermisos.map((p) => p.id);
                const moduleSelectedCount = moduleIds.filter((id) =>
                  selectedPermisoIds.has(id)
                ).length;
                const allSelected = moduleSelectedCount === moduleIds.length;
                const someSelected =
                  moduleSelectedCount > 0 &&
                  moduleSelectedCount < moduleIds.length;

                return (
                  <Accordion
                    key={module}
                    elevation={0}
                    variant="outlined"
                    sx={{ mb: 1 }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <FormControlLabel
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        control={
                          <Checkbox
                            size="small"
                            checked={allSelected}
                            indeterminate={someSelected}
                            onChange={() =>
                              toggleModuleSelection(modulePermisos)
                            }
                            disabled={isReadonly}
                          />
                        }
                        label={
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 'bold',
                              textTransform: 'capitalize',
                            }}
                          >
                            {module} ({moduleSelectedCount}/
                            {modulePermisos.length})
                          </Typography>
                        }
                      />
                    </AccordionSummary>
                    <AccordionDetails sx={{ py: 0 }}>
                      <FormGroup>
                        <Grid container spacing={1}>
                          {modulePermisos.map((permiso) => (
                            <Grid size={{ xs: 12, sm: 6 }} key={permiso.id}>
                              <Tooltip
                                title={permiso.descripcion || permiso.codigo}
                                placement="top"
                                arrow
                                enterDelay={400}
                              >
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      size="small"
                                      checked={selectedPermisoIds.has(
                                        permiso.id
                                      )}
                                      onChange={() =>
                                        togglePermisoSelection(permiso.id)
                                      }
                                      disabled={isReadonly}
                                    />
                                  }
                                  label={
                                    <Typography variant="caption">
                                      {permiso.nombre}
                                    </Typography>
                                  }
                                />
                              </Tooltip>
                            </Grid>
                          ))}
                        </Grid>
                      </FormGroup>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} disabled={saving}>
            {isReadonly ? t('comun.cerrar') : t('comun.cancelar')}
          </Button>
          {!isReadonly && (
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={saving}
            >
              {saving
                ? t('plantillasRoles.guardando')
                : t('plantillasRoles.guardarPermisos')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default PlantillasRolesView;
