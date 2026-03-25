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
import DataTable from '../../../components/ui/DataTable';
import { PurchaseBatch } from '../../../services/pedido.types';
import { PurchaseBatchActionHandlers } from '../types/pedidos-ui.types';
import { buildBatchColumns, renderBatchActions } from '../utils/pedidoColumns';
import { formatCurrency, getBatchTotal } from '../utils/pedidoFormatters';

dayjs.extend(isoWeek);

interface PurchasesWeeklyBoardProps {
  batches: PurchaseBatch[];
  isLoading: boolean;
  handlers: PurchaseBatchActionHandlers;
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

const PurchasesWeeklyBoard: React.FC<PurchasesWeeklyBoardProps> = ({
  batches,
  isLoading,
  handlers,
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
      <Alert severity="info">
        Vista de compras consolidadas por proveedor, agrupadas por la semana de
        creación. Desde aquí puedes revisar los lotes y comenzar la recepción de
        mercancía.
      </Alert>

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
          <Accordion key={group.weekKey} defaultExpanded disableGutters>
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
              <DataTable
                columns={columns}
                data={group.batches}
                isLoading={false}
                hideTopBar
                onRowClick={handlers.onView}
                getRowAriaLabel={(row) =>
                  `Abrir detalle de la compra ${row.id.substring(0, 8)}`
                }
                renderActions={(row) => renderBatchActions(row, handlers)}
              />
            </AccordionDetails>
          </Accordion>
        ))}
    </Stack>
  );
};

export default PurchasesWeeklyBoard;
