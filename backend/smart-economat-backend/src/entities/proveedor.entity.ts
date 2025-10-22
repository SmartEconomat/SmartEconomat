import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ProductoProveedor } from './producto-proveedor.entity';

@Entity({ name: 'proveedor' })
export class Proveedor {
  @PrimaryGeneratedColumn({ name: 'id_proveedor' })
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contacto?: string;

  @OneToMany(() => ProductoProveedor, (pp) => pp.proveedor, { cascade: true })
  productos: ProductoProveedor[];
}
