import React from 'react';
import { useTranslation } from 'react-i18next';
import PageToolbar, {
  type PageToolbarProps,
} from '../../../components/ui/PageToolbar';
import { PedidoDraftRecord } from '../../../services/pedidoDraft.service';
import { PedidosViewMode } from '../types/pedidos-ui.types';

interface PedidosPageHeaderProps {
  canCreate: boolean;
  draft: PedidoDraftRecord | null;
  isLoadingDraft: boolean;
  totalItems: number;
  totalItemsLabel?: string;
  searchTerm: string;
  viewMode: PedidosViewMode;
  onSearchChange: (value: string) => void;
  onViewModeChange: (mode: PedidosViewMode) => void;
  onCreateClick: () => void;
  onContinueDraftClick: () => void;
  extraActions?: PageToolbarProps['extraActions'];
}

/**
 * @description Page toolbar for the pedidos list page.
 * Wraps the generic PageToolbar with pedidos-specific props: draft resume button,
 * view-mode toggle, and conditional create button visibility.
 * @param props.canCreate - Whether the create-pedido button should be rendered
 * @param props.draft - Existing draft to show a resume banner for, or null
 * @param props.isLoadingDraft - Whether the draft is still being loaded
 * @param props.totalItems - Total item count shown in the toolbar counter
 * @param props.totalItemsLabel - Label suffix for the counter (defaults to 'pedidos')
 * @param props.searchTerm - Current search input value
 * @param props.viewMode - Current list/grid view mode
 * @param props.onSearchChange - Callback for search input changes
 * @param props.onViewModeChange - Callback for view mode toggle
 * @param props.onCreateClick - Callback for the create button
 * @param props.onContinueDraftClick - Callback for the resume-draft button
 * @param props.extraActions - Optional extra action nodes passed to PageToolbar
 * @returns Configured PageToolbar for the pedidos page
 */
const PedidosPageHeader: React.FC<PedidosPageHeaderProps> = ({
  canCreate,
  draft,
  isLoadingDraft,
  totalItems,
  totalItemsLabel = 'pedidos',
  searchTerm,
  viewMode,
  onSearchChange,
  onViewModeChange,
  onCreateClick,
  onContinueDraftClick,
  extraActions = [],
}) => {
  const { t } = useTranslation();
  return (
    <PageToolbar
      title={t('pedidos.gestionTitulo')}
      searchValue={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder={t('pedidos.buscarPlaceholder')}
      searchId="search-pedidos"
      totalItems={totalItems}
      totalItemsLabel={totalItemsLabel}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      primaryAction={
        canCreate
          ? {
              label: t('pedidos.nuevoPedido'),
              onClick: onCreateClick,
              id: 'btn-nuevo-pedido',
            }
          : undefined
      }
      secondaryAction={
        canCreate && draft
          ? {
              label: t('pedidos.continuarPedido'),
              onClick: onContinueDraftClick,
              id: 'btn-continuar-pedido',
              isLoading: isLoadingDraft,
            }
          : undefined
      }
      extraActions={extraActions}
    />
  );
};

export default PedidosPageHeader;
