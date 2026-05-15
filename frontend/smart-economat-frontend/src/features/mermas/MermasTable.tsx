import React, { useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
} from '@mui/material';
import DateRangeFilter from '../../components/ui/DateRangeFilter';
import DataTable, { Column } from '../../components/ui/DataTable';
import StatusChip from '../../components/ui/StatusChip';
import { Merma, MotivoMerma } from '../../services/merma.types';
import { useTranslation } from 'react-i18next';
import { formatLocalizedDateTime } from '../../utils/intlFormat';
import {
  DataTablePaginationProps,
  SortConfig,
  type FilterValue,
} from '../../hooks/useDataTable';
import { getEnumLabel } from '../../i18n/enumPresentation';
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';

interface MermasTableProps {
  data: Merma[];
  isLoading?: boolean;
  pagination: DataTablePaginationProps;
  sortConfig?: SortConfig;
  onSort?: (key: string) => void;
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
  tableFilters?: Record<string, FilterValue>;
  onFilter?: (columnId: string, value: FilterValue) => void;
}

const MermasTable: React.FC<MermasTableProps> = ({
  data,
  isLoading,
  pagination,
  sortConfig,
  onSort,
  filters,
  onFiltersChange,
  tableFilters,
  onFilter,
}) => {
  const { t } = useTranslation();
  const [notasDialogOpen, setNotasDialogOpen] = useState(false);
  const [notasDialogText, setNotasDialogText] = useState('');

  const openNotasDialog = (text: string) => {
    setNotasDialogText(text);
    setNotasDialogOpen(true);
  };

  const columns: Column<Merma>[] = [
    {
      id: 'createdAt',
      label: t('merma.tabla.fecha'),
      render: (row) => formatLocalizedDateTime(row.createdAt),
      sortable: true,
      sortType: 'date',
    },
    {
      id: 'producto',
      label: t('merma.tabla.producto'),
      render: (row) => row.producto?.nombre || '—',
      sortable: true,
      sortType: 'string',
      sortKey: 'productoId',
    },
    {
      id: 'cantidad',
      label: t('merma.tabla.cantidad'),
      align: 'right',
      render: (row) => `${row.cantidad} ${row.producto?.unidad || ''}`,
      sortable: true,
      sortType: 'number',
    },
    {
      id: 'motivo',
      label: t('merma.tabla.motivo'),
      render: (row) => (
        <StatusChip status={row.motivo} variant="outlined" size="small" />
      ),
      sortable: true,
      sortType: 'string',
    },
    {
      id: 'usuario',
      label: t('merma.tabla.registradoPor'),
      render: (row) => row.usuario?.nombre || row.usuario?.username || '—',
      hideOnMobile: true,
      sortable: true,
      sortType: 'string',
      sortKey: 'usuarioId',
    },
    {
      id: 'notas',
      label: t('merma.tabla.columnaNotas'),
      align: 'center',
      width: 56,
      render: (row) =>
        row.notas ? (
          <IconButton
            size="small"
            color="info"
            aria-label={t('merma.tabla.verNotas')}
            onClick={(e) => {
              e.stopPropagation();
              openNotasDialog(row.notas ?? '');
            }}
          >
            <StickyNote2OutlinedIcon fontSize="small" aria-hidden />
          </IconButton>
        ) : (
          <Box component="span" sx={{ display: 'inline-block', width: 40 }} />
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
          {Object.values(MotivoMerma).map((motivo) => (
            <MenuItem key={motivo} value={motivo}>
              {getEnumLabel(t, 'mermaMotivo', motivo)}
            </MenuItem>
          ))}
        </TextField>
        <DateRangeFilter
          startDate={filters.startDate}
          endDate={filters.endDate}
          onChange={(start, end) =>
            onFiltersChange({
              ...filters,
              startDate: start || '',
              endDate: end || '',
            })
          }
          startLabel={t('merma.filtros.desde')}
          endLabel={t('merma.filtros.hasta')}
        />
      </Box>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        onSort={onSort}
        sortConfig={sortConfig}
        filters={tableFilters}
        onFilter={onFilter}
        pagination={pagination}
      />

      <Dialog
        open={notasDialogOpen}
        onClose={() => setNotasDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        aria-labelledby="mermas-notas-dialog-title"
      >
        <DialogTitle id="mermas-notas-dialog-title">
          {t('merma.tabla.notas')}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {notasDialogText}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotasDialogOpen(false)} variant="contained">
            {t('comun.cerrar')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MermasTable;
