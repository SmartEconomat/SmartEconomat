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
 * Service for managing role templates (plantillas de roles).
 * Supports template creation, updates, duplication, activation/deactivation,
 * permission management with inheritance, and role synchronisation.
 *
 * @class PlantillasRolesService
 */
@Injectable()
export class PlantillasRolesService {
  /**
   * Constructs the PlantillasRolesService with its required dependencies.
   *
   * @param {Repository<PlantillaRol>} plantillaRepo - TypeORM repository for the PlantillaRol entity.
   * @param {Repository<Permiso>} permisoRepo - TypeORM repository for the Permiso entity.
   * @param {Repository<Rol>} rolRepo - TypeORM repository for the Rol entity.
   * @param {AuthPermissionsService} authPermissionsService - Service used to invalidate permission caches after template changes.
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
   * Crea un nuevo role template with an optional parent template and permission set.
   *
   * @param {CreatePlantillaDto} dto - DTO with the template name, description, optional parent ID and permission IDs.
   * @returns {Promise<PlantillaRol>} The newly created template with relations loaded.
   * @throws {ConflictException} When a template with the same name already exists.
   * @throws {NotFoundException} When the specified parent template is not found.
   * @throws {BadRequestException} When assigning the parent would create a circular reference.
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
   * Retrieves all role templates ordered alphabetically by name, with their permissions and parent template.
   *
   * @returns {Promise<PlantillaRol[]>} Lista de todas las plantillas con las relaciones `permisos` y `plantillaPadre` cargadas.
   */
  async findAll(): Promise<PlantillaRol[]> {
    return this.plantillaRepo.find({
      relations: ['permisos', 'plantillaPadre'],
      order: { nombre: 'ASC' },
    });
  }

  /**
   * Retrieves a single role template by its ID with all relations loaded.
   *
   * @param {string} id - UUID of the template to retrieve.
   * @returns {Promise<PlantillaRol>} The found template with `permisos`, `plantillaPadre` and `plantillasHijas` loaded.
   * @throws {NotFoundException} When no template with the given ID exists.
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
   * Actualiza an editable role template's name, description, parent, or permissions.
   * After saving, syncs all linked roles for the updated template and its descendants.
   *
   * @param {string} id - UUID of the template to update.
   * @param {UpdatePlantillaDto} dto - Partial DTO with the fields to change.
   * @returns {Promise<PlantillaRol>} The updated template with all relations loaded.
   * @throws {NotFoundException} When the template is not found.
   * @throws {BadRequestException} When the template is not editable.
   * @throws {BadRequestException} When attempting to rename a protected system template.
   * @throws {ConflictException} When the new name is already taken.
   * @throws {BadRequestException} When permission mutation is not allowed for this template.
   * @throws {BadRequestException} When the new parent would create a circular reference.
   */
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
   * Replaces the permission set of a template and syncs all linked roles.
   *
   * @param {string} id - UUID of the template whose permissions will be updated.
   * @param {string[]} permisoIds - Lista de UUIDs de permisos a asignar to the template.
   * @returns {Promise<PlantillaRol>} The updated template with all relations loaded.
   * @throws {NotFoundException} When the template is not found.
   * @throws {BadRequestException} When permission mutation is not allowed for this template (p. ej. ADMIN or SUPER_ADMIN).
   * @throws {BadRequestException} When any of the provided permission IDs do not exist.
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
   * Crea un duplicado of an existing template with a new unique name.
   * The copy is always editable and shares the same parent and permissions as the original.
   *
   * @param {string} id - UUID of the template to duplicate.
   * @param {string} [nombre] - Optional explicit name for the copy. Auto-generated if omitted.
   * @returns {Promise<PlantillaRol>} The newly created duplicate template with all relations loaded.
   * @throws {NotFoundException} When the source template is not found.
   * @throws {ConflictException} When the computed duplicate name is already taken or a unique name could not be generated.
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
   * Activates or deactivates an editable template.
   *
   * @param {string} id - UUID of the template to activate or deactivate.
   * @param {boolean} activo - El valor deseado activation state.
   * @returns {Promise<PlantillaRol>} The updated template with all relations loaded.
   * @throws {NotFoundException} When the template is not found.
   * @throws {BadRequestException} When the template is not editable.
   */
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

  /** Set of protected template names that cannot be renamed. */
  private static readonly PROTECTED_TEMPLATE_NAMES =
    SYSTEM_ROLE_TEMPLATE_PROTECTED_NAMES;

  /** Set of template names whose permission sets are immutable. */
  private static readonly IMMUTABLE_PERMISSION_TEMPLATE_NAMES =
    SYSTEM_ROLE_TEMPLATE_PERMISSION_LOCKED_NAMES;

  /**
   * Asserts that permission mutation is allowed for the given template.
   * Lanza if the template name belongs to the set of immutable system templates (p. ej. ADMIN, SUPER_ADMIN).
   *
   * @param {PlantillaRol} plantilla - La plantilla entity to validate.
   * @returns {void}
   * @throws {BadRequestException} When the template's permissions cannot be modified.
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
   * Soft-deletes a role template after validating that it is editable, not a protected system
   * template, and not currently linked to any roles.
   *
   * @param {string} id - UUID of the template to remove.
   * @returns {Promise<void>}
   * @throws {NotFoundException} When the template is not found.
   * @throws {BadRequestException} When the template is not editable or is a protected system template.
   * @throws {BadRequestException} When the template is still linked to one or more roles.
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
   * Crea un nuevo role from a template, copiando los permisos efectivos de la plantilla
   * (including inherited ones) into the new role.
   *
   * @param {string} plantillaId - UUID of the source template.
   * @param {string} nombreRol - Name to assign to the new role.
   * @param {string} [descripcionRol] - Optional description for the new role; falls back to the template description.
   * @returns {Promise<Rol>} The newly created role with its permissions assigned.
   * @throws {NotFoundException} When the source template is not found.
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
   * Devuelve los permisos directos, heredados y efectivos permissions of a template.
   * Useful for UI display to distinguish what comes from the template itself vs. from a parent.
   *
   * @param {string} id - UUID of the template to inspect.
   * @returns {Promise<{ permisosDirectos: Permiso[]; permisosHeredados: Permiso[]; permisosEfectivos: Permiso[] }>}
   *   An object with the three permission sets.
   * @throws {NotFoundException} When the template is not found.
   * @throws {BadRequestException} When the template hierarchy contains a circular reference.
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
   * Recursively collects all permission IDs for a template, merging direct and inherited permissions.
   *
   * @param {string} plantillaId - UUID of the template to traverse.
   * @param {Set<string>} [visited] - Set of already-visited template IDs used to detect circular references.
   * @returns {Promise<string[]>} Deduplicated array of permission IDs effective for this template.
   * @throws {BadRequestException} When a circular reference is detected in the template hierarchy.
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
   * Resuelve a list of permission IDs to their full Permiso entities, deduplicating the input.
   *
   * @param {string[]} permisoIds - Array of permission UUIDs to resolve.
   * @returns {Promise<Permiso[]>} Array of matched Permiso entities.
   * @throws {BadRequestException} When any of the provided IDs do not correspond to an existing permission.
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
        I18nHelper.getError('ALGUNOS_PERMISOS_NO_EXISTEN')
      );
    }

    return permisos;
  }

  /**
   * Comprueba that the given template name is not already taken (including soft-deleted records).
   * When `plantillaId` is provided, the check excludes the template itself (for rename operations).
   *
   * @param {string} nombre - La plantilla name to validate.
   * @param {string} [plantillaId] - UUID of the template being renamed; excluded from the uniqueness check.
   * @returns {Promise<void>}
   * @throws {ConflictException} When a template with the same name already exists.
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
   * Valida that assigning `parentId` as the parent of `currentTemplateId` would not
   * create a circular reference by traversing the ancestor chain.
   *
   * @param {string | undefined} currentTemplateId - UUID of the template being updated; excluded from the visited set as the starting node.
   * @param {string | undefined} parentId - UUID of the proposed parent template.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When assigning the parent would create a circular reference.
   * @throws {NotFoundException} When any template in the ancestor chain is not found.
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
          I18nHelper.getError('PLANTILLA_PADRE_NO_ENCONTRADA')
        );
      }

      cursorId = parent.plantillaPadreId;
    }
  }

  /**
   * Realiza a breadth-first traversal starting from `rootTemplateId` to collect the IDs
   * of the template and all of its descendants.
   *
   * @param {string} rootTemplateId - UUID of the root template.
   * @returns {Promise<string[]>} Array of template UUIDs including the root and all descendants.
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
   * Syncs roles linked to each template in `templateIds` and, if any roles were updated,
   * invalidates the entire permissions cache.
   *
   * @param {string[]} templateIds - Array of template UUIDs whose linked roles should be synced.
   * @returns {Promise<void>}
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
   * Actualiza the permissions of all roles linked to a specific template by synchronising them
   * with the template's effective (inherited) permission set.
   *
   * @param {string} templateId - UUID of the template whose linked roles should be synced.
   * @returns {Promise<number>} The number of roles that were updated.
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
   * Genera a unique duplicate name for a template by appending " COPIA" (or " COPIA N") to the base name.
   * Truncates the base name if necessary to keep the total length within 100 characters.
   *
   * @param {string} baseName - El nombre de the original template.
   * @returns {Promise<string>} A unique name for the duplicated template.
   * @throws {ConflictException} When no unique name can be generated within 999 attempts.
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
