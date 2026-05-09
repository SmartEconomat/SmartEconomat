import { describe, expect, it } from 'vitest';
import {
  inferidasPorLotesFirma,
  mergeUbicacionesParaFiltros,
  ubicacionesDesdeFirmaInferidasLotes,
} from '../../../src/features/inventario/merge-ubicaciones-filtro';

describe('mergeUbicacionesParaFiltros', () => {
  it('prioriza datos de API y añade asignadas e inferidas faltantes', () => {
    const merged = mergeUbicacionesParaFiltros(
      [{ id: 'api-1', nombre: 'Cocina', descripcion: 'x' }],
      [{ id: 'asig-2', nombre: 'Aula 1' }],
      [
        { id: 'infer-3', nombre: 'Almacén frío' },
        { id: 'api-1', nombre: 'NO USA' },
      ]
    );
    expect(merged.some((u) => u.id === 'api-1' && u.nombre === 'Cocina')).toBe(
      true
    );
    expect(merged.map((u) => u.id).sort()).toEqual([
      'api-1',
      'asig-2',
      'infer-3',
    ]);
  });

  it('no duplica id presente tanto en inferidas como en API', () => {
    const merged = mergeUbicacionesParaFiltros(
      [{ id: 'same', nombre: 'Uno' }],
      [],
      [{ id: 'same', nombre: 'Otro nombre' }]
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]?.nombre).toBe('Uno');
  });
});

describe('inferidas desde lotes (firma estable)', () => {
  it('misma firma para dos arrays con igual contenido pero distinta referencia', () => {
    const rowsA = [{ ubicacion: { id: 'u1', nombre: 'Cocina' } }];
    const rowsB = [...rowsA];

    expect(inferidasPorLotesFirma(rowsA)).toBe(inferidasPorLotesFirma(rowsB));
  });

  it('firma estable ignora repetición de ubicación entre lotes', () => {
    const firma = inferidasPorLotesFirma([
      { ubicacion: { id: 'u1', nombre: 'A' } },
      { ubicacion: { id: 'u1', nombre: 'A' } },
    ]);
    expect(ubicacionesDesdeFirmaInferidasLotes(firma)).toEqual([
      { id: 'u1', nombre: 'A' },
    ]);
  });

  it('ordena ids en la firma para estabilidad entre ordenes de aparición', () => {
    const firma = inferidasPorLotesFirma([
      { ubicacion: { id: 'b-id', nombre: 'B' } },
      { ubicacion: { id: 'a-id', nombre: 'A' } },
    ]);
    expect(firma).toBe(
      inferidasPorLotesFirma([
        { ubicacion: { id: 'a-id', nombre: 'A' } },
        { ubicacion: { id: 'b-id', nombre: 'B' } },
      ])
    );
  });

  it('ubicacionesDesdeFirmaInferidasLotes devuelve [] ante JSON inválido', () => {
    expect(ubicacionesDesdeFirmaInferidasLotes('not-json')).toEqual([]);
    expect(ubicacionesDesdeFirmaInferidasLotes('{}')).toEqual([]);
  });

  it('ignora lotes sin id o nombre de ubicación', () => {
    expect(
      inferidasPorLotesFirma([
        { ubicacion: { id: '', nombre: 'X' } },
        { ubicacion: { id: 'u1', nombre: '' } },
        { ubicacion: undefined },
      ])
    ).toBe(JSON.stringify([]));
  });
});
