import {
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
  Column,
} from 'typeorm';

/**
 * Documentación en español.
 */
export abstract class BaseEntity {
        /**
     * Documentación en español.
     */
  @PrimaryColumn('uuid', {
    default: () => 'uuid_generate_v7()',
  })
  readonly id!: string;

        /**
     * Documentación en español.
     */
  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  readonly createdAt!: Date;

        /**
     * Documentación en español.
     */
  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
  })
  readonly updatedAt!: Date;

        /**
     * Documentación en español.
     */
  @DeleteDateColumn({
    type: 'timestamptz',
    name: 'deleted_at',
    nullable: true,
  })
  deletedAt?: Date | null;

        /**
     * Documentación en español.
     */
  @Column({
    type: 'uuid',
    nullable: true,
    name: 'deleted_by',
  })
  deletedBy?: string | null;

        /**
     * Documentación en español.
     */
  @Column({
    type: 'uuid',
    nullable: true,
    name: 'modified_by',
  })
  modifiedBy?: string | null;

        /**
     * Documentación en español.
     */
  @VersionColumn({
    default: 1,
  })
  version!: number;
}
