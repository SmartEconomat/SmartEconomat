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
 * Servicio para gestión de plantillas de roles.
 * Soporta herencia entre plantillas.
 */
@Injectable()
export class PlantillasRolesService {
  constructor(
    @InjectRepository(PlantillaRol)
    private readonly plantillaRepo: Repository<PlantillaRol>,
    @InjectRepository(Permiso)
    private readonly permisoRepo: Repository<Permiso>,
    @InjectRepository(Rol)
    private readonly rolRepo: Repository<Rol>,
    private readonly authPermissionsService: AuthPermissionsService
  ) {}

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

  async findAll(): Promise<PlantillaRol[]> {
    return this.plantillaRepo.find({
      relations: ['permisos', 'plantillaPadre'],
      order: { nombre: 'ASC' },
    });
  }

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

  async update(id: string, dto: UpdatePlantillaDto): Promise<PlantillaRol> {
    const plantilla = await this.findOne(id);

    if (!plantilla.esEditable) {
      throw new BadRequestException(
        I18nHelper.getError('ESTA_PLANTILLA_NO_ES_EDITABLE')
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
          'No se puede renombrar una plantilla base del sistema'
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

  async setTemplateActivo(id: string, activo: boolean): Promise<PlantillaRol> {
    const plantilla = await this.findOne(id);

    if (!plantilla.esEditable) {
      throw new BadRequestException(
        I18nHelper.getError('ESTA_PLANTILLA_NO_ES_EDITABLE')
      );
    }

    plantilla.activo = activo;
    const updated = await this.plantillaRepo.save(plantilla);
    return this.findOne(updated.id);
  }

  private static readonly PROTECTED_TEMPLATE_NAMES =
    SYSTEM_ROLE_TEMPLATE_PROTECTED_NAMES;

  private static readonly IMMUTABLE_PERMISSION_TEMPLATE_NAMES =
    SYSTEM_ROLE_TEMPLATE_PERMISSION_LOCKED_NAMES;

  private assertTemplatePermissionMutationAllowed(
    plantilla: PlantillaRol
  ): void {
    if (
      PlantillasRolesService.IMMUTABLE_PERMISSION_TEMPLATE_NAMES.has(
        plantilla.nombre.trim().toUpperCase()
      )
    ) {
      throw new BadRequestException(
        'Los permisos de las plantillas ADMIN y SUPER_ADMIN no se pueden modificar'
      );
    }
  }

  async remove(id: string): Promise<void> {
    const plantilla = await this.findOne(id);

    if (!plantilla.esEditable) {
      throw new BadRequestException(
        'Esta plantilla de sistema no se puede eliminar'
      );
    }

    if (
      PlantillasRolesService.PROTECTED_TEMPLATE_NAMES.has(
        plantilla.nombre.toUpperCase()
      )
    ) {
      throw new BadRequestException(
        'Las plantillas base de roles del sistema no se pueden eliminar'
      );
    }

    const rolesVinculados = await this.rolRepo.count({
      where: { plantillaRolId: plantilla.id },
    });

    if (rolesVinculados > 0) {
      throw new BadRequestException(
        `No se puede eliminar la plantilla. Está vinculada a ${rolesVinculados} rol(es)`
      );
    }

    await this.plantillaRepo.softDelete(id);
  }

  /**
   * Crear un rol desde una plantilla (copia los permisos base)
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
   * Devuelve permisos directos, heredados y efectivos de una plantilla.
   * Útil para la UI: muestra qué viene de la plantilla y qué del padre.
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
   * Obtiene todos los permisos de una plantilla incluyendo los heredados
   */
  private async getPermisosWithInheritance(
    plantillaId: string,
    visited = new Set<string>()
  ): Promise<string[]> {
    if (visited.has(plantillaId)) {
      throw new BadRequestException(
        'La jerarquía de plantillas contiene una referencia circular'
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
        I18nHelper.getError('ALGUNOS_PERMISOS_NO_EXISTEN')
      );
    }

    return permisos;
  }

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
        `Ya existe una plantilla con el nombre "${nombre}"`
      );
    }
  }

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
          'La plantilla padre produce una referencia circular'
        );
      }

      visited.add(cursorId);

      const parent = await this.plantillaRepo.findOne({
        where: { id: cursorId },
        select: ['id', 'plantillaPadreId'],
      });

      if (!parent) {
        throw new NotFoundException(
          I18nHelper.getError('PLANTILLA_PADRE_NO_ENCONTRADA')
        );
      }

      cursorId = parent.plantillaPadreId;
    }
  }

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

  private async syncRolesForTemplateIds(templateIds: string[]): Promise<void> {
    let updatedRolesCount = 0;

    for (const templateId of templateIds) {
      updatedRolesCount += await this.syncLinkedRolesFromTemplate(templateId);
    }

    if (updatedRolesCount > 0) {
      await this.authPermissionsService.invalidateAllCache();
    }
  }

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
      'No se pudo generar un nombre único para la plantilla duplicada'
    );
  }
}
