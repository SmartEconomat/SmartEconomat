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
      label: t('movimientos.fields.date'),
      render: (row) => dayjs(row.createdAt).format('DD/MM/YYYY HH:mm'),
    },
    {
      id: 'producto',
      label: t('inventario.table.product'),
      render: (row) => row.producto?.nombre || '—',
    },
    {
      id: 'cantidad',
      label: t('movimientos.fields.quantity'),
      align: 'right',
      render: (row) => `${row.cantidad} ${row.producto?.unidad || ''}`,
    },
    {
      id: 'motivo',
      label: t('mermas.fields.reason'),
      render: (row) => (
        <StatusChip
          status={row.motivo}
          label={
            {
              [MotivoMerma.ROTURA]: t('movimientos.types.MERMA'),
              [MotivoMerma.DETERIORO]: t('mermas.reasons.deterioro'),
              [MotivoMerma.HURTO]: t('mermas.reasons.hurto'),
              [MotivoMerma.ERROR_PREPARACION]: t(
                'mermas.reasons.error_preparacion'
              ),
              [MotivoMerma.OTROS]: t('mermas.reasons.otros'),
            }[row.motivo]
          }
          variant="outlined"
          size="small"
        />
      ),
    },
    {
      id: 'usuario',
      label: t('movimientos.fields.user'),
      render: (row) => row.usuario?.nombre || row.usuario?.username || '—',
      hideOnMobile: true,
    },
    {
      id: 'acciones',
      label: t('common.actions'),
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title={t('common.viewDetails')}>
            <IconButton
              size="small"
              onClick={() =>
                alert(
                  `${t('mermas.fields.notes')}: ${row.notas || t('common.noData')}`
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
          label={t('mermas.filters.byReason') || 'Filtrar por Motivo'}
          size="small"
          value={filters.motivo}
          onChange={(e) =>
            onFiltersChange({ ...filters, motivo: e.target.value })
          }
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">
            {t('mermas.filters.allReasons') || 'Todos los motivos'}
          </MenuItem>
          <MenuItem value={MotivoMerma.ROTURA}>
            {t('movimientos.types.MERMA')}
          </MenuItem>
          <MenuItem value={MotivoMerma.DETERIORO}>
            {t('mermas.reasons.deterioro')}
          </MenuItem>
          <MenuItem value={MotivoMerma.HURTO}>
            {t('mermas.reasons.hurto')}
          </MenuItem>
          <MenuItem value={MotivoMerma.ERROR_PREPARACION}>
            {t('mermas.reasons.error_preparacion')}
          </MenuItem>
          <MenuItem value={MotivoMerma.OTROS}>
            {t('mermas.reasons.otros')}
          </MenuItem>
        </TextField>
        <TextField
          label={t('common.from') || 'Desde'}
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={filters.startDate}
          onChange={(e) =>
            onFiltersChange({ ...filters, startDate: e.target.value })
          }
        />
        <TextField
          label={t('common.until') || 'Hasta'}
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
