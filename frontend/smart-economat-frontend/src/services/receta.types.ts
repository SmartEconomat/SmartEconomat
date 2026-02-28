import { ProductoAlergeno } from './producto.types';

export enum DificultadReceta {
    FACIL = 'Fácil',
    MEDIA = 'Media',
    DIFICIL = 'Difícil',
}

export enum TiempoReceta {
    MIN_10 = '10 min',
    MIN_20 = '20 min',
    MIN_30 = '30 min',
    MIN_45 = '45 min',
    MIN_60 = '60 min',
}

export enum UnidadIngrediente {
    GRAMO = 'g',
    KILOGRAMO = 'kg',
    LITRO = 'l',
    MILILITRO = 'ml',
    PIEZA = 'pieza',
    CUCHARADA = 'cda',
    CUCHARADITA = 'cdta',
}

export interface RecetaIngrediente {
    id: string;
    cantidad: number;
    unidad: UnidadIngrediente;
    producto?: {
        id: string;
        nombre: string;
        alergenos?: ProductoAlergeno[];
    };
}

export interface Receta {
    id: string;
    nombre: string;
    instrucciones: string;
    tiempo: TiempoReceta;
    dificultad: DificultadReceta;
    tiempoPreparacion: string;
    ingredientes?: RecetaIngrediente[];
}
