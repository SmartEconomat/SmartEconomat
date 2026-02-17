import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Proveedor Entity
 */
@Entity({ name: 'proveedor' })
@Index('idx_proveedor_nombre', ['nombre'])
@Index('idx_proveedor_nif', ['nif'])
export class Proveedor extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contacto?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefono?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  direccion?: string;

  @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
  nif?: string;

  @OneToMany(() => ProductoProveedor, (pp) => pp.proveedor)
  productos!: ProductoProveedor[];
}
