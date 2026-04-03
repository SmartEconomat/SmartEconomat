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
import {
  formatCurrency,
  formatPedidoListNumber,
} from '../utils/pedidoFormatters';
import { getPedidoUsuarioSelectionIds } from '../utils/pedidoOwnOrders';

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
  emptyMessage?: string;
  warningMessage?: string;
  currentUserId?: string;
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

const getWeekRangeLabel = (referenceDate?: string): string => {
  if (!referenceDate || !dayjs(referenceDate).isValid()) {
    return 'Semana sin fecha válida';
  }

  const start = dayjs(referenceDate).startOf('isoWeek');
  const end = dayjs(referenceDate).endOf('isoWeek');

  return `Semana ${start.format('DD/MM')} - ${end.format('DD/MM')}`;
};

const getPedidoUserName = (pedido: PedidoListItem): string =>
  pedido.usuario?.nombre ||
  pedido.usuario?.username ||
  pedido.usuario?.email ||
  'Usuario sin identificar';

const isPendingPedido = (pedido: PedidoListItem): boolean =>
  isPendingPedidoUsuarioStatus(String(pedido.estado));

const weeklyColumns = buildPedidoColumns().filter(
  (column) => column.id !== 'usuario'
);

interface WeeklyPedidoTableProps {
  pedidos: Pedido[];
  columns: Column<Pedido>[];
  viewMode: PedidosViewMode;
  permissions: PedidoPermissions;
  handlers: PedidoActionHandlers;
  selectedPedidoIds: string[];
  toggleUserSelection: (pedidoIds: string[]) => void;
  currentUserId?: string;
}

const WeeklyPedidoTable: React.FC<WeeklyPedidoTableProps> = ({
  pedidos,
  columns,
  viewMode,
  permissions,
  handlers,
  selectedPedidoIds,
  toggleUserSelection,
  currentUserId,
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

  const sortedPedidos = React.useMemo(() => {
    if (!sortConfig) return pedidos;

    return [...pedidos].sort((a, b) => {
      const { key, direction } = sortConfig;
      let valA: string | number | boolean | null | undefined;
      let valB: string | number | boolean | null | undefined;

      switch (key) {
        case 'pedidoId':
          valA = a.numeroGlobal || a.id;
          valB = b.numeroGlobal || b.id;
          break;
        case 'fechaPedido':
          valA = a.fechaPedido ? new Date(a.fechaPedido).getTime() : 0;
          valB = b.fechaPedido ? new Date(b.fechaPedido).getTime() : 0;
          break;
        case 'fechaEntrega':
          valA = a.fechaEntrega ? new Date(a.fechaEntrega).getTime() : 0;
          valB = b.fechaEntrega ? new Date(b.fechaEntrega).getTime() : 0;
          break;
        case 'costeTotal':
          valA = a.costeTotal || 0;
          valB = b.costeTotal || 0;
          break;
        case 'estado':
          valA = String(a.estado).toLowerCase();
          valB = String(b.estado).toLowerCase();
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
  }, [pedidos, sortConfig]);

  return (
    <DataTable
      columns={columns}
      data={sortedPedidos}
      isLoading={false}
      hideTopBar
      viewMode={viewMode}
      sortConfig={sortConfig || undefined}
      onSort={handleSort}
      renderGridItem={(row) => {
        const pedidoIds = getAggregatedPedidoSourceIds(row);
        const isSelectable = isPendingPedido(row) && pedidoIds.length > 0;
        const allSelected =
          isSelectable &&
          pedidoIds.every((id) => selectedPedidoIds.includes(id));
        const someSelected =
          isSelectable &&
          pedidoIds.some((id) => selectedPedidoIds.includes(id));

        return (
          <PedidoCard
            pedido={row}
            actions={renderPedidoActions(
              row,
              permissions,
              handlers,
              currentUserId
            )}
            onRowClick={handlers.onView}
            selectionProps={
              isSelectable
                ? {
                    checked: allSelected,
                    indeterminate: someSelected && !allSelected,
                    onChange: (e) => {
                      e.stopPropagation();
                      toggleUserSelection(pedidoIds);
                    },
                  }
                : undefined
            }
          />
        );
      }}
      onRowClick={handlers.onView}
      getRowAriaLabel={(pedido) =>
        isAggregatedBatchPedido(pedido)
          ? `Ver detalle del pedido ${formatPedidoListNumber(pedido)}`
          : `Ver detalle del pedido de ${pedido.proveedor?.nombre || 'proveedor desconocido'}`
      }
      renderActions={(pedido) =>
        renderPedidoActions(pedido, permissions, handlers, currentUserId)
      }
    />
  );
};

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
  emptyMessage = 'No hay pedidos pendientes que coincidan con los filtros actuales.',
  warningMessage = 'Se muestran los primeros {count} pedidos. Si necesitas trabajar con más volumen en una sola vista, el siguiente paso lógico es añadir paginación o filtro de semana específico.',
  currentUserId,
}) => {
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
            visiblePedidos: user.pedidos,
          }))
          .sort((left, right) =>
            left.userName.localeCompare(right.userName, 'es')
          ),
      }))
      .sort((left, right) => right.weekKey.localeCompare(left.weekKey));
  }, [data]);

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

  const getSelectableUserIds = (user: WeeklyUserGroup): string[] =>
    user.visiblePedidos.flatMap((pedido) => getSelectablePedidoIds(pedido));

  const getSelectableWeekIds = (group: WeeklyGroup): string[] =>
    group.users.flatMap((user) => getSelectableUserIds(user));

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
            'aria-label': 'Seleccionar pedidos del usuario',
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
                'aria-label': `Seleccionar pedido ${pedido.id}`,
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
          <Accordion key={group.weekKey} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  alignItems: { xs: 'flex-start', md: 'center' },
                  flexDirection: 'row',
                  gap: 1,
                }}
              >
                {enableSelection && (
                  <Checkbox
                    size="small"
                    checked={(() => {
                      const ids = getSelectableWeekIds(group);
                      return (
                        ids.length > 0 &&
                        ids.every((id) => selectedPedidoIds.includes(id))
                      );
                    })()}
                    indeterminate={(() => {
                      const ids = getSelectableWeekIds(group);
                      const selectedCount = ids.filter((id) =>
                        selectedPedidoIds.includes(id)
                      ).length;
                      return selectedCount > 0 && selectedCount < ids.length;
                    })()}
                    disabled={getSelectableWeekIds(group).length === 0}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleUserSelection(getSelectableWeekIds(group));
                    }}
                  />
                )}
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
                      Consolidar compra semanal
                    </Button>
                  </Box>
                )}
              <Stack spacing={2.5}>
                {group.users.map((user) => (
                  <Accordion
                    key={user.userId}
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
                          alignItems: { xs: 'flex-start', md: 'center' },
                          flexDirection: 'row',
                          gap: 1,
                        }}
                      >
                        {enableSelection && (
                          <Checkbox
                            size="small"
                            checked={(() => {
                              const ids = getSelectableUserIds(user);
                              return (
                                ids.length > 0 &&
                                ids.every((id) =>
                                  selectedPedidoIds.includes(id)
                                )
                              );
                            })()}
                            indeterminate={(() => {
                              const ids = getSelectableUserIds(user);
                              const selectedCount = ids.filter((id) =>
                                selectedPedidoIds.includes(id)
                              ).length;
                              return (
                                selectedCount > 0 && selectedCount < ids.length
                              );
                            })()}
                            disabled={getSelectableUserIds(user).length === 0}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleUserSelection(getSelectableUserIds(user));
                            }}
                          />
                        )}
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
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <WeeklyPedidoTable
                        pedidos={user.visiblePedidos}
                        columns={buildColumns(
                          user.visiblePedidos.flatMap((pedido) =>
                            getSelectablePedidoUsuarioIds(pedido)
                          )
                        )}
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
                          `Ver detalle del pedido ${formatPedidoListNumber(pedido)}`
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
