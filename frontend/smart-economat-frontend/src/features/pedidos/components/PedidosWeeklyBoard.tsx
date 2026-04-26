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
import {
  isPendingPedidoUsuarioStatus,
  PedidoListItem,
} from '../../../services/pedido.types';
import {
  PedidoActionHandlers,
  PedidoPermissions,
  PedidosViewMode,
} from '../types/pedidos-ui.types';
import PedidoCard from './PedidoCard';
import {
  buildPedidoColumns,
  renderPedidoActions,
} from '../utils/pedidoColumns';
import { useTranslation } from 'react-i18next';
import {
  formatCurrency,
  formatPedidoListNumber,
} from '../utils/pedidoFormatters';
import { getPedidoUsuarioSelectionIds } from '../utils/pedidoOwnOrders';
import { formatLocalizedDate } from '../../../utils/intlFormat';

dayjs.extend(isoWeek);

interface PedidosWeeklyBoardProps {
  data: PedidoListItem[];
  isLoading: boolean;
  permissions: PedidoPermissions;
  viewMode: PedidosViewMode;
  handlers: PedidoActionHandlers;
  totalItems: number;
  isConsolidating?: boolean;
  onConsolidateWeek?: (
    pedidoUsuarioIds: string[],
    weekLabel: string
  ) => Promise<void>;
  enableSelection?: boolean;
  infoMessage?: string;
  emptyMessage?: string;
  warningMessage?: string;
}

interface WeeklyUserGroup {
  userId: string;
  userName: string;
  pedidos: PedidoListItem[];
  visiblePedidos: PedidoListItem[];
}

interface WeeklyGroup {
  weekKey: string;
  label: string;
  totalAmount: number;
  users: WeeklyUserGroup[];
}

// weeklyColumns will be built inside the component using t()

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

  return weekLabel(
    formatLocalizedDate(start.toDate()),
    formatLocalizedDate(end.toDate())
  );
};

const getPedidoUserName = (
  pedido: PedidoListItem,
  unknownLabel: string
): string =>
  pedido.usuario?.nombre ||
  pedido.usuario?.username ||
  pedido.usuario?.email ||
  unknownLabel;

const isPendingPedido = (pedido: PedidoListItem): boolean =>
  isPendingPedidoUsuarioStatus(String(pedido.estado));

/**
 * Documentación en español.
 */
const PedidosWeeklyBoard: React.FC<PedidosWeeklyBoardProps> = ({
  data,
  isLoading,
  viewMode,
  permissions,
  handlers,
  totalItems,
  isConsolidating = false,
  onConsolidateWeek,
  enableSelection = true,
  infoMessage,
  emptyMessage,
  warningMessage,
}) => {
  const { t, i18n } = useTranslation();
  const weeklyColumns = buildPedidoColumns().filter(
    (column) => column.id !== 'usuario'
  );

  const resolvedInfoMessage =
    infoMessage ?? t('pedidos.weeklyBoard.infoMessage');
  const resolvedEmptyMessage =
    emptyMessage ?? t('pedidos.weeklyBoard.emptyMessage');
  const resolvedWarningMessage =
    warningMessage ??
    t('pedidos.weeklyBoard.warningMessage', { count: data.length });

  const [selectedPedidoUsuarioIds, setSelectedPedidoUsuarioIds] = useState<
    string[]
  >([]);

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
          label: getWeekRangeLabel(
            pedido.fechaPedido,
            t('pedidos.weeklyBoard.invalidWeek'),
            (start, end) => t('pedidos.weeklyBoard.weekLabel', { start, end })
          ),
          totalAmount: 0,
          users: [],
        } as WeeklyGroup);

      currentWeek.totalAmount += Number(pedido.costeTotal || 0);

      const userName = getPedidoUserName(
        pedido,
        t('pedidos.weeklyBoard.unknownUser')
      );
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
            visiblePedidos: user.pedidos,
          }))
          .sort((left, right) =>
            left.userName.localeCompare(right.userName, 'es')
          ),
      }))
      .sort((left, right) => right.weekKey.localeCompare(left.weekKey));
  }, [data, t, i18n.language]);

  const toggleUserSelection = (pedidoUsuarioIds: string[]) => {
    const allSelected = pedidoUsuarioIds.every((id) =>
      selectedPedidoUsuarioIds.includes(id)
    );

    setSelectedPedidoUsuarioIds((current) => {
      if (allSelected) {
        return current.filter((id) => !pedidoUsuarioIds.includes(id));
      }

      return Array.from(new Set([...current, ...pedidoUsuarioIds]));
    });
  };

  const getSelectablePedidoUsuarioIds = (pedido: PedidoListItem): string[] =>
    isPendingPedido(pedido) ? getPedidoUsuarioSelectionIds(pedido) : [];

  const hasSelectablePedidos = (group: WeeklyGroup): boolean =>
    group.users.some((user) => user.visiblePedidos.some(isPendingPedido));

  const buildSelectableColumns = (
    pedidoUsuarioIdsInScope: string[]
  ): Column<PedidoListItem>[] => [
    {
      id: 'selection',
      label: (
        <Checkbox
          size="small"
          checked={
            pedidoUsuarioIdsInScope.length > 0 &&
            pedidoUsuarioIdsInScope.every((id) =>
              selectedPedidoUsuarioIds.includes(id)
            )
          }
          indeterminate={
            pedidoUsuarioIdsInScope.some((id) =>
              selectedPedidoUsuarioIds.includes(id)
            ) &&
            !pedidoUsuarioIdsInScope.every((id) =>
              selectedPedidoUsuarioIds.includes(id)
            )
          }
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => {
            event.stopPropagation();
            toggleUserSelection(pedidoUsuarioIdsInScope);
          }}
          inputProps={{
            'aria-label': t('pedidos.weeklyBoard.selectUserOrders'),
          }}
        />
      ),
      align: 'center',
      render: (pedido) =>
        (() => {
          const pedidoUsuarioIds = getSelectablePedidoUsuarioIds(pedido);
          const isSelectable = pedidoUsuarioIds.length > 0;
          const allSelected = pedidoUsuarioIds.every((id) =>
            selectedPedidoUsuarioIds.includes(id)
          );
          const someSelected = pedidoUsuarioIds.some((id) =>
            selectedPedidoUsuarioIds.includes(id)
          );

          return (
            <Checkbox
              size="small"
              checked={isSelectable && allSelected}
              indeterminate={isSelectable && someSelected && !allSelected}
              disabled={!isSelectable}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => {
                event.stopPropagation();
                if (!isSelectable) {
                  return;
                }
                toggleUserSelection(pedidoUsuarioIds);
              }}
              inputProps={{
                'aria-label': t('pedidos.weeklyBoard.selectOrder', {
                  id: pedido.id,
                }),
              }}
            />
          );
        })(),
    },
    ...weeklyColumns,
  ];

  const buildColumns = (
    pedidoUsuarioIdsInScope: string[]
  ): Column<PedidoListItem>[] =>
    enableSelection
      ? buildSelectableColumns(pedidoUsuarioIdsInScope)
      : weeklyColumns;

  const selectedWeekPedidoUsuarioIds = (group: WeeklyGroup): string[] =>
    group.users
      .flatMap((user) =>
        user.visiblePedidos.flatMap((pedido) =>
          getSelectablePedidoUsuarioIds(pedido)
        )
      )
      .filter((id) => selectedPedidoUsuarioIds.includes(id));

  return (
    <Stack spacing={3}>
      <Alert severity="info">{resolvedInfoMessage}</Alert>

      {isLoading && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <DataTable columns={weeklyColumns} data={[]} isLoading hideTopBar />
        </Paper>
      )}

      {!isLoading && groupedData.length === 0 && (
        <Alert severity="info">{resolvedEmptyMessage}</Alert>
      )}

      {!isLoading && totalItems > data.length && (
        <Alert severity="warning">{resolvedWarningMessage}</Alert>
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
                    {t('pedidos.weeklyBoard.usersAndOrders', {
                      users: group.users.length,
                      orders: group.users.reduce(
                        (sum, user) => sum + user.visiblePedidos.length,
                        0
                      ),
                    })}
                  </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Chip
                    color="primary"
                    variant="outlined"
                    label={t('pedidos.weeklyBoard.totalEstimated', {
                      amount: formatCurrency(group.totalAmount),
                    })}
                  />
                </Stack>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {enableSelection &&
                onConsolidateWeek &&
                hasSelectablePedidos(group) && (
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
                        selectedWeekPedidoUsuarioIds(group).length === 0
                      }
                      onClick={() => {
                        const weekPedidoUsuarioIds =
                          selectedWeekPedidoUsuarioIds(group);

                        void onConsolidateWeek(
                          weekPedidoUsuarioIds,
                          group.label
                        ).then(() => {
                          setSelectedPedidoUsuarioIds((current) =>
                            current.filter(
                              (id) => !weekPedidoUsuarioIds.includes(id)
                            )
                          );
                        });
                      }}
                    >
                      {t('pedidos.weeklyBoard.consolidate')}
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
                            {t('pedidos.weeklyBoard.ordersCount', {
                              count: user.visiblePedidos.length,
                            })}{' '}
                            ·{' '}
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
                            getSelectablePedidoUsuarioIds(pedido)
                          )
                        )}
                        data={user.visiblePedidos}
                        isLoading={false}
                        hideTopBar
                        viewMode={viewMode}
                        renderGridItem={(row) => {
                          const pedidoUsuarioIds =
                            getSelectablePedidoUsuarioIds(row);
                          const isSelectable =
                            isPendingPedido(row) && pedidoUsuarioIds.length > 0;
                          const allSelected =
                            isSelectable &&
                            pedidoUsuarioIds.every((id) =>
                              selectedPedidoUsuarioIds.includes(id)
                            );
                          const someSelected =
                            isSelectable &&
                            pedidoUsuarioIds.some((id) =>
                              selectedPedidoUsuarioIds.includes(id)
                            );

                          return (
                            <PedidoCard
                              pedido={row}
                              actions={renderPedidoActions(
                                row,
                                permissions,
                                handlers
                              )}
                              onRowClick={handlers.onView}
                              selectionProps={
                                isSelectable
                                  ? {
                                      checked: allSelected,
                                      indeterminate:
                                        someSelected && !allSelected,
                                      onChange: (e) => {
                                        e.stopPropagation();
                                        toggleUserSelection(pedidoUsuarioIds);
                                      },
                                    }
                                  : undefined
                              }
                            />
                          );
                        }}
                        onRowClick={handlers.onView}
                        getRowAriaLabel={(pedido) =>
                          t('pedidos.drawer.title') +
                          ` ${formatPedidoListNumber(pedido)}`
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
