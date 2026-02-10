import { ProductoProveedor } from 'src/modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
@Entity({ name: 'proveedor' })
export class Proveedor {
  @PrimaryGeneratedColumn({ name: 'id_proveedor' })
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contacto?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefono?: string;

  @OneToMany(() => ProductoProveedor, (pp) => pp.proveedor)
  productos!: ProductoProveedor[];
}
