import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';

@Entity({ name: 'proveedor' })
export class Proveedor {
  @PrimaryColumn('uuid', {
    name: 'id_proveedor',
    default: () => 'uuid_generate_v7()',
  })
  readonly id!: string;

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contacto?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefono?: string;

  @OneToMany(() => ProductoProveedor, (pp) => pp.proveedor)
  productos!: ProductoProveedor[];
}
