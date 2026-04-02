import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DataTable, { Column } from '../../../components/ui/DataTable';
import { PurchaseBatch } from '../../../services/pedido.types';
import { PurchaseBatchActionHandlers } from '../types/pedidos-ui.types';
import { buildBatchColumns, renderBatchActions } from '../utils/pedidoColumns';
import {
  formatCurrency,
  getBatchTotal,
  getBatchPedidosCount,
} from '../utils/pedidoFormatters';
import { PedidosViewMode } from '../types/pedidos-ui.types';
import PurchaseBatchCard from './PurchaseBatchCard';

dayjs.extend(isoWeek);

interface PurchasesWeeklyBoardProps {
  batches: PurchaseBatch[];
  isLoading: boolean;
  viewMode: PedidosViewMode;
  handlers: PurchaseBatchActionHandlers;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  rightHeaderAction?: React.ReactNode;
  emptyMessage?: string;
}

interface WeeklyPurchaseGroup {
  weekKey: string;
  label: string;
  totalAmount: number;
  batches: PurchaseBatch[];
}

const getWeekRangeLabel = (referenceDate?: string): string => {
  if (!referenceDate || !dayjs(referenceDate).isValid()) {
    return 'Semana sin fecha válida';
  }

  const start = dayjs(referenceDate).startOf('isoWeek');
  const end = dayjs(referenceDate).endOf('isoWeek');

  return `Semana ${start.format('DD/MM')} - ${end.format('DD/MM')}`;
};

interface WeeklyBatchTableProps {
  batches: PurchaseBatch[];
  columns: Column<PurchaseBatch>[];
  viewMode: PedidosViewMode;
  handlers: PurchaseBatchActionHandlers;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

const WeeklyBatchTable: React.FC<WeeklyBatchTableProps> = ({
  batches,
  columns,
  viewMode,
  handlers,
  selectable,
  selectedIds,
  onSelectionChange,
}) => {
  const [sortConfig, setSortConfig] = React.useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'asc'
    ) {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedBatches = React.useMemo(() => {
    if (!sortConfig) return batches;

    const sorted = [...batches].sort((a, b) => {
      const { key, direction } = sortConfig;

      let valA: string | number | boolean | null | undefined;
      let valB: string | number | boolean | null | undefined;

      // Extraer valores según la columna
      switch (key) {
        case 'createdAt':
          valA = new Date(a.createdAt).getTime();
          valB = new Date(b.createdAt).getTime();
          break;
        case 'pedidos':
          valA = getBatchPedidosCount(a);
          valB = getBatchPedidosCount(b);
          break;
        case 'costeTotal':
          valA = getBatchTotal(a);
          valB = getBatchTotal(b);
          break;
        case 'estado':
          valA = String(a.estado).toLowerCase();
          valB = String(b.estado).toLowerCase();
          break;
        case 'usuario':
          valA = (a.usuario?.nombre || a.usuario?.username || '').toLowerCase();
          valB = (b.usuario?.nombre || b.usuario?.username || '').toLowerCase();
          break;
        default: {
          const aMap = a as unknown as Record<
            string,
            string | number | boolean | null | undefined
          >;
          const bMap = b as unknown as Record<
            string,
            string | number | boolean | null | undefined
          >;
          valA = aMap[key];
          valB = bMap[key];
        }
      }

      if (valA === undefined || valA === null)
        return direction === 'asc' ? -1 : 1;
      if (valB === undefined || valB === null)
        return direction === 'asc' ? 1 : -1;
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [batches, sortConfig]);

  return (
    <DataTable
      columns={columns}
      data={sortedBatches}
      isLoading={false}
      hideTopBar
      viewMode={viewMode}
      sortConfig={sortConfig || undefined}
      onSort={handleSort}
      renderGridItem={(row) => (
        <PurchaseBatchCard
          batch={row}
          actions={renderBatchActions(row, handlers)}
          onRowClick={handlers.onView}
        />
      )}
      onRowClick={handlers.onView}
      getRowAriaLabel={(row) =>
        `Abrir detalle de la compra ${row.id.substring(0, 8)}`
      }
      selectable={selectable}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      uniqueKey="id"
      renderActions={(row) => renderBatchActions(row, handlers)}
    />
  );
};

const PurchasesWeeklyBoard: React.FC<PurchasesWeeklyBoardProps> = ({
  batches,
  isLoading,
  viewMode,
  handlers,
  selectable,
  selectedIds,
  onSelectionChange,
  emptyMessage = 'No hay compras registradas para los filtros actuales.',
}) => {
  const columns = useMemo(() => buildBatchColumns(), []);

  const groupedData = useMemo<WeeklyPurchaseGroup[]>(() => {
    const groups = new Map<string, WeeklyPurchaseGroup>();

    batches.forEach((batch) => {
      const weekKey = dayjs(batch.createdAt).isValid()
        ? dayjs(batch.createdAt).startOf('isoWeek').format('YYYY-MM-DD')
        : 'sin-fecha';
      const currentWeek =
        groups.get(weekKey) ||
        ({
          weekKey,
          label: getWeekRangeLabel(batch.createdAt),
          totalAmount: 0,
          batches: [],
        } as WeeklyPurchaseGroup);

      currentWeek.totalAmount += getBatchTotal(batch);
      currentWeek.batches.push(batch);
      groups.set(weekKey, currentWeek);
    });

    return Array.from(groups.values()).sort((left, right) =>
      right.weekKey.localeCompare(left.weekKey)
    );
  }, [batches]);

  return (
    <Stack spacing={3}>
      {isLoading && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <DataTable columns={columns} data={[]} isLoading hideTopBar />
        </Paper>
      )}

      {!isLoading && groupedData.length === 0 && (
        <Alert severity="info">{emptyMessage}</Alert>
      )}

      {!isLoading &&
        groupedData.map((group) => (
          <Accordion key={group.weekKey} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', md: 'center' },
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: 1.5,
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {group.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {group.batches.length} lote(s) de compra
                  </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Chip
                    color="primary"
                    variant="outlined"
                    label={`Inversión semanal ${formatCurrency(group.totalAmount)}`}
                  />
                </Stack>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <WeeklyBatchTable
                batches={group.batches}
                columns={columns}
                viewMode={viewMode}
                handlers={handlers}
                selectable={selectable}
                selectedIds={selectedIds}
                onSelectionChange={onSelectionChange}
              />
            </AccordionDetails>
          </Accordion>
        ))}
    </Stack>
  );
};

export default PurchasesWeeklyBoard;
