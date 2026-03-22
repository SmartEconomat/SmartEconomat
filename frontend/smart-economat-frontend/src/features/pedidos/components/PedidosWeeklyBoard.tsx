import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DataTable, { Column } from '../../../components/ui/DataTable';
import { Pedido } from '../../../services/pedido.types';
import {
  PedidoActionHandlers,
  PedidoPermissions,
} from '../types/pedidos-ui.types';
import {
  buildPedidoColumns,
  renderPedidoActions,
} from '../utils/pedidoColumns';
import {
  formatCurrency,
  formatPedidoListNumber,
} from '../utils/pedidoFormatters';
import {
  consolidateOwnPedidos,
  getAggregatedPedidoSourceIds,
  isAggregatedBatchPedido,
} from '../utils/pedidoOwnOrders';

dayjs.extend(isoWeek);

interface PedidosWeeklyBoardProps {
  data: Pedido[];
  isLoading: boolean;
  permissions: PedidoPermissions;
  handlers: PedidoActionHandlers;
  totalItems: number;
  isConsolidating?: boolean;
  onConsolidateWeek?: (pedidoIds: string[], weekLabel: string) => Promise<void>;
  enableSelection?: boolean;
  infoMessage?: string;
  emptyMessage?: string;
  warningMessage?: string;
}

interface WeeklyUserGroup {
  userId: string;
  userName: string;
  pedidos: Pedido[];
  visiblePedidos: Pedido[];
}

interface WeeklyGroup {
  weekKey: string;
  label: string;
  totalAmount: number;
  users: WeeklyUserGroup[];
}

const weeklyColumns = buildPedidoColumns().filter(
  (column) => column.id !== 'usuario'
);

const getWeekRangeLabel = (referenceDate?: string): string => {
  if (!referenceDate || !dayjs(referenceDate).isValid()) {
    return 'Semana sin fecha válida';
  }

  const start = dayjs(referenceDate).startOf('isoWeek');
  const end = dayjs(referenceDate).endOf('isoWeek');

  return `Semana ${start.format('DD/MM')} - ${end.format('DD/MM')}`;
};

const getPedidoUserName = (pedido: Pedido): string =>
  pedido.usuario?.nombre ||
  pedido.usuario?.username ||
  pedido.usuario?.email ||
  'Usuario sin identificar';

const PedidosWeeklyBoard: React.FC<PedidosWeeklyBoardProps> = ({
  data,
  isLoading,
  permissions,
  handlers,
  totalItems,
  isConsolidating = false,
  onConsolidateWeek,
  enableSelection = true,
  infoMessage = 'Vista operativa para revisar los pedidos pendientes agrupados por semana y por usuario antes de consolidarlos por proveedor.',
  emptyMessage = 'No hay pedidos pendientes que coincidan con los filtros actuales.',
  warningMessage = 'Se muestran los primeros {count} pedidos. Si necesitas trabajar con más volumen en una sola vista, el siguiente paso lógico es añadir paginación o filtro de semana específico.',
}) => {
  const [selectedPedidoIds, setSelectedPedidoIds] = useState<string[]>([]);

  const groupedData = useMemo<WeeklyGroup[]>(() => {
    const groups = new Map<string, WeeklyGroup>();

    data.forEach((pedido) => {
      const weekKey = dayjs(pedido.fechaPedido).isValid()
        ? dayjs(pedido.fechaPedido).startOf('isoWeek').format('YYYY-MM-DD')
        : 'sin-fecha';
      const currentWeek =
        groups.get(weekKey) ||
        ({
          weekKey,
          label: getWeekRangeLabel(pedido.fechaPedido),
          totalAmount: 0,
          users: [],
        } as WeeklyGroup);

      currentWeek.totalAmount += Number(pedido.costeTotal || 0);

      const userName = getPedidoUserName(pedido);
      const userId = pedido.usuario?.id || `sin-id-${userName}`;
      const existingUser = currentWeek.users.find(
        (user) => user.userId === userId
      );

      if (existingUser) {
        existingUser.pedidos.push(pedido);
      } else {
        currentWeek.users.push({
          userId,
          userName,
          pedidos: [pedido],
          visiblePedidos: [],
        });
      }

      groups.set(weekKey, currentWeek);
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        users: group.users
          .map((user) => ({
            ...user,
            visiblePedidos: consolidateOwnPedidos(user.pedidos),
          }))
          .sort((left, right) =>
            left.userName.localeCompare(right.userName, 'es')
          ),
      }))
      .sort((left, right) => right.weekKey.localeCompare(left.weekKey));
  }, [data]);

  const toggleUserSelection = (pedidoIds: string[]) => {
    const allSelected = pedidoIds.every((id) => selectedPedidoIds.includes(id));

    setSelectedPedidoIds((current) => {
      if (allSelected) {
        return current.filter((id) => !pedidoIds.includes(id));
      }

      return Array.from(new Set([...current, ...pedidoIds]));
    });
  };

  const buildSelectableColumns = (
    pedidoIdsInScope: string[]
  ): Column<Pedido>[] => [
    {
      id: 'selection',
      label: (
        <Checkbox
          size="small"
          checked={
            pedidoIdsInScope.length > 0 &&
            pedidoIdsInScope.every((id) => selectedPedidoIds.includes(id))
          }
          indeterminate={
            pedidoIdsInScope.some((id) => selectedPedidoIds.includes(id)) &&
            !pedidoIdsInScope.every((id) => selectedPedidoIds.includes(id))
          }
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => {
            event.stopPropagation();
            toggleUserSelection(pedidoIdsInScope);
          }}
          inputProps={{
            'aria-label': 'Seleccionar pedidos del usuario',
          }}
        />
      ),
      align: 'center',
      render: (pedido) =>
        (() => {
          const pedidoIds = getAggregatedPedidoSourceIds(pedido);
          const allSelected = pedidoIds.every((id) =>
            selectedPedidoIds.includes(id)
          );
          const someSelected = pedidoIds.some((id) =>
            selectedPedidoIds.includes(id)
          );

          return (
            <Checkbox
              size="small"
              checked={allSelected}
              indeterminate={someSelected && !allSelected}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => {
                event.stopPropagation();
                toggleUserSelection(pedidoIds);
              }}
              inputProps={{
                'aria-label': `Seleccionar pedido ${pedido.id}`,
              }}
            />
          );
        })(),
    },
    ...weeklyColumns,
  ];

  const buildColumns = (pedidoIdsInScope: string[]): Column<Pedido>[] =>
    enableSelection ? buildSelectableColumns(pedidoIdsInScope) : weeklyColumns;

  const selectedWeekPedidoIds = (group: WeeklyGroup): string[] =>
    group.users
      .flatMap((user) => user.pedidos.map((pedido) => pedido.id))
      .filter((id) => selectedPedidoIds.includes(id));

  return (
    <Stack spacing={3}>
      <Alert severity="info">{infoMessage}</Alert>

      {isLoading && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <DataTable columns={weeklyColumns} data={[]} isLoading hideTopBar />
        </Paper>
      )}

      {!isLoading && groupedData.length === 0 && (
        <Alert severity="info">{emptyMessage}</Alert>
      )}

      {!isLoading && totalItems > data.length && (
        <Alert severity="warning">
          {warningMessage.replace('{count}', String(data.length))}
        </Alert>
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
                    {group.users.length} usuario(s) ·{' '}
                    {group.users.reduce(
                      (sum, user) => sum + user.visiblePedidos.length,
                      0
                    )}{' '}
                    pedido(s)
                  </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Chip
                    color="primary"
                    variant="outlined"
                    label={`Total estimado ${formatCurrency(group.totalAmount)}`}
                  />
                </Stack>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {enableSelection && onConsolidateWeek && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    mb: 2,
                  }}
                >
                  <Button
                    size="small"
                    variant="contained"
                    disabled={
                      isConsolidating ||
                      selectedWeekPedidoIds(group).length === 0
                    }
                    onClick={() => {
                      const weekPedidoIds = selectedWeekPedidoIds(group);

                      void onConsolidateWeek(weekPedidoIds, group.label).then(
                        () => {
                          setSelectedPedidoIds((current) =>
                            current.filter((id) => !weekPedidoIds.includes(id))
                          );
                        }
                      );
                    }}
                  >
                    Consolidar semana
                  </Button>
                </Box>
              )}
              <Stack spacing={2.5}>
                {group.users.map((user) => (
                  <Accordion
                    key={user.userId}
                    defaultExpanded
                    disableGutters
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      overflow: 'hidden',
                      '&:before': { display: 'none' },
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box
                        sx={{
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: { xs: 'flex-start', md: 'center' },
                          flexDirection: { xs: 'column', md: 'row' },
                          gap: 1,
                        }}
                      >
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 700 }}
                          >
                            {user.userName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {user.visiblePedidos.length} pedido(s) ·{' '}
                            {formatCurrency(
                              user.pedidos.reduce(
                                (sum, pedido) =>
                                  sum + Number(pedido.costeTotal || 0),
                                0
                              )
                            )}
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <DataTable
                        columns={buildColumns(
                          user.visiblePedidos.flatMap((pedido) =>
                            getAggregatedPedidoSourceIds(pedido)
                          )
                        )}
                        data={user.visiblePedidos}
                        isLoading={false}
                        hideTopBar
                        onRowClick={handlers.onView}
                        getRowAriaLabel={(pedido) =>
                          isAggregatedBatchPedido(pedido)
                            ? `Ver detalle del pedido ${formatPedidoListNumber(pedido)}`
                            : `Ver detalle del pedido de ${pedido.proveedor?.nombre || 'proveedor desconocido'}`
                        }
                        renderActions={(pedido) =>
                          renderPedidoActions(pedido, permissions, handlers)
                        }
                      />
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
    </Stack>
  );
};

export default PedidosWeeklyBoard;
