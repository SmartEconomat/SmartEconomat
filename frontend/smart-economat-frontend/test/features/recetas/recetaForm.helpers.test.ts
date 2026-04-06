import { describe, expect, it } from 'vitest';
import {
  DificultadReceta,
  Receta,
  UnidadIngrediente,
} from '../../../src/services/receta.types';
import {
  buildRecetaPayload,
  mapRecetaToFormData,
} from '../../../src/features/recetas/recetaForm.helpers';

describe('recetaForm.helpers', () => {
  it('normaliza el payload de receta al contrato backend', async () => {
    const payload = await buildRecetaPayload({
      nombre: ' Paella de verduras ',
      instrucciones: ' Cocer y mezclar. ',
      tiempoPreparacion: '45 min',
      dificultad: DificultadReceta.MEDIA,
      rendimiento: '2,5',
      unidadResultado: UnidadIngrediente.KILOGRAMO,
      diasCaducidad: '3',
      raciones: '4',
      tamanioRacion: '0,5',
      ingredientes: [
        {
          productoId: 'producto-1',
          cantidad: '1.5',
          unidad: UnidadIngrediente.KILOGRAMO,
          mermaAplicada: '0',
        },
      ],
    });

    expect(payload).toMatchObject({
      nombre: 'Paella de verduras',
      instrucciones: 'Cocer y mezclar.',
      tiempoEstimadoMinutos: 45,
      dificultad: DificultadReceta.MEDIA,
      rendimiento: 2.5,
      unidadResultado: UnidadIngrediente.KILOGRAMO,
      diasCaducidad: 3,
      raciones: 4,
      tamanioRacion: 0.5,
      ingredientes: [
        {
          productoId: 'producto-1',
          cantidad: 1.5,
          unidad: UnidadIngrediente.KILOGRAMO,
          mermaAplicada: 0,
        },
      ],
    });
  });

  it('rechaza recetas sin ingredientes validos', async () => {
    await expect(
      buildRecetaPayload({
        nombre: 'Crema',
        instrucciones: 'Batir.',
        tiempoPreparacion: '30 min',
        dificultad: DificultadReceta.FACIL,
        ingredientes: [
          {
            productoId: 'producto-1',
            cantidad: '0',
            unidad: UnidadIngrediente.GRAMO,
          },
        ],
      })
    ).rejects.toThrow(/al menos un ingrediente valido/i);
  });

  it('rechaza recetas con ingredientes de producto no resoluble', async () => {
    await expect(
      buildRecetaPayload({
        nombre: 'Crema rota',
        instrucciones: 'Batir.',
        tiempoPreparacion: '30 min',
        dificultad: DificultadReceta.FACIL,
        ingredientes: [
          {
            cantidad: '1',
            unidad: UnidadIngrediente.GRAMO,
          },
        ],
      })
    ).rejects.toThrow(/producto inactivo o no disponible/i);
  });

  it('normaliza relaciones nulas al mapear una receta al formulario', () => {
    const formData = mapRecetaToFormData({
      id: 'receta-1',
      nombre: 'Crema',
      instrucciones: 'Batir',
      tiempoEstimadoMinutos: 20,
      dificultad: DificultadReceta.FACIL,
      ingredientes: [
        {
          id: 'ingrediente-1',
          productoId: 'producto-1',
          cantidad: 2,
          unidad: UnidadIngrediente.GRAMO,
          proveedorFavoritoId: 'proveedor-1',
          producto: null,
          proveedorFavorito: null,
        },
      ],
    } as unknown as Receta);

    expect(formData).toMatchObject({
      ingredientes: [
        {
          productoId: 'producto-1',
          proveedorFavoritoId: 'proveedor-1',
          producto: undefined,
        },
      ],
    });
  });
});
