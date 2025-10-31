import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ProductoProveedor } from '../../productos/producto-proveedor.entity/producto-proveedor.entity';

@Entity({ name: 'proveedor' })
export class Proveedor {
  @PrimaryGeneratedColumn('uuid', { name: 'id_proveedor' })
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contacto?: string;

  @OneToMany(() => ProductoProveedor, (pp) => pp.proveedor)
  productos: ProductoProveedor[];
}
