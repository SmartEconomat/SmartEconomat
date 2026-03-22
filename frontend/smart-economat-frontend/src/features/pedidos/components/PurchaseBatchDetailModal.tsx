import React from 'react';
import DynamicFormModal from '../../../components/ui/DynamicFormModal';
import { PurchaseBatch } from '../../../services/pedido.types';

interface PurchaseBatchDetailModalProps {
  batch: PurchaseBatch | null;
  onClose: () => void;
}

const PurchaseBatchDetailModal: React.FC<PurchaseBatchDetailModalProps> = ({
  batch,
  onClose,
}) => (
  <DynamicFormModal
    isOpen={!!batch}
    onClose={onClose}
    title={`Lote de Compra: ${batch?.id.split('-')[0] || ''}...`}
    size="lg"
    fields={[
      {
        name: 'batch',
        label: '',
        type: 'batchViewer',
        position: 'bottom',
      },
    ]}
    initialData={{ batch }}
    onSubmit={onClose}
    submitLabel="Cerrar"
    cancelLabel=""
  />
);

export default PurchaseBatchDetailModal;
