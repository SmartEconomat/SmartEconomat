import { Entity, Column, OneToMany, Index } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { Pedido } from '../../pedido/pedido.entity/pedido.entity';

/**
 * Proveedor Entity
 */
@Entity({ name: 'proveedor' })
@Index(['nombre'])
@Index(['nif'])
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
  productos!: Relation<ProductoProveedor[]>;

  @OneToMany(() => Pedido, (pedido) => pedido.proveedor)
  pedidos!: Relation<Pedido[]>;
}
