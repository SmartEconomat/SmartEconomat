import { I18nHelper } from '../../../common/helpers/i18n.helper';
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PlantillaRol } from '../plantilla-rol.entity/plantilla-rol.entity';
import { Permiso } from '../../permisos/permiso.entity/permiso.entity';
import { Rol } from '../../roles/rol.entity/rol.entity';
import { CreatePlantillaDto } from '../dto/create-plantilla.dto';
import { UpdatePlantillaDto } from '../dto/update-plantilla.dto';

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
    private readonly rolRepo: Repository<Rol>
  ) {}

  async create(dto: CreatePlantillaDto): Promise<PlantillaRol> {
    const existente = await this.plantillaRepo.findOne({
      where: { nombre: dto.nombre },
    });
    if (existente) {
      throw new ConflictException(
        `Ya existe una plantilla con el nombre "${dto.nombre}"`
      );
    }

    if (dto.plantillaPadreId) {
      const padre = await this.plantillaRepo.findOne({
        where: { id: dto.plantillaPadreId },
      });
      if (!padre) {
        throw new NotFoundException(
          I18nHelper.getError('PLANTILLA_PADRE_NO_ENCONTRADA')
        );
      }
    }

    const plantilla = this.plantillaRepo.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      esEditable: dto.esEditable !== undefined ? dto.esEditable : true,
      plantillaPadreId: dto.plantillaPadreId,
      activo: true,
    });

    const saved = await this.plantillaRepo.save(plantilla);

    if (dto.permisoIds && dto.permisoIds.length > 0) {
      const permisos = await this.permisoRepo.find({
        where: { id: In(dto.permisoIds) },
      });
      saved.permisos = permisos;
      await this.plantillaRepo.save(saved);
    }

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
      throw new NotFoundException(`Plantilla con ID "${id}" no encontrada`);
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

    if (dto.nombre && dto.nombre !== plantilla.nombre) {
      const existente = await this.plantillaRepo.findOne({
        where: { nombre: dto.nombre },
      });
      if (existente) {
        throw new ConflictException(
          `Ya existe una plantilla con el nombre "${dto.nombre}"`
        );
      }
    }

    if (dto.permisoIds) {
      const permisos = await this.permisoRepo.find({
        where: { id: In(dto.permisoIds) },
      });
      plantilla.permisos = permisos;
    }

    Object.assign(plantilla, {
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      plantillaPadreId: dto.plantillaPadreId,
    });

    return this.plantillaRepo.save(plantilla);
  }

  async remove(id: string): Promise<void> {
    const plantilla = await this.findOne(id);

    if (!plantilla.esEditable) {
      throw new BadRequestException(
        'Esta plantilla de sistema no se puede eliminar'
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
   * Obtiene todos los permisos de una plantilla incluyendo los heredados
   */
  private async getPermisosWithInheritance(
    plantillaId: string
  ): Promise<string[]> {
    const plantilla = await this.findOne(plantillaId);
    const permisosIds = new Set<string>(plantilla.permisos.map((p) => p.id));

    if (plantilla.plantillaPadreId) {
      const permisosPadre = await this.getPermisosWithInheritance(
        plantilla.plantillaPadreId
      );
      permisosPadre.forEach((id) => permisosIds.add(id));
    }

    return Array.from(permisosIds);
  }
}
