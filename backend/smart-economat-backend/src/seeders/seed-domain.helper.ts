import { MoreThan } from 'typeorm';
import { SeedContext } from './seed-context';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import { rolUsuario, UserStatus } from '../modules/usuario/enums/usuario.enums';
import { AlumnoSlot } from '../modules/profesor/profesor.entity/alumno-slot.entity';
import { AlumnoService } from '../modules/alumno/service/alumno.service';
import { ProfesorService } from '../modules/profesor/service/profesor.service';
import { RegisterAlumnoDto } from '../modules/alumno/dto/register-alumno.dto';
import { ChangeProfesorDto } from '../modules/alumno/dto/change-profesor.dto';
import { ProductoProveedor } from '../modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { Inventario } from '../modules/inventario/inventario.entity/inventario.entity';
import { Producto } from '../modules/producto/producto.entity/producto.entity';
import { ProduccionService } from '../modules/receta/service/produccion.service';
import { Receta } from '../modules/receta/receta.entity/receta.entity';
import { ValidarProduccionDto } from '../modules/receta/dto/validar-produccion.dto';

export interface SeedStockedProduct {
  producto: Producto;
  stockDisponible: number;
}

export interface SeedPreparacionPlan {
  receta: Receta;
  cantidadAProducir: number;
}

export async function getOperationalUsers(
  context: SeedContext
): Promise<Usuario[]> {
  return context.find(Usuario, {
    where: [
      { rol: rolUsuario.SUPER_ADMIN, activo: true } as any,
      { rol: rolUsuario.ADMINISTRADOR, activo: true } as any,
      { rol: rolUsuario.PROFESOR, activo: true } as any,
    ],
    order: { createdAt: 'ASC' } as any,
  });
}

export async function getAlumnoSlots(
  context: SeedContext
): Promise<AlumnoSlot[]> {
  return context.find(AlumnoSlot, {
    relations: ['profesor', 'profesor.user', 'alumnos', 'alumnos.user'],
    order: {
      profesor: { createdAt: 'ASC' },
      aula: 'ASC',
      numeroClase: 'ASC',
    } as any,
  });
}

export async function ensureAlumnoRegisteredForSlot(
  context: SeedContext,
  slot: AlumnoSlot,
  payload: {
    username: string;
    password: string;
  }
): Promise<Usuario> {
  const alumnoService = context.get<AlumnoService>(AlumnoService);
  const profesorService = context.get<ProfesorService>(ProfesorService);

  let alumnoUser = await context.findOne(Usuario, {
    where: { username: payload.username } as any,
    relations: [
      'alumno',
      'alumno.slot',
      'alumno.slot.profesor',
      'alumno.slot.profesor.user',
    ],
  });

  if (!alumnoUser) {
    const registerDto = await context.validateDto(RegisterAlumnoDto, {
      username: payload.username,
      password: payload.password,
      codigoClase: slot.codigoSlot,
    });
    await alumnoService.register(registerDto);

    alumnoUser = await context.findOne(Usuario, {
      where: { username: payload.username } as any,
      relations: [
        'alumno',
        'alumno.slot',
        'alumno.slot.profesor',
        'alumno.slot.profesor.user',
      ],
    });
  }

  if (!alumnoUser?.alumno) {
    throw new Error(
      `No se pudo resolver el alumno seed para ${payload.username}`
    );
  }

  if (alumnoUser.alumno.slot?.id !== slot.id) {
    const changeDto = await context.validateDto(ChangeProfesorDto, {
      cialNuevoProfesor: slot.profesor.cial,
      nuevaAula: slot.aula,
      nuevoNumeroClase: slot.numeroClase,
    });

    await alumnoService.changeProfesor(
      alumnoUser.id,
      alumnoUser.id,
      rolUsuario.ALUMNO,
      changeDto
    );

    alumnoUser = await context.findOne(Usuario, {
      where: { username: payload.username } as any,
      relations: [
        'alumno',
        'alumno.slot',
        'alumno.slot.profesor',
        'alumno.slot.profesor.user',
      ],
    });
  }

  if (!alumnoUser?.alumno) {
    throw new Error(
      `No se pudo reasignar el alumno seed para ${payload.username}`
    );
  }

  if (
    alumnoUser.status !== UserStatus.ACTIVE &&
    alumnoUser.alumno.slot?.profesor?.user?.id
  ) {
    await profesorService.activateAlumno(
      alumnoUser.alumno.slot.profesor.user.id,
      alumnoUser.alumno.id
    );

    alumnoUser = await context.findOne(Usuario, {
      where: { username: payload.username } as any,
      relations: [
        'alumno',
        'alumno.slot',
        'alumno.slot.profesor',
        'alumno.slot.profesor.user',
      ],
    });
  }

  if (!alumnoUser) {
    throw new Error(
      `No se pudo activar el alumno seed para ${payload.username}`
    );
  }

  return alumnoUser;
}

export async function getOrderableProductProviders(
  context: SeedContext,
  take = 100
): Promise<ProductoProveedor[]> {
  return context.find(ProductoProveedor, {
    take,
    relations: ['proveedor', 'producto'],
    order: {
      proveedor: { nombre: 'ASC' },
      producto: { nombre: 'ASC' },
      createdAt: 'ASC',
    } as any,
  });
}

export async function getStockedProducts(
  context: SeedContext,
  take = 100
): Promise<SeedStockedProduct[]> {
  const inventarios = await context.find(Inventario, {
    where: { cantidadActual: MoreThan(0) } as any,
    relations: ['productoProveedor', 'productoProveedor.producto'],
    order: {
      createdAt: 'ASC',
      productoProveedor: { producto: { nombre: 'ASC' } },
    } as any,
    take: take * 4,
  });

  const grouped = new Map<string, SeedStockedProduct>();

  for (const inventario of inventarios) {
    const producto = inventario.productoProveedor?.producto;
    if (!producto) {
      continue;
    }

    const current = grouped.get(producto.id);
    const cantidadActual = Number(inventario.cantidadActual || 0);

    grouped.set(producto.id, {
      producto,
      stockDisponible: Number(
        ((current?.stockDisponible || 0) + cantidadActual).toFixed(3)
      ),
    });
  }

  return Array.from(grouped.values()).slice(0, take);
}

export async function getProducibleRecipePlans(
  context: SeedContext,
  take = 20
): Promise<SeedPreparacionPlan[]> {
  const produccionService = context.get<ProduccionService>(ProduccionService);
  const recetas = await context.find(Receta, {
    relations: ['ingredientes', 'ingredientes.producto'],
    order: { createdAt: 'ASC' } as any,
    take: Math.max(take * 3, take),
  });

  const plans: SeedPreparacionPlan[] = [];

  for (const receta of recetas) {
    const rendimientoBase = Number(receta.rendimiento || 0);
    if (!receta.ingredientes?.length || rendimientoBase <= 0) {
      continue;
    }

    let cantidadAProducir: number | null = null;

    for (const multiplier of [3, 2, 1]) {
      const cantidad = Number((rendimientoBase * multiplier).toFixed(3));
      const validateDto = await context.validateDto(ValidarProduccionDto, {
        items: [{ recetaId: receta.id, cantidad }],
      });
      const validation = await produccionService.validarMultiple(validateDto);

      if (
        validation.ingredients.length > 0 &&
        validation.ingredients.every((ingredient) => ingredient.isEnough)
      ) {
        cantidadAProducir = cantidad;
        break;
      }
    }

    if (!cantidadAProducir) {
      continue;
    }

    plans.push({
      receta,
      cantidadAProducir,
    });

    if (plans.length >= take) {
      break;
    }
  }

  return plans;
}
