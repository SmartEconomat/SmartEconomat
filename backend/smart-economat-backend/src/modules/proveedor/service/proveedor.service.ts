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

@Injectable()
export class ProveedorService {
  constructor(private readonly proveedorRepository: ProveedorRepository) {}

  async create(createProveedorDto: CreateProveedorDto): Promise<Proveedor> {
    const proveedor = this.proveedorRepository.create(createProveedorDto);
    return await this.proveedorRepository.save(proveedor);
  }

  async findAll(
    query: import('../../../common/dto/pagination-query.dto').PaginationQueryDto
  ): Promise<
    import('../../../common/dto/paginated-response.dto').PaginatedResponseDto<Proveedor>
  > {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

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
      order: { nombre: 'ASC' },
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

  async findOne(id: string): Promise<Proveedor> {
    const proveedor = await this.proveedorRepository.findOne({
      where: { id },
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

    this.proveedorRepository.merge(proveedor, updateProveedorDto);
    return await this.proveedorRepository.save(proveedor);
  }

  async remove(id: string): Promise<void> {
    const proveedor = await this.findOne(id);

    if (proveedor.productos && proveedor.productos.length > 0) {
      throw new BadRequestException(
        I18nHelper.getError('PROVIDER_HAS_PRODUCTS')
      );
    }

    await this.proveedorRepository.remove(proveedor);
  }
}
