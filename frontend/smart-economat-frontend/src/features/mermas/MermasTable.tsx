import React from 'react';
import {
  Box,
  Tooltip,
  IconButton,
  Stack,
  TextField,
  MenuItem,
} from '@mui/material';
import DataTable, { Column } from '../../components/ui/DataTable';
import StatusChip from '../../components/ui/StatusChip';
import { Merma, MotivoMerma } from '../../services/merma.types';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useTranslation } from 'react-i18next';
import { formatLocalizedDateTime } from '../../utils/intlFormat';

/**
 * Documentación en español.
 */
interface MermasTableProps {
  /**
   * Documentación en español.
   */
  data: Merma[];
  /**
   * Documentación en español.
   */
  total: number;
  /**
   * Documentación en español.
   */
  page: number;
  /**
   * Documentación en español.
   */
  pageSize: number;
  /**
   * Documentación en español.
   */
  onPageChange: (newPage: number) => void;
  /**
   * Documentación en español.
   */
  onPageSizeChange: (newPageSize: number) => void;
  /**
   * Documentación en español.
   */
  isLoading?: boolean;
  /**
   * Documentación en español.
   */
  filters: {
    motivo: string;
    startDate: string;
    endDate: string;
  };
  /**
   * Documentación en español.
   */
  onFiltersChange: (newFilters: {
    motivo: string;
    startDate: string;
    endDate: string;
  }) => void;
}

/**
 * Documentación en español.
 */
const MermasTable: React.FC<MermasTableProps> = ({
  data,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading,
  filters,
  onFiltersChange,
}) => {
  const { t } = useTranslation();

  const columns: Column<Merma>[] = [
    {
      id: 'createdAt',
      label: t('merma.tabla.fecha'),
      render: (row) => formatLocalizedDateTime(row.createdAt),
    },
    {
      id: 'producto',
      label: t('merma.tabla.producto'),
      render: (row) => row.producto?.nombre || '—',
    },
    {
      id: 'cantidad',
      label: t('merma.tabla.cantidad'),
      align: 'right',
      render: (row) => `${row.cantidad} ${row.producto?.unidad || ''}`,
    },
    {
      id: 'motivo',
      label: t('merma.tabla.motivo'),
      render: (row) => (
        <StatusChip
          status={row.motivo}
          label={
            {
              [MotivoMerma.ROTURA]: t('merma.motivos.rotura'),
              [MotivoMerma.DETERIORO]: t('merma.motivos.deterioro'),
              [MotivoMerma.HURTO]: t('merma.motivos.hurto'),
              [MotivoMerma.ERROR_PREPARACION]: t(
                'merma.motivos.errorPreparacion'
              ),
              [MotivoMerma.OTROS]: t('merma.motivos.otros'),
            }[row.motivo]
          }
          variant="outlined"
          size="small"
        />
      ),
    },
    {
      id: 'usuario',
      label: t('merma.tabla.registradoPor'),
      render: (row) => row.usuario?.nombre || row.usuario?.username || '—',
      hideOnMobile: true,
    },
    {
      id: 'acciones',
      label: t('comun.acciones'),
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title={t('merma.tabla.verNotas')}>
            <IconButton
              size="small"
              onClick={() =>
                alert(
                  `${t('merma.tabla.notas')}: ${row.notas || t('merma.tabla.sinNotas')}`
                )
              }
              disabled={!row.notas}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <Box mb={3} display="flex" gap={2} flexWrap="wrap">
        <TextField
          select
          label={t('merma.filtros.motivo')}
          size="small"
          value={filters.motivo}
          onChange={(e) =>
            onFiltersChange({ ...filters, motivo: e.target.value })
          }
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">{t('merma.filtros.todosMotivos')}</MenuItem>
          <MenuItem value={MotivoMerma.ROTURA}>
            {t('merma.form.motivoOpciones.roturaEnvase')}
          </MenuItem>
          <MenuItem value={MotivoMerma.DETERIORO}>
            {t('merma.form.motivoOpciones.deterioroCaducidad')}
          </MenuItem>
          <MenuItem value={MotivoMerma.HURTO}>
            {t('merma.form.motivoOpciones.hurto')}
          </MenuItem>
          <MenuItem value={MotivoMerma.ERROR_PREPARACION}>
            {t('merma.form.motivoOpciones.errorPreparacion')}
          </MenuItem>
          <MenuItem value={MotivoMerma.OTROS}>
            {t('merma.form.motivoOpciones.otros')}
          </MenuItem>
        </TextField>
        <TextField
          label={t('merma.filtros.desde')}
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={filters.startDate}
          onChange={(e) =>
            onFiltersChange({ ...filters, startDate: e.target.value })
          }
        />
        <TextField
          label={t('merma.filtros.hasta')}
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={filters.endDate}
          onChange={(e) =>
            onFiltersChange({ ...filters, endDate: e.target.value })
          }
        />
      </Box>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        pagination={{
          currentPage: page,
          totalPages: Math.ceil(total / pageSize) || 1,
          onPageChange: (_, newPage) => onPageChange(newPage),
          pageSize: pageSize,
          onPageSizeChange: (e) => onPageSizeChange(Number(e.target.value)),
        }}
      />
    </Box>
  );
};

export default MermasTable;
