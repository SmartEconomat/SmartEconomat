import {
  DificultadReceta,
  TIEMPO_RECETA_VALUES,
  UnidadIngrediente,
} from '../modules/receta/enums/receta.enums';

export type SeedRecipeIngredientSlot = {
  unidades: UnidadIngrediente[];
  cantidadBase: number;
  merma: number;
};

export type SeedRecipeTemplate = {
  nombre: string;
  dificultad: DificultadReceta;
  tiempo: (typeof TIEMPO_RECETA_VALUES)[number];
  raciones: number;
  tamanioRacion: number;
  diasCaducidad: number;
  unidadResultado: UnidadIngrediente;
  instrucciones: string[];
  ingredientes: SeedRecipeIngredientSlot[];
};

export const SEED_RECIPE_TEMPLATES: readonly SeedRecipeTemplate[] = [
  {
    nombre: 'Tortilla espanola',
    dificultad: DificultadReceta.MEDIA,
    tiempo: TIEMPO_RECETA_VALUES[7],
    raciones: 8,
    tamanioRacion: 0.22,
    diasCaducidad: 2,
    unidadResultado: UnidadIngrediente.KILOGRAMO,
    instrucciones: [
      'Pelar y cortar la patata en laminas regulares para fritura uniforme.',
      'Pochar la cebolla y la patata a fuego medio hasta textura melosa.',
      'Mezclar con huevo batido y cuajar por ambas caras sin resecar.',
    ],
    ingredientes: [
      {
        unidades: [UnidadIngrediente.KILOGRAMO, UnidadIngrediente.GRAMO],
        cantidadBase: 1.2,
        merma: 18,
      },
      {
        unidades: [UnidadIngrediente.PIEZA],
        cantidadBase: 16,
        merma: 0,
      },
      {
        unidades: [UnidadIngrediente.LITRO, UnidadIngrediente.MILILITRO],
        cantidadBase: 0.35,
        merma: 0,
      },
    ],
  },
  {
    nombre: 'Paella valenciana',
    dificultad: DificultadReceta.DIFICIL,
    tiempo: TIEMPO_RECETA_VALUES[9],
    raciones: 14,
    tamanioRacion: 0.34,
    diasCaducidad: 2,
    unidadResultado: UnidadIngrediente.KILOGRAMO,
    instrucciones: [
      'Preparar sofrito base con tomate, judia verde y aceite de oliva.',
      'Incorporar carne troceada y nacarar el arroz con el sofrito.',
      'Anadir caldo medido y cocer hasta punto seco con reposo final.',
    ],
    ingredientes: [
      {
        unidades: [UnidadIngrediente.KILOGRAMO, UnidadIngrediente.GRAMO],
        cantidadBase: 1.8,
        merma: 3,
      },
      {
        unidades: [UnidadIngrediente.KILOGRAMO, UnidadIngrediente.GRAMO],
        cantidadBase: 1.6,
        merma: 7,
      },
      {
        unidades: [UnidadIngrediente.LITRO, UnidadIngrediente.MILILITRO],
        cantidadBase: 3.5,
        merma: 1,
      },
      {
        unidades: [UnidadIngrediente.KILOGRAMO, UnidadIngrediente.GRAMO],
        cantidadBase: 1.1,
        merma: 12,
      },
    ],
  },
  {
    nombre: 'Croquetas de jamon',
    dificultad: DificultadReceta.MEDIA,
    tiempo: TIEMPO_RECETA_VALUES[10],
    raciones: 20,
    tamanioRacion: 0.12,
    diasCaducidad: 2,
    unidadResultado: UnidadIngrediente.KILOGRAMO,
    instrucciones: [
      'Elaborar una bechamel espesa con infusion de jamon y nuez moscada.',
      'Enfriar la masa, bolear porciones y empanar con huevo y pan rallado.',
      'Freir en aceite limpio a temperatura estable hasta dorado uniforme.',
    ],
    ingredientes: [
      {
        unidades: [UnidadIngrediente.KILOGRAMO, UnidadIngrediente.GRAMO],
        cantidadBase: 0.6,
        merma: 5,
      },
      {
        unidades: [UnidadIngrediente.LITRO, UnidadIngrediente.MILILITRO],
        cantidadBase: 2,
        merma: 0,
      },
      {
        unidades: [UnidadIngrediente.KILOGRAMO, UnidadIngrediente.GRAMO],
        cantidadBase: 0.35,
        merma: 0,
      },
      {
        unidades: [UnidadIngrediente.PIEZA],
        cantidadBase: 10,
        merma: 0,
      },
    ],
  },
  {
    nombre: 'Patatas bravas',
    dificultad: DificultadReceta.FACIL,
    tiempo: TIEMPO_RECETA_VALUES[6],
    raciones: 12,
    tamanioRacion: 0.25,
    diasCaducidad: 2,
    unidadResultado: UnidadIngrediente.KILOGRAMO,
    instrucciones: [
      'Cortar las patatas en dados y blanquear para igualar coccion.',
      'Freir en dos tiempos para conseguir interior cremoso y exterior crujiente.',
      'Servir con salsa brava emulsionada y toque final de aceite.',
    ],
    ingredientes: [
      {
        unidades: [UnidadIngrediente.KILOGRAMO, UnidadIngrediente.GRAMO],
        cantidadBase: 2.5,
        merma: 14,
      },
      {
        unidades: [UnidadIngrediente.MILILITRO, UnidadIngrediente.LITRO],
        cantidadBase: 0.4,
        merma: 0,
      },
      {
        unidades: [UnidadIngrediente.KILOGRAMO, UnidadIngrediente.GRAMO],
        cantidadBase: 0.3,
        merma: 4,
      },
    ],
  },
  {
    nombre: 'Ensaladilla rusa',
    dificultad: DificultadReceta.FACIL,
    tiempo: TIEMPO_RECETA_VALUES[7],
    raciones: 16,
    tamanioRacion: 0.2,
    diasCaducidad: 2,
    unidadResultado: UnidadIngrediente.KILOGRAMO,
    instrucciones: [
      'Cocer patata y zanahoria al punto, enfriar y cortar en brunoise.',
      'Anadir proteina cocida y mayonesa controlando la textura final.',
      'Rectificar sal y mantener en frio hasta servicio.',
    ],
    ingredientes: [
      {
        unidades: [UnidadIngrediente.KILOGRAMO, UnidadIngrediente.GRAMO],
        cantidadBase: 1.8,
        merma: 12,
      },
      {
        unidades: [UnidadIngrediente.KILOGRAMO, UnidadIngrediente.GRAMO],
        cantidadBase: 0.9,
        merma: 10,
      },
      {
        unidades: [UnidadIngrediente.PIEZA],
        cantidadBase: 12,
        merma: 0,
      },
      {
        unidades: [UnidadIngrediente.LITRO, UnidadIngrediente.MILILITRO],
        cantidadBase: 0.75,
        merma: 0,
      },
    ],
  },
  {
    nombre: 'Gazpacho andaluz',
    dificultad: DificultadReceta.FACIL,
    tiempo: TIEMPO_RECETA_VALUES[3],
    raciones: 18,
    tamanioRacion: 0.25,
    diasCaducidad: 2,
    unidadResultado: UnidadIngrediente.LITRO,
    instrucciones: [
      'Triturar tomate maduro con pimiento, pepino y ajo.',
      'Emulsionar con aceite de oliva y ajustar con vinagre y sal.',
      'Colar fino y abatir para servicio en frio.',
    ],
    ingredientes: [
      {
        unidades: [UnidadIngrediente.KILOGRAMO, UnidadIngrediente.GRAMO],
        cantidadBase: 3.2,
        merma: 6,
      },
      {
        unidades: [UnidadIngrediente.KILOGRAMO, UnidadIngrediente.GRAMO],
        cantidadBase: 0.9,
        merma: 9,
      },
      {
        unidades: [UnidadIngrediente.MILILITRO, UnidadIngrediente.LITRO],
        cantidadBase: 0.45,
        merma: 0,
      },
      {
        unidades: [UnidadIngrediente.KILOGRAMO, UnidadIngrediente.GRAMO],
        cantidadBase: 0.4,
        merma: 4,
      },
    ],
  },
  {
    nombre: 'Salmorejo',
    dificultad: DificultadReceta.FACIL,
    tiempo: TIEMPO_RECETA_VALUES[4],
    raciones: 14,
    tamanioRacion: 0.22,
    diasCaducidad: 2,
    unidadResultado: UnidadIngrediente.LITRO,
    instrucciones: [
      'Triturar tomate y pan reposado para base densa.',
      'Montar con aceite de oliva en hilo fino hasta textura cremosa.',
      'Servir frio con guarnicion de huevo cocido y jamon.',
    ],
    ingredientes: [
      {
        unidades: [UnidadIngrediente.KILOGRAMO, UnidadIngrediente.GRAMO],
        cantidadBase: 2.8,
        merma: 5,
      },
      {
        unidades: [UnidadIngrediente.KILOGRAMO, UnidadIngrediente.GRAMO],
        cantidadBase: 0.75,
        merma: 2,
      },
      {
        unidades: [UnidadIngrediente.MILILITRO, UnidadIngrediente.LITRO],
        cantidadBase: 0.5,
        merma: 0,
      },
      {
        unidades: [UnidadIngrediente.PIEZA],
        cantidadBase: 10,
        merma: 0,
      },
    ],
  },
  {
    nombre: 'Pollo al ajillo',
    dificultad: DificultadReceta.MEDIA,
    tiempo: TIEMPO_RECETA_VALUES[8],
    raciones: 12,
    tamanioRacion: 0.3,
    diasCaducidad: 2,
    unidadResultado: UnidadIngrediente.KILOGRAMO,
    instrucciones: [
      'Sellar el pollo por tandas para concentrar jugos.',
      'Anadir ajo laminado y desglasar con vino blanco seco.',
      'Terminar coccion tapado y reducir salsa para napado final.',
    ],
    ingredientes: [
      {
        unidades: [UnidadIngrediente.KILOGRAMO, UnidadIngrediente.GRAMO],
        cantidadBase: 3.5,
        merma: 8,
      },
      {
        unidades: [UnidadIngrediente.KILOGRAMO, UnidadIngrediente.GRAMO],
        cantidadBase: 0.3,
        merma: 2,
      },
      {
        unidades: [UnidadIngrediente.MILILITRO, UnidadIngrediente.LITRO],
        cantidadBase: 0.6,
        merma: 0,
      },
    ],
  },
  {
    nombre: 'Hamburguesa completa',
    dificultad: DificultadReceta.MEDIA,
    tiempo: TIEMPO_RECETA_VALUES[5],
    raciones: 10,
    tamanioRacion: 0.28,
    diasCaducidad: 1,
    unidadResultado: UnidadIngrediente.KILOGRAMO,
    instrucciones: [
      'Formar porciones de carne de peso constante y reposar en frio.',
      'Planchar carne y pan con control de punto y jugosidad.',
      'Montar con guarniciones frescas y salsa en servicio inmediato.',
    ],
    ingredientes: [
      {
        unidades: [UnidadIngrediente.KILOGRAMO, UnidadIngrediente.GRAMO],
        cantidadBase: 2,
        merma: 4,
      },
      {
        unidades: [UnidadIngrediente.PIEZA],
        cantidadBase: 10,
        merma: 0,
      },
      {
        unidades: [UnidadIngrediente.KILOGRAMO, UnidadIngrediente.GRAMO],
        cantidadBase: 0.8,
        merma: 9,
      },
      {
        unidades: [UnidadIngrediente.MILILITRO, UnidadIngrediente.LITRO],
        cantidadBase: 0.35,
        merma: 0,
      },
    ],
  },
  {
    nombre: 'Pizza margarita',
    dificultad: DificultadReceta.MEDIA,
    tiempo: TIEMPO_RECETA_VALUES[5],
    raciones: 12,
    tamanioRacion: 0.27,
    diasCaducidad: 1,
    unidadResultado: UnidadIngrediente.KILOGRAMO,
    instrucciones: [
      'Amasar y fermentar base de pizza con hidratacion controlada.',
      'Extender masa, napar con salsa de tomate y distribuir queso.',
      'Hornear a alta temperatura y finalizar con albahaca fresca.',
    ],
    ingredientes: [
      {
        unidades: [UnidadIngrediente.KILOGRAMO, UnidadIngrediente.GRAMO],
        cantidadBase: 2.2,
        merma: 1,
      },
      {
        unidades: [UnidadIngrediente.KILOGRAMO, UnidadIngrediente.GRAMO],
        cantidadBase: 1.1,
        merma: 0,
      },
      {
        unidades: [UnidadIngrediente.LITRO, UnidadIngrediente.MILILITRO],
        cantidadBase: 0.9,
        merma: 0,
      },
      {
        unidades: [UnidadIngrediente.MILILITRO, UnidadIngrediente.LITRO],
        cantidadBase: 0.25,
        merma: 0,
      },
    ],
  },
] as const;

export function pickSeedRecipeTemplate(iteration: number): SeedRecipeTemplate {
  return SEED_RECIPE_TEMPLATES[iteration % SEED_RECIPE_TEMPLATES.length];
}
