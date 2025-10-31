import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ProductoProveedor } from '../../productos/producto-proveedor.entity/producto-proveedor.entity';

@Entity({ name: 'historial_precio' })
export class HistorialPrecio {
  @PrimaryGeneratedColumn('uuid', { name: 'id_historial_precio' })
  id!: string;

  @OneToMany(() => ProductoProveedor, { nullable: false, onDelete: 'CASCADE' })
  id_producto_proveedor!: ProductoProveedor;

  @Column({ type: 'decimal', nullable: false, precision: 10, scale: 2 })
  precio!: number;

  @Column({ type: 'timestampz', default: () => 'CURRENT_TIMESTAMP' })
  fecha!: Date;
}
