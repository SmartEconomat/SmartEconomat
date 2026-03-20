import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ILike } from 'typeorm';
import { Proveedor } from '../proveedor.entity/proveedor.entity';
import { ProveedorRepository } from '../repository/proveedor.repository';
import { CreateProveedorDto } from '../dto/create-proveedor.dto';
import { UpdateProveedorDto } from '../dto/update-proveedor.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@Injectable()
export class ProveedorService {
  constructor(private readonly proveedorRepository: ProveedorRepository) {}

  async create(createProveedorDto: CreateProveedorDto): Promise<Proveedor> {
    const { nombre, nif } = createProveedorDto;

    const existingNombre = await this.proveedorRepository.findOne({
      where: { nombre },
    });
    if (existingNombre) {
      throw new BadRequestException(I18nHelper.getError('DUPLICATE_ENTRY'));
    }

    if (nif) {
      const existingNif = await this.proveedorRepository.findOne({
        where: { nif },
      });
      if (existingNif) {
        throw new BadRequestException(I18nHelper.getError('DUPLICATE_ENTRY'));
      }
    }

    const proveedor = this.proveedorRepository.create(createProveedorDto);
    return await this.proveedorRepository.save(proveedor);
  }

  async findAll(
    query: PaginationQueryDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<Proveedor>> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'ADMINISTRADOR' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const sortBy = query.sortBy ?? 'nombre';
    const order = query.order ?? 'ASC';

    const whereCondition = query.searchTerm
      ? [
          { nombre: ILike(`%${query.searchTerm}%`) },
          { nif: ILike(`%${query.searchTerm}%`) },
          { contacto: ILike(`%${query.searchTerm}%`) },
          { email: ILike(`%${query.searchTerm}%`) },
        ]
      : {};

    const [data, total] = await this.proveedorRepository.findAndCount({
      where: whereCondition,
      relations: ['productos'],
      withDeleted: isAdmin,
      order: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    const processedData = data.map((proveedor) => ({
      ...proveedor,
      productos: proveedor.productos || [],
    }));

    const totalPages = Math.ceil(total / limit) || 1;
    return { data: processedData, total, page, limit, totalPages };
  }

  async findOne(id: string, userRole?: string): Promise<Proveedor> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'ADMINISTRADOR' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';

    const proveedor = await this.proveedorRepository.findOne({
      where: { id },
      withDeleted: isAdmin,
      relations: ['productos'],
    });

    if (!proveedor) {
      throw new NotFoundException(I18nHelper.getError('PROVIDER_NOT_FOUND'));
    }

    return {
      ...proveedor,
      productos: proveedor.productos || [],
    };
  }

  async update(
    id: string,
    updateProveedorDto: UpdateProveedorDto
  ): Promise<Proveedor> {
    const proveedor = await this.findOne(id);
    const { nombre, nif } = updateProveedorDto;

    if (nombre && nombre !== proveedor.nombre) {
      const existingNombre = await this.proveedorRepository.findOne({
        where: { nombre },
      });
      if (existingNombre) {
        throw new BadRequestException(I18nHelper.getError('DUPLICATE_ENTRY'));
      }
    }

    if (nif && nif !== proveedor.nif) {
      const existingNif = await this.proveedorRepository.findOne({
        where: { nif },
      });
      if (existingNif) {
        throw new BadRequestException(I18nHelper.getError('DUPLICATE_ENTRY'));
      }
    }

    this.proveedorRepository.merge(proveedor, updateProveedorDto);
    return await this.proveedorRepository.save(proveedor);
  }

  async remove(id: string): Promise<void> {
    const proveedor = await this.proveedorRepository.findOne({
      where: { id },
      relations: ['productos', 'pedidos'],
    });

    if (!proveedor) {
      throw new NotFoundException(I18nHelper.getError('PROVIDER_NOT_FOUND'));
    }

    if (
      (proveedor.productos && proveedor.productos.length > 0) ||
      (proveedor.pedidos && proveedor.pedidos.length > 0)
    ) {
      throw new BadRequestException(
        I18nHelper.getError('ENTITY_HAS_RELATIONS')
      );
    }

    await this.proveedorRepository.softDelete(id);
  }
}
