import { BadRequestException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { Ubicacion } from '../ubicacion.entity/ubicacion.entity';

/**
 * Garantiza la fila `Almacén Principal` / `ALMACEN_PRINCIPAL` usando el `EntityManager`
 * dado (habitualmente `dataSource.manager`, **fuera** de transacciones largas) para que
 * un fallo por UQ no aborte otra transacción abierta.
 */
export async function ensureDefaultAlmacenPrincipalUbicacion(
  manager: EntityManager
): Promise<Ubicacion> {
  let ubicacion = await manager.findOne(Ubicacion, {
    where: { nombre: 'Almacén Principal' },
  });
  if (ubicacion) {
    return ubicacion;
  }
  ubicacion = await manager.findOne(Ubicacion, {
    where: { codigo: 'ALMACEN_PRINCIPAL' },
  });
  if (ubicacion) {
    return ubicacion;
  }
  const created = manager.create(Ubicacion, {
    nombre: 'Almacén Principal',
    codigo: 'ALMACEN_PRINCIPAL',
    descripcion: 'Ubicación por defecto del economato',
  });
  try {
    return await manager.save(created);
  } catch {
    const byCodigo = await manager.findOne(Ubicacion, {
      where: { codigo: 'ALMACEN_PRINCIPAL' },
    });
    if (byCodigo) {
      return byCodigo;
    }
    const byNombre = await manager.findOne(Ubicacion, {
      where: { nombre: 'Almacén Principal' },
    });
    if (byNombre) {
      return byNombre;
    }
    throw new BadRequestException(
      I18nHelper.getError('RECEPTION_FAILED', {
        message: 'No se pudo resolver ubicación Almacén Principal',
      })
    );
  }
}
