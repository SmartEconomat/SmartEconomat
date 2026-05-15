import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import PasoEscaneo from '../../../src/components/recepcion/PasoEscaneo';
import type { RecepcionDraft } from '../../../src/services/recepcion.types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../../src/components/ui/BarcodeScanner', () => ({
  default: ({ onScan }: { onScan?: (code: string) => void }) => (
    <button
      aria-label="emit-recepcion-scan"
      onClick={() => onScan?.('8412345678901')}
    >
      emit-recepcion-scan
    </button>
  ),
}));

const buildDraft = (): RecepcionDraft => ({
  version: 2,
  creadoEn: '2026-01-01T10:00:00.000Z',
  modificadoEn: '2026-01-01T10:00:00.000Z',
  serverVersion: null,
  serverUpdatedAt: null,
  observaciones: '',
  nAlbaran: '',
  pedidosSeleccionados: [],
  productosEspontaneos: [],
  paso: 'ESCANEO_LOTE',
  erroresPorLinea: {},
  enviando: false,
});

describe('PasoEscaneo', () => {
  it('propaga el código escaneado al estado de búsqueda y ejecuta onSearch', () => {
    const setSearchQuery = vi.fn();
    const onSearch = vi.fn();

    render(
      <PasoEscaneo
        searchInputRef={React.createRef<HTMLInputElement>()}
        searchQuery=""
        setSearchQuery={setSearchQuery}
        onSearch={onSearch}
        searching={false}
        isScaleSupported={false}
        isScaleConnected={false}
        isScaleEnabled={false}
        setIsScaleEnabled={vi.fn()}
        isScaleBusy={false}
        onRequestScaleAccess={vi.fn()}
        draft={buildDraft()}
        setDraft={vi.fn()}
        expandedPanel={false}
        setExpandedPanel={vi.fn()}
        onUpdateLinea={vi.fn()}
        isWeightUnit={() => false}
        onOpenWeightScale={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'emit-recepcion-scan' })
    );

    expect(setSearchQuery).toHaveBeenCalledWith('8412345678901');
    expect(onSearch).toHaveBeenCalledWith('8412345678901');
  });
});
