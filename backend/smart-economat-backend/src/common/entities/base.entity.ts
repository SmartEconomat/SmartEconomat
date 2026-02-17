import {
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
  Column,
} from 'typeorm';

/**
 * BaseEntity
 *
 * Clase base abstracta para todas las entidades del sistema.
 * Proporciona campos estándar de auditoría, versionado optimista y soft delete.
 *
 * Características:
 * - UUID v7 como PK (ordenados temporalmente)
 * - Timestamps completos (creación, actualización, borrado)
 * - Soft delete con registro de usuario que eliminó
 * - Versionado optimista para prevenir race conditions
 */
export abstract class BaseEntity {
  /**
   * Identificador único UUID v7
   * - Ordenados cronológicamente
   * - Generados en base de datos
   */
  @PrimaryColumn('uuid', {
    default: () => 'uuid_generate_v7()',
  })
  readonly id!: string;

  /**
   * Fecha y hora de creación del registro
   * - Timestamptz para soporte de zonas horarias
   * - Automáticamente setada por TypeORM
   */
  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  readonly createdAt!: Date;

  /**
   * Fecha y hora de última actualización
   * - Actualizada automáticamente en cada save()
   */
  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
  })
  readonly updatedAt!: Date;

  /**
   * Fecha y hora de borrado lógico (soft delete)
   * - Null = registro activo
   * - Not null = registro eliminado
   * - TypeORM automáticamente filtra registros eliminados
   */
  @DeleteDateColumn({
    type: 'timestamptz',
    name: 'deleted_at',
    nullable: true,
  })
  deletedAt?: Date | null;

  /**
   * Usuario que realizó el borrado lógico
   * - Referencia al ID del usuario (lazy loading)
   * - ON DELETE SET NULL para preservar histórico
   * - Solo se rellena cuando deletedAt !== null
   *
   * NOTA: La relación completa a Usuario se define dinámicamente
   * para evitar dependencias circulares. En services, usar:
   *
   * @example
   * entity.deletedBy = usuarioId;
   * await repo.save(entity);
   */
  @Column({
    type: 'uuid',
    nullable: true,
    name: 'deleted_by',
  })
  deletedBy?: string | null;

  /**
   * Columna de versionado optimista
   * - Incrementada automáticamente en cada update
   * - TypeORM lanza OptimisticLockVersionMismatchError si hay conflicto
   * - Previene lost updates en operaciones concurrentes
   *
   * @example
   * try {
   *   await repo.save(entity);
   * } catch (error) {
   *   if (error.name === 'OptimisticLockVersionMismatchError') {
   *
   *   }
   * }
   */
  @VersionColumn({
    default: 1,
  })
  version!: number;
}
