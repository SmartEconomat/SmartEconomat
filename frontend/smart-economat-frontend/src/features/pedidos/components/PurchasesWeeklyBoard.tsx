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
import { PedidosViewMode } from '../types/pedidos-ui.types';
import PurchaseBatchCard from './PurchaseBatchCard';
import { useTranslation } from 'react-i18next';

dayjs.extend(isoWeek);

interface PurchasesWeeklyBoardProps {
  batches: PurchaseBatch[];
  isLoading: boolean;
  viewMode: PedidosViewMode;
  handlers: PurchaseBatchActionHandlers;
  emptyMessage?: string;
}

interface WeeklyPurchaseGroup {
  weekKey: string;
  label: string;
  totalAmount: number;
  batches: PurchaseBatch[];
}

const getWeekRangeLabel = (
  referenceDate: string | undefined,
  invalidLabel: string,
  weekLabel: (start: string, end: string) => string
): string => {
  if (!referenceDate || !dayjs(referenceDate).isValid()) {
    return invalidLabel;
  }

  const start = dayjs(referenceDate).startOf('isoWeek');
  const end = dayjs(referenceDate).endOf('isoWeek');

  return weekLabel(start.format('DD/MM'), end.format('DD/MM'));
};

/**
 * @description Weekly accordion board for displaying purchase batches grouped by ISO week.
 * Supports list and grid view modes; shows an empty message when no batches are present.
 * @param props.batches - Array of PurchaseBatch objects to display
 * @param props.isLoading - Whether data is being fetched
 * @param props.viewMode - 'list' or 'grid' display mode
 * @param props.handlers - Action callbacks for each batch row
 * @param props.emptyMessage - Optional message shown when there are no batches
 * @returns Accordion-based weekly board for purchase batches
 */
const PurchasesWeeklyBoard: React.FC<PurchasesWeeklyBoardProps> = ({
  batches,
  isLoading,
  viewMode,
  handlers,
  emptyMessage,
}) => {
  const { t } = useTranslation();

  const columns = useMemo(() => buildBatchColumns(), []);

  const resolvedEmptyMessage =
    emptyMessage ?? t('pedidos.purchasesWeeklyBoard.emptyMessage');

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
          label: getWeekRangeLabel(
            batch.createdAt,
            t('pedidos.purchasesWeeklyBoard.invalidWeek'),
            (start, end) =>
              t('pedidos.purchasesWeeklyBoard.weekLabel', { start, end })
          ),
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
  }, [batches, t]);

  return (
    <Stack spacing={3}>
      <Alert severity="info">
        {t('pedidos.purchasesWeeklyBoard.infoMessage')}
      </Alert>

      {isLoading && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <DataTable columns={columns} data={[]} isLoading hideTopBar />
        </Paper>
      )}

      {!isLoading && groupedData.length === 0 && (
        <Alert severity="info">{resolvedEmptyMessage}</Alert>
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
                    {t('pedidos.purchasesWeeklyBoard.batchesCount', {
                      count: group.batches.length,
                    })}
                  </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Chip
                    color="primary"
                    variant="outlined"
                    label={t('pedidos.purchasesWeeklyBoard.weeklyInvestment', {
                      amount: formatCurrency(group.totalAmount),
                    })}
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
                viewMode={viewMode}
                renderGridItem={(row) => (
                  <PurchaseBatchCard
                    batch={row}
                    actions={renderBatchActions(row, handlers)}
                    onRowClick={handlers.onView}
                  />
                )}
                onRowClick={handlers.onView}
                getRowAriaLabel={(row) =>
                  t('pedidos.purchasesWeeklyBoard.openDetail', {
                    id: row.id.substring(0, 8),
                  })
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
