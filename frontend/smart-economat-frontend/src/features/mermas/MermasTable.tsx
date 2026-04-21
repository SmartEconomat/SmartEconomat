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
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

interface MermasTableProps {
  data: Merma[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  isLoading?: boolean;
  filters: {
    motivo: string;
    startDate: string;
    endDate: string;
  };
  onFiltersChange: (newFilters: {
    motivo: string;
    startDate: string;
    endDate: string;
  }) => void;
}

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
      label: 'Fecha',
      render: (row) => dayjs(row.createdAt).format('DD/MM/YYYY HH:mm'),
    },
    {
      id: 'producto',
      label: 'Producto',
      render: (row) => row.producto?.nombre || '—',
    },
    {
      id: 'cantidad',
      label: 'Cantidad',
      align: 'right',
      render: (row) => `${row.cantidad} ${row.producto?.unidad || ''}`,
    },
    {
      id: 'motivo',
      label: 'Motivo',
      render: (row) => (
        <StatusChip
          status={row.motivo}
          label={
            {
              [MotivoMerma.ROTURA]: t('mermasTable.chips.ROTURA'),
              [MotivoMerma.DETERIORO]: t('mermasTable.chips.DETERIORO'),
              [MotivoMerma.HURTO]: t('mermasTable.chips.HURTO'),
              [MotivoMerma.ERROR_PREPARACION]: t(
                'mermasTable.chips.ERROR_PREPARACION'
              ),
              [MotivoMerma.OTROS]: t('mermasTable.chips.OTROS'),
            }[row.motivo]
          }
          variant="outlined"
          size="small"
        />
      ),
    },
    {
      id: 'usuario',
      label: 'Registrado por',
      render: (row) => row.usuario?.nombre || row.usuario?.username || '—',
      hideOnMobile: true,
    },
    {
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title={t('mermasTable.viewNotes')}>
            <IconButton
              size="small"
              onClick={() => alert(`Notas: ${row.notas || 'Sin notas'}`)}
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
          label={t('mermasTable.filterByMotivo')}
          size="small"
          value={filters.motivo}
          onChange={(e) =>
            onFiltersChange({ ...filters, motivo: e.target.value })
          }
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">{t('mermasTable.allMotivos')}</MenuItem>
          <MenuItem value={MotivoMerma.ROTURA}>
            {t('mermasTable.motivos.ROTURA')}
          </MenuItem>
          <MenuItem value={MotivoMerma.DETERIORO}>
            {t('mermasTable.motivos.DETERIORO')}
          </MenuItem>
          <MenuItem value={MotivoMerma.HURTO}>
            {t('mermasTable.motivos.HURTO')}
          </MenuItem>
          <MenuItem value={MotivoMerma.ERROR_PREPARACION}>
            {t('mermasTable.motivos.ERROR_PREPARACION')}
          </MenuItem>
          <MenuItem value={MotivoMerma.OTROS}>
            {t('mermasTable.motivos.OTROS')}
          </MenuItem>
        </TextField>
        <TextField
          label={t('filters.from')}
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={filters.startDate}
          onChange={(e) =>
            onFiltersChange({ ...filters, startDate: e.target.value })
          }
        />
        <TextField
          label={t('filters.to')}
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
