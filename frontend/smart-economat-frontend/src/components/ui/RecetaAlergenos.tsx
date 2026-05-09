import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Chip, Tooltip, Typography, Alert } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { RecetaIngrediente } from '../../services/receta.types';
import { EU_ALLERGENS } from '../../utils/constants';
import { getEnumLabel } from '../../i18n/enumPresentation';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
interface RecetaAlergenosProps {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  ingredientes?: RecetaIngrediente[];
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
const RecetaAlergenos: React.FC<RecetaAlergenosProps> = ({
  ingredientes = [],
}) => {
  const { t } = useTranslation();
  const presentIds = useMemo(() => {
    const set = new Set<string>();
    ingredientes.forEach((ing) => {
      ing.producto?.alergenos?.forEach((a) => set.add(a.alergeno));
    });
    return set;
  }, [ingredientes]);

  const isGlutenFree = !presentIds.has('GLUTEN');
  const isLacteosFree = !presentIds.has('LACTEOS');

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip
          size="small"
          icon={
            isGlutenFree ? <CheckCircleOutlineIcon /> : <WarningAmberIcon />
          }
          label={t('recipes.alergenos.sinGluten')}
          color={isGlutenFree ? 'success' : 'error'}
          variant={isGlutenFree ? 'filled' : 'outlined'}
        />
        <Chip
          size="small"
          icon={
            isLacteosFree ? <CheckCircleOutlineIcon /> : <WarningAmberIcon />
          }
          label={t('recipes.alergenos.sinLacteos')}
          color={isLacteosFree ? 'success' : 'error'}
          variant={isLacteosFree ? 'filled' : 'outlined'}
        />
      </Box>

      {presentIds.size === 0 ? (
        <Alert severity="success">{t('recipes.alergenos.sinAlergenos')}</Alert>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
            gap: 1,
          }}
        >
          {EU_ALLERGENS.map((allergen) => {
            const isPresent = presentIds.has(allergen.id);
            return (
              <Tooltip
                key={allergen.id}
                title={
                  isPresent
                    ? t('recipes.alergenos.contiene', {
                        nombre: getEnumLabel(t, 'alergeno', allergen.id),
                      })
                    : t('recipes.alergenos.sin', {
                        nombre: getEnumLabel(t, 'alergeno', allergen.id),
                      })
                }
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 1,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: isPresent ? 'warning.main' : 'divider',
                    bgcolor: isPresent ? 'warning.light' : 'background.default',
                    opacity: isPresent ? 1 : 0.35,
                    transition: 'all 0.15s ease',
                    minHeight: 64,
                    gap: 0.5,
                    cursor: 'default',
                  }}
                >
                  <Box
                    sx={{
                      color: isPresent ? 'warning.dark' : 'text.disabled',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {allergen.icon}
                  </Box>
                  <Typography
                    variant="caption"
                    align="center"
                    sx={{
                      lineHeight: 1.2,
                      fontWeight: isPresent ? 600 : 400,
                      color: isPresent ? 'warning.dark' : 'text.disabled',
                    }}
                  >
                    {getEnumLabel(t, 'alergeno', allergen.id)}
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default RecetaAlergenos;
