import {
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
  Column,
} from 'typeorm';

/**
 * Clase base abstracta para todas las entidades del sistema.
 * Proporciona campos comunes de auditoría, control de versiones y soft delete.
 */
export abstract class BaseEntity {
  /**
   * Identificador único universal (UUID v7).
   * Se genera automáticamente en la base de datos.
   */
  @PrimaryColumn('uuid', {
    default: () => 'uuid_generate_v7()',
  })
  readonly id!: string;

  /**
   * Fecha y hora de creación del registro.
   * Gestionado automáticamente por TypeORM.
   */
  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  readonly createdAt!: Date;

  /**
   * Fecha y hora de la última actualización del registro.
   * Actualizado automáticamente por TypeORM.
   */
  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
  })
  readonly updatedAt!: Date;

  /**
   * Fecha y hora de eliminación lógica (soft delete).
   * Si tiene valor, el registro se considera eliminado del sistema.
   */
  @DeleteDateColumn({
    type: 'timestamptz',
    name: 'deleted_at',
    nullable: true,
  })
  deletedAt?: Date | null;

  /**
   * ID del usuario que realizó la eliminación lógica.
   */
  @Column({
    type: 'uuid',
    nullable: true,
    name: 'deleted_by',
  })
  deletedBy?: string | null;

  /**
   * ID del último usuario que modificó el registro.
   */
  @Column({
    type: 'uuid',
    nullable: true,
    name: 'modified_by',
  })
  modifiedBy?: string | null;

  /**
   * Número de versión del registro para control de concurrencia optimista.
   */
  @VersionColumn({
    default: 1,
  })
  version!: number;
}
