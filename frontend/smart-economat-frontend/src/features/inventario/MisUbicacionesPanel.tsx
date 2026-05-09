import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useTranslation } from 'react-i18next';
import type { Ubicacion } from '../../services/ubicacion.types';
import { usuarioService } from '../../services/usuarioService';
import { invalidateUbicacionesCache } from '../../services/ubicacion.service';
import Button from '../../components/ui/Button';
import { useAuth } from '../../store/auth.hooks';
import { useToast } from '../../store/toast.hooks';
import type { User } from '../../sherlock-auth/types';

export interface MisUbicacionesPanelProps {
  /** Refresca ubicaciones visibles usando el usuario recién cargado desde la API (evita estado obsoleto). */
  onAssignmentsChanged: (freshUser: User | null) => Promise<void>;
}

/**
 * Autoservicio de vínculos usuario↔ubicaciones (pestaña Inventario → Mis ubicaciones).
 */
const MisUbicacionesPanel: React.FC<MisUbicacionesPanelProps> = ({
  onAssignmentsChanged,
}) => {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [catalogo, setCatalogo] = useState<Ubicacion[]>([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(true);
  const [selected, setSelected] = useState<Ubicacion[]>([]);
  const [defaultId, setDefaultId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const loadCatalogo = useCallback(async () => {
    setLoadingCatalogo(true);
    try {
      const rows = await usuarioService.fetchCatalogoUbicacionesPerfil();
      setCatalogo(rows.map((r) => ({ id: r.id, nombre: r.nombre })));
    } catch {
      toast.error(t('inventario.misUbicacionesConfig.errorCargarCatalogo'));
      setCatalogo([]);
    } finally {
      setLoadingCatalogo(false);
    }
  }, [t, toast]);

  useEffect(() => {
    void loadCatalogo();
  }, [loadCatalogo]);

  const syncFromUser = useCallback(() => {
    if (!user) {
      setSelected([]);
      setDefaultId('');
      return;
    }
    const fromPivot =
      user.ubicaciones?.map((u) => ({ id: u.id, nombre: u.nombre })) ?? [];
    const byId = new Map(fromPivot.map((u) => [u.id, u]));
    if (user.ubicacionId && !byId.has(user.ubicacionId)) {
      const nombre =
        catalogo.find((c) => c.id === user.ubicacionId)?.nombre ??
        user.ubicacionId;
      byId.set(user.ubicacionId, { id: user.ubicacionId, nombre });
    }
    const merged = Array.from(byId.values());
    setSelected(merged);
    const tienePrincipalEnMerged =
      Boolean(user.ubicacionId) &&
      merged.some((m) => m.id === user.ubicacionId);
    setDefaultId(
      tienePrincipalEnMerged
        ? (user.ubicacionId as string)
        : (merged[0]?.id ?? '')
    );
  }, [user, catalogo]);

  useEffect(() => {
    syncFromUser();
  }, [syncFromUser]);

  const selectedIds = useMemo(() => selected.map((s) => s.id), [selected]);

  const handleSave = async () => {
    const pred =
      selectedIds.length === 0
        ? null
        : selectedIds.includes(defaultId)
          ? defaultId
          : (selectedIds[0] ?? null);

    setIsSaving(true);
    try {
      await usuarioService.updateMisUbicacionesPerfil({
        ubicacionesIds: selectedIds,
        ubicacionPredeterminadaId: pred,
      });
      invalidateUbicacionesCache();
      const refreshed = await refreshUser();
      await onAssignmentsChanged(refreshed);
      toast.success(t('inventario.misUbicacionesConfig.exito'));
    } catch {
      toast.error(t('inventario.misUbicacionesConfig.error'));
    } finally {
      setIsSaving(false);
    }
  };

  const showPredeterminada = selectedIds.length > 1;

  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'action.hover',
      }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {t('inventario.misUbicacionesConfig.titulo')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('inventario.misUbicacionesConfig.descripcion')}
          </Typography>
        </Box>

        {loadingCatalogo ? (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={28} aria-label={t('comun.cargando')} />
          </Box>
        ) : catalogo.length === 0 ? (
          <Alert severity="info">
            {t('inventario.misUbicacionesConfig.sinCatalogo')}
          </Alert>
        ) : (
          <>
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={catalogo}
              value={selected}
              onChange={(_, value) => {
                setSelected(value);
                const nextIds = value.map((v) => v.id);
                if (nextIds.length === 0) {
                  setDefaultId('');
                } else if (!nextIds.includes(defaultId)) {
                  setDefaultId(nextIds[0] ?? '');
                }
              }}
              getOptionLabel={(o) => o.nombre}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('inventario.misUbicacionesConfig.selectorLabel')}
                  placeholder={t(
                    'inventario.misUbicacionesConfig.selectorPlaceholder'
                  )}
                />
              )}
            />

            {selectedIds.length > 0 &&
              (showPredeterminada ? (
                <FormControl component="fieldset" variant="standard">
                  <FormLabel component="legend">
                    {t('inventario.misUbicacionesConfig.predeterminadaLabel')}
                  </FormLabel>
                  <RadioGroup
                    value={defaultId}
                    onChange={(e) => setDefaultId(e.target.value)}
                  >
                    {selected.map((u) => (
                      <FormControlLabel
                        key={u.id}
                        value={u.id}
                        control={<Radio />}
                        label={u.nombre}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  {t('inventario.misUbicacionesConfig.unaSolaPredeterminada')}
                </Typography>
              ))}

            <Alert severity="info" variant="outlined">
              {t('inventario.misUbicacionesConfig.ayudaAdministracion')}
            </Alert>

            <Box>
              <Button
                startIcon={<SaveIcon />}
                onClick={() => void handleSave()}
                isLoading={isSaving}
                loadingText={t('inventario.misUbicacionesConfig.guardando')}
              >
                {t('inventario.misUbicacionesConfig.guardar')}
              </Button>
            </Box>
          </>
        )}
      </Stack>
    </Box>
  );
};

export default MisUbicacionesPanel;
