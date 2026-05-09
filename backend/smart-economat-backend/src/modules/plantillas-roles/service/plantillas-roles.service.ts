import { I18nHelper } from '../../../common/helpers/i18n.helper';
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AuthPermissionsService } from '../../auth/service/auth-permissions.service';
import { PlantillaRol } from '../plantilla-rol.entity/plantilla-rol.entity';
import { Permiso } from '../../permisos/permiso.entity/permiso.entity';
import { Rol } from '../../roles/rol.entity/rol.entity';
import { CreatePlantillaDto } from '../dto/create-plantilla.dto';
import { UpdatePlantillaDto } from '../dto/update-plantilla.dto';
import {
  SYSTEM_ROLE_TEMPLATE_PERMISSION_LOCKED_NAMES,
  SYSTEM_ROLE_TEMPLATE_PROTECTED_NAMES,
} from '../../../common/constants/system-role-template.constants';

/**
 * Servicio de dominio para plantillas roles.
 */
@Injectable()
export class PlantillasRolesService {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  constructor(
    @InjectRepository(PlantillaRol)
    private readonly plantillaRepo: Repository<PlantillaRol>,
    @InjectRepository(Permiso)
    private readonly permisoRepo: Repository<Permiso>,
    @InjectRepository(Rol)
    private readonly rolRepo: Repository<Rol>,
    private readonly authPermissionsService: AuthPermissionsService
  ) {}

  /**
   * Crea create.
   *
   * @param dto Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async create(dto: CreatePlantillaDto): Promise<PlantillaRol> {
    const nombre = dto.nombre.trim();

    await this.assertNombreDisponible(nombre);
    await this.assertParentChain(undefined, dto.plantillaPadreId);

    const permisos =
      dto.permisoIds !== undefined
        ? await this.resolvePermisos(dto.permisoIds)
        : [];

    const plantilla = this.plantillaRepo.create({
      nombre,
      descripcion: dto.descripcion,
      esEditable: dto.esEditable !== undefined ? dto.esEditable : true,
      plantillaPadreId: dto.plantillaPadreId,
      activo: true,
      permisos,
    });

    const saved = await this.plantillaRepo.save(plantilla);

    return this.findOne(saved.id);
  }

  /**
   * Busca all.
   * @returns Valor resultante de la operación.
   */
  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {Promise<PlantillaRol[]>} Datos efectivos después de ejecutar la operación.
   */
  async findAll(): Promise<PlantillaRol[]> {
    return this.plantillaRepo.find({
      relations: ['permisos', 'plantillaPadre'],
      order: { nombre: 'ASC' },
    });
  }

  /**
   * Busca one.
   *
   * @param id Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async findOne(id: string): Promise<PlantillaRol> {
    const plantilla = await this.plantillaRepo.findOne({
      where: { id },
      relations: ['permisos', 'plantillaPadre', 'plantillasHijas'],
    });

    if (!plantilla) {
      throw new NotFoundException(
        I18nHelper.getError('TEMPLATE_NOT_FOUND', { id })
      );
    }

    return plantilla;
  }

  /**
   * Actualiza update.
   *
   * @param id Parámetro de entrada para la operación.
   * @param dto Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async update(id: string, dto: UpdatePlantillaDto): Promise<PlantillaRol> {
    const plantilla = await this.findOne(id);

    if (!plantilla.esEditable) {
      throw new BadRequestException(
        I18nHelper.getError('TEMPLATE_NOT_EDITABLE')
      );
    }

    if (dto.nombre !== undefined) {
      const nombre = dto.nombre.trim();
      if (
        PlantillasRolesService.PROTECTED_TEMPLATE_NAMES.has(
          plantilla.nombre.toUpperCase()
        ) &&
        nombre.toUpperCase() !== plantilla.nombre.toUpperCase()
      ) {
        throw new BadRequestException(
          I18nHelper.getError('CANNOT_RENAME_SYSTEM_BASE_TEMPLATE')
        );
      }
      await this.assertNombreDisponible(nombre, plantilla.id);
      plantilla.nombre = nombre;
    }

    if (dto.descripcion !== undefined) {
      plantilla.descripcion = dto.descripcion;
    }

    if (dto.plantillaPadreId !== undefined) {
      await this.assertParentChain(plantilla.id, dto.plantillaPadreId);
      plantilla.plantillaPadreId = dto.plantillaPadreId;
    }

    if (dto.permisoIds !== undefined) {
      this.assertTemplatePermissionMutationAllowed(plantilla);
      const permisos = await this.resolvePermisos(dto.permisoIds);
      plantilla.permisos = permisos;
    }

    const updated = await this.plantillaRepo.save(plantilla);

    const affectedTemplateIds = await this.collectTemplateAndDescendantsIds(
      updated.id
    );
    await this.syncRolesForTemplateIds(affectedTemplateIds);

    return this.findOne(updated.id);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {string[]} permisoIds - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PlantillaRol>} Datos efectivos después de ejecutar la operación.
   */
  async updatePermisos(
    id: string,
    permisoIds: string[]
  ): Promise<PlantillaRol> {
    const plantilla = await this.findOne(id);

    this.assertTemplatePermissionMutationAllowed(plantilla);

    plantilla.permisos = await this.resolvePermisos(permisoIds);
    await this.plantillaRepo.save(plantilla);

    const affectedTemplateIds = await this.collectTemplateAndDescendantsIds(
      plantilla.id
    );
    await this.syncRolesForTemplateIds(affectedTemplateIds);

    return this.findOne(plantilla.id);
  }

  /**
   * Ejecuta la lógica de duplicate template dentro del flujo de la aplicación.
   *
   * @param id Parámetro de entrada para la operación.
   * @param nombre Parámetro de entrada para la operación. Opcional.
   * @returns Valor resultante de la operación.
   */
  async duplicateTemplate(id: string, nombre?: string): Promise<PlantillaRol> {
    const plantilla = await this.findOne(id);

    const nombreDuplicado =
      nombre && nombre.trim().length > 0
        ? nombre.trim()
        : await this.buildDuplicateName(plantilla.nombre);

    await this.assertNombreDisponible(nombreDuplicado);

    const duplicada = this.plantillaRepo.create({
      nombre: nombreDuplicado,
      descripcion: plantilla.descripcion,
      esEditable: true,
      activo: plantilla.activo,
      plantillaPadreId: plantilla.plantillaPadreId,
      permisos: plantilla.permisos,
    });

    const saved = await this.plantillaRepo.save(duplicada);
    return this.findOne(saved.id);
  }

  /**
   * Ejecuta la lógica de set template activo dentro del flujo de la aplicación.
   *
   * @param id Parámetro de entrada para la operación.
   * @param activo Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async setTemplateActivo(id: string, activo: boolean): Promise<PlantillaRol> {
    const plantilla = await this.findOne(id);

    if (!plantilla.esEditable) {
      throw new BadRequestException(
        I18nHelper.getError('TEMPLATE_NOT_EDITABLE')
      );
    }

    plantilla.activo = activo;
    const updated = await this.plantillaRepo.save(plantilla);
    return this.findOne(updated.id);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  private static readonly PROTECTED_TEMPLATE_NAMES =
    SYSTEM_ROLE_TEMPLATE_PROTECTED_NAMES;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  private static readonly IMMUTABLE_PERMISSION_TEMPLATE_NAMES =
    SYSTEM_ROLE_TEMPLATE_PERMISSION_LOCKED_NAMES;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  private assertTemplatePermissionMutationAllowed(
    plantilla: PlantillaRol
  ): void {
    if (
      PlantillasRolesService.IMMUTABLE_PERMISSION_TEMPLATE_NAMES.has(
        plantilla.nombre.trim().toUpperCase()
      )
    ) {
      throw new BadRequestException(
        I18nHelper.getError('ADMIN_SUPER_ADMIN_PERMISSIONS_IMMUTABLE')
      );
    }
  }

  /**
   * Elimina remove.
   *
   * @param id Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async remove(id: string): Promise<void> {
    const plantilla = await this.findOne(id);

    if (!plantilla.esEditable) {
      throw new BadRequestException(
        I18nHelper.getError('CANNOT_DELETE_SYSTEM_TEMPLATE')
      );
    }

    if (
      PlantillasRolesService.PROTECTED_TEMPLATE_NAMES.has(
        plantilla.nombre.toUpperCase()
      )
    ) {
      throw new BadRequestException(
        I18nHelper.getError('CANNOT_DELETE_SYSTEM_BASE_ROLE_TEMPLATES')
      );
    }

    const rolesVinculados = await this.rolRepo.count({
      where: { plantillaRolId: plantilla.id },
    });

    if (rolesVinculados > 0) {
      throw new BadRequestException(
        I18nHelper.getError('CANNOT_DELETE_TEMPLATE_LINKED_TO_ROLES', {
          count: rolesVinculados,
        })
      );
    }

    await this.plantillaRepo.softDelete(id);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {string} plantillaId - Entrada efectiva esperada por el contrato.
   * @undefined {string} nombreRol - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} descripcionRol - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Rol>} Datos efectivos después de ejecutar la operación.
   */
  async createRolFromPlantilla(
    plantillaId: string,
    nombreRol: string,
    descripcionRol?: string
  ): Promise<Rol> {
    const plantilla = await this.findOne(plantillaId);

    const permisosIds = await this.getPermisosWithInheritance(plantillaId);

    const rol = this.rolRepo.create({
      nombre: nombreRol,
      descripcion: descripcionRol || plantilla.descripcion,
      esSistema: false,
      activo: true,
      plantillaRolId: plantilla.id,
    });

    const savedRol = await this.rolRepo.save(rol);

    if (permisosIds.length > 0) {
      const permisos = await this.permisoRepo.find({
        where: { id: In(permisosIds) },
      });
      savedRol.permisos = permisos;
      await this.rolRepo.save(savedRol);
    }

    return savedRol;
  }

  /**
   * Obtiene permisos efectivos.
   *
   * @param id Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async getPermisosEfectivos(id: string): Promise<{
    permisosDirectos: Permiso[];
    permisosHeredados: Permiso[];
    permisosEfectivos: Permiso[];
  }> {
    const plantilla = await this.findOne(id);
    const directos = plantilla.permisos;
    const directosIds = new Set(directos.map((p) => p.id));

    let heredados: Permiso[] = [];
    if (plantilla.plantillaPadreId) {
      const padreIds = await this.getPermisosWithInheritance(
        plantilla.plantillaPadreId
      );
      const soloHeredadosIds = padreIds.filter((pid) => !directosIds.has(pid));
      if (soloHeredadosIds.length > 0) {
        heredados = await this.permisoRepo.find({
          where: { id: In(soloHeredadosIds) },
        });
      }
    }

    const efectivos = [...directos, ...heredados];
    return {
      permisosDirectos: directos,
      permisosHeredados: heredados,
      permisosEfectivos: efectivos,
    };
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  private async getPermisosWithInheritance(
    plantillaId: string,
    visited = new Set<string>()
  ): Promise<string[]> {
    if (visited.has(plantillaId)) {
      throw new BadRequestException(
        I18nHelper.getError('TEMPLATE_HIERARCHY_CIRCULAR_REFERENCE')
      );
    }

    visited.add(plantillaId);

    const plantilla = await this.findOne(plantillaId);
    const permisosIds = new Set<string>(plantilla.permisos.map((p) => p.id));

    if (plantilla.plantillaPadreId) {
      const permisosPadre = await this.getPermisosWithInheritance(
        plantilla.plantillaPadreId,
        visited
      );
      permisosPadre.forEach((id) => permisosIds.add(id));
    }

    return Array.from(permisosIds);
  }

  /**
   * Resuelve permisos a partir del contexto disponible.
   *
   * @param permisoIds Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  private async resolvePermisos(permisoIds: string[]): Promise<Permiso[]> {
    if (permisoIds.length === 0) {
      return [];
    }

    const ids = [...new Set(permisoIds)];
    const permisos = await this.permisoRepo.find({
      where: { id: In(ids) },
    });

    if (permisos.length !== ids.length) {
      throw new BadRequestException(
        I18nHelper.getError('SOME_PERMISSIONS_NOT_FOUND')
      );
    }

    return permisos;
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  private async assertNombreDisponible(
    nombre: string,
    plantillaId?: string
  ): Promise<void> {
    const existente = await this.plantillaRepo.findOne({
      where: { nombre },
      withDeleted: true,
    });

    if (existente && existente.id !== plantillaId) {
      throw new ConflictException(
        I18nHelper.getError('TEMPLATE_NAME_ALREADY_EXISTS', { nombre })
      );
    }
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  private async assertParentChain(
    currentTemplateId: string | undefined,
    parentId: string | undefined
  ): Promise<void> {
    if (!parentId) {
      return;
    }

    const visited = new Set<string>();
    if (currentTemplateId) {
      visited.add(currentTemplateId);
    }

    let cursorId: string | undefined = parentId;

    while (cursorId) {
      if (visited.has(cursorId)) {
        throw new BadRequestException(
          I18nHelper.getError('PARENT_TEMPLATE_CIRCULAR_REFERENCE')
        );
      }

      visited.add(cursorId);

      const parent = await this.plantillaRepo.findOne({
        where: { id: cursorId },
        select: ['id', 'plantillaPadreId'],
      });

      if (!parent) {
        throw new NotFoundException(
          I18nHelper.getError('PARENT_TEMPLATE_NOT_FOUND')
        );
      }

      cursorId = parent.plantillaPadreId;
    }
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  private async collectTemplateAndDescendantsIds(
    rootTemplateId: string
  ): Promise<string[]> {
    const discovered = new Set<string>([rootTemplateId]);
    let frontier: string[] = [rootTemplateId];

    while (frontier.length > 0) {
      const children = await this.plantillaRepo.find({
        where: { plantillaPadreId: In(frontier) },
        select: ['id'],
      });

      const nextFrontier: string[] = [];

      for (const child of children) {
        if (!discovered.has(child.id)) {
          discovered.add(child.id);
          nextFrontier.push(child.id);
        }
      }

      frontier = nextFrontier;
    }

    return Array.from(discovered);
  }

  /**
   * Ejecuta la lógica de sync roles for template ids dentro del flujo de la aplicación.
   *
   * @param templateIds Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  private async syncRolesForTemplateIds(templateIds: string[]): Promise<void> {
    let updatedRolesCount = 0;

    for (const templateId of templateIds) {
      updatedRolesCount += await this.syncLinkedRolesFromTemplate(templateId);
    }

    if (updatedRolesCount > 0) {
      await this.authPermissionsService.invalidateAllCache();
    }
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  private async syncLinkedRolesFromTemplate(
    templateId: string
  ): Promise<number> {
    const roles = await this.rolRepo.find({
      where: { plantillaRolId: templateId },
      relations: ['permisos'],
    });

    if (roles.length === 0) {
      return 0;
    }

    const permisoIds = await this.getPermisosWithInheritance(templateId);
    const permisos =
      permisoIds.length > 0
        ? await this.permisoRepo.find({
            where: { id: In(permisoIds) },
          })
        : [];

    for (const rol of roles) {
      rol.permisos = permisos;
    }

    await this.rolRepo.save(roles);
    return roles.length;
  }

  /**
   * Construye duplicate name a partir de los parámetros recibidos.
   *
   * @param baseName Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  private async buildDuplicateName(baseName: string): Promise<string> {
    let sequence = 1;

    while (sequence <= 999) {
      const suffix = sequence === 1 ? ' COPIA' : ` COPIA ${sequence}`;
      const maxBaseLength = Math.max(1, 100 - suffix.length);
      const truncatedBaseName = baseName.slice(0, maxBaseLength).trim();
      const candidate = `${truncatedBaseName}${suffix}`;

      const existing = await this.plantillaRepo.findOne({
        where: { nombre: candidate },
        withDeleted: true,
      });

      if (!existing) {
        return candidate;
      }

      sequence += 1;
    }

    throw new ConflictException(
      I18nHelper.getError('CANNOT_GENERATE_UNIQUE_TEMPLATE_NAME')
    );
  }
}
