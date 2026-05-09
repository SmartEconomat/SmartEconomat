import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UsuarioUbicacion } from '../../usuario/usuario-ubicacion.entity/usuario-ubicacion.entity';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { isSherlockElevatedRole } from '../../sherlock-auth/utils/access.utils';

/**
 * ACL por ubicación: decide si un usuario (no privilegiado) puede operar stock/logística
 * en un conjunto de nodos físicos según pivote usuario_ubicacion.
 *
 * Principio deny-by-default: sin filas efectivas ⇒ sin acceso para roles operativos.
 */
@Injectable()
export class UbicacionAccesoPoliticaService {
  /**
   * Crea una instancia con el repo del pivot usuario–ubicación.
   */
  constructor(
    @InjectRepository(UsuarioUbicacion)
    private readonly usuarioUbicacionRepository: Repository<UsuarioUbicacion>
  ) {}

  /**
   * Comprueba que el usuario pueda ejecutar transferencias que tocan todas las ubicaciones dadas.
   */
  async assertPuedeTransferirEnUbicaciones(
    usuarioId: string | undefined,
    usuarioRol: string | undefined,
    ubicacionIds: string[]
  ): Promise<void> {
    await this.assertEnUbicaciones(
      usuarioId,
      usuarioRol,
      ubicacionIds,
      'puedeTransferir'
    );
  }

  /**
   * Validación más laxa útil como base para filtros/consultas (extensible).
   */
  async assertPuedeConsultarEnUbicaciones(
    usuarioId: string | undefined,
    usuarioRol: string | undefined,
    ubicacionIds: string[]
  ): Promise<void> {
    await this.assertEnUbicaciones(
      usuarioId,
      usuarioRol,
      ubicacionIds,
      'puedeConsultar'
    );
  }

  private async assertEnUbicaciones(
    usuarioId: string | undefined,
    usuarioRol: string | undefined,
    ubicacionIds: string[],
    campo: 'puedeTransferir' | 'puedeConsultar'
  ): Promise<void> {
    const uniqueIds = [...new Set(ubicacionIds.filter(Boolean))];
    if (uniqueIds.length === 0) {
      return;
    }

    if (usuarioId && isSherlockElevatedRole(usuarioRol)) {
      return;
    }

    if (!usuarioId) {
      throw new ForbiddenException(
        I18nHelper.getError('LOCATION_ACCESS_DENIED_MISSING_USER')
      );
    }

    const rows = await this.usuarioUbicacionRepository.find({
      where: { usuarioId, ubicacionId: In(uniqueIds) },
      select: {
        ubicacionId: true,
        puedeConsultar: true,
        puedeTransferir: true,
      },
    });

    const map = new Map(
      rows.map((r) => [
        r.ubicacionId,
        campo === 'puedeConsultar' ? r.puedeConsultar : r.puedeTransferir,
      ])
    );

    for (const id of uniqueIds) {
      const allowed = map.get(id);
      if (!allowed) {
        throw new ForbiddenException(
          I18nHelper.getError('LOCATION_ACCESS_DENIED', { id })
        );
      }
    }
  }
}
