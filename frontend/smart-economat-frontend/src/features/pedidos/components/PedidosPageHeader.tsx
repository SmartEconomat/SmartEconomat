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
 * Documentación en español.
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
