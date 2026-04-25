/**
 * @module IncidenciaResuelaService
 * Service layer for managing resolved-incidencia records (IncidenciaResuelta).
 * Handles creation, listing, retrieval, update and soft-deletion of resolution records
 * while keeping the parent Incidencia entity in sync.
 */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncidenciaResuelta } from '../incidencia-resuelta.entity/incidencia-resuelta.entity';
import { IncidenciaResuelaRepository } from '../repository/incidencia-resuelta.repository';
import { Incidencia } from '../incidencia.entity/incidencia.entity';
import { CreateIncidenciaResuelaDto } from '../dto/create-incidencia.dto';
import { UpdateIncidenciaResuelaDto } from '../dto/update-incidencia.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

/**
 * Service that manages the lifecycle of IncidenciaResuelta records.
 * Each resolution record is linked to a parent Incidencia and a resolving user.
 * Creating a resolution also closes the parent incidencia; removing a resolution reopens it.
 * @class IncidenciaResuelaService
 */
@Injectable()
export class IncidenciaResuelaService {
  /**
   * Constructs the IncidenciaResuelaService with its required dependencies.
   * @param {IncidenciaResuelaRepository} incidenciaResuelaRepository - Custom repository for IncidenciaResuelta with pagination support.
   * @param {Repository<Incidencia>} incidenciaRepository - TypeORM repository for Incidencia, used to read and update parent records.
   */
  constructor(
    private readonly incidenciaResuelaRepository: IncidenciaResuelaRepository,
    @InjectRepository(Incidencia)
    private readonly incidenciaRepository: Repository<Incidencia>
  ) {}

  /**
   * Creates a resolution record for an existing open incidencia.
   * Also calls `incidencia.resolver()` and saves the parent entity to mark it closed.
   * @param {CreateIncidenciaResuelaDto} dto - Payload containing the incidencia ID, resolver user ID,
   *   resolution type and optional observations.
   * @returns {Promise<IncidenciaResuelta>} The newly created resolution record.
   * @throws {NotFoundException} If no incidencia with `dto.idIncidencia` exists.
   * @throws {BadRequestException} If the incidencia is already resolved.
   */
  async create(dto: CreateIncidenciaResuelaDto): Promise<IncidenciaResuelta> {
    const incidencia = await this.incidenciaRepository.findOne({
      where: { id: dto.idIncidencia },
    });

    if (!incidencia) {
      throw new NotFoundException(I18nHelper.getError('INCIDENCIA_NOT_FOUND'));
    }

    const resolucionExistente =
      await this.incidenciaResuelaRepository.findByIncidencia(dto.idIncidencia);

    if (resolucionExistente) {
      throw new BadRequestException(
        I18nHelper.getError('INCIDENCIA_YA_RESUELTA')
      );
    }

    incidencia.resolver(dto.idUsuarioResolutor, dto.observaciones);
    await this.incidenciaRepository.save(incidencia);

    const resolucion = this.incidenciaResuelaRepository.create({
      incidencia: { id: dto.idIncidencia } as Incidencia,
      usuarioResolutor: { id: dto.idUsuarioResolutor } as any,
      tipoResolucion: dto.tipoResolucion,
      fechaResolucion: new Date(),
      observaciones: dto.observaciones,
    });

    return this.incidenciaResuelaRepository.save(resolucion);
  }

  /**
   * Returns a paginated list of resolution records.
   * Admin and super-admin roles can also see soft-deleted records.
   * @param {PaginationQueryDto} query - Pagination and sorting parameters.
   * @param {string} [userRole] - Role of the requesting user.
   * @returns {Promise<PaginatedResponseDto<IncidenciaResuelta>>} Paginated result of resolution records.
   */
  async findAll(
    query: PaginationQueryDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<IncidenciaResuelta>> {
    return this.incidenciaResuelaRepository.findAllPaginated(query, userRole);
  }

  /**
   * Finds a single resolution record by its UUID, loading `incidencia` and `usuarioResolutor` relations.
   * Admin and super-admin users can retrieve soft-deleted records.
   * @param {string} id - UUID of the resolution record to retrieve.
   * @param {string} [userRole] - Role of the requesting user.
   * @returns {Promise<IncidenciaResuelta>} The found resolution record with relations.
   * @throws {NotFoundException} If no resolution record with the given ID exists.
   */
  async findOne(id: string, userRole?: string): Promise<IncidenciaResuelta> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';

    const resolucion = await this.incidenciaResuelaRepository.findOne({
      where: { id },
      withDeleted: isAdmin,
      relations: ['incidencia', 'usuarioResolutor'],
    });

    if (!resolucion) {
      throw new NotFoundException(
        I18nHelper.getError('INCIDENCIA_RESUELTA_NOT_FOUND')
      );
    }

    return resolucion;
  }

  /**
   * Updates mutable fields of an existing resolution record (type, observations, resolver).
   * @param {string} id - UUID of the resolution record to update.
   * @param {UpdateIncidenciaResuelaDto} dto - Partial payload with the fields to change.
   * @returns {Promise<IncidenciaResuelta>} The updated resolution record.
   * @throws {NotFoundException} If no resolution record with the given ID exists.
   */
  async update(
    id: string,
    dto: UpdateIncidenciaResuelaDto
  ): Promise<IncidenciaResuelta> {
    const resolucion = await this.findOne(id);

    this.incidenciaResuelaRepository.merge(resolucion, {
      tipoResolucion: dto.tipoResolucion,
      observaciones: dto.observaciones,
      usuarioResolutor: dto.idUsuarioResolutor
        ? ({ id: dto.idUsuarioResolutor } as any)
        : resolucion.usuarioResolutor,
    });

    return this.incidenciaResuelaRepository.save(resolucion);
  }

  /**
   * Soft-deletes a resolution record and reopens the parent incidencia by clearing
   * its `fechaResolucion`, `usuarioResolutor` and `observacionesResolucion` fields.
   * @param {string} id - UUID of the resolution record to remove.
   * @returns {Promise<void>}
   * @throws {NotFoundException} If no resolution record with the given ID exists.
   */
  async remove(id: string): Promise<void> {
    const resolucion = await this.findOne(id);

    const incidencia = resolucion.incidencia;
    incidencia.fechaResolucion = null;
    incidencia.usuarioResolutor = undefined;
    incidencia.observacionesResolucion = undefined;
    await this.incidenciaRepository.save(incidencia);

    await this.incidenciaResuelaRepository.softDelete(id);
  }
}
