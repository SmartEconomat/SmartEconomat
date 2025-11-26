import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductoProveedor } from '../../productos/producto-proveedor.entity/producto-proveedor.entity';
import { localInventario } from '../enums/inventario.enums';

@Entity({ name: 'inventario' })
export class Inventario {
  @PrimaryGeneratedColumn('uuid', { name: 'id_inventario' })
  id!: string;

  @ManyToOne(() => ProductoProveedor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_producto_proveedor' })
  productoProveedor!: ProductoProveedor;

  @Column({ type: 'integer', default: '0' })
  cantidad_actual!: number;

  @Column({ type: 'integer', default: '0' })
  cantidad_minima!: number;

  @Column({ type: 'integer' })
  cantidad_maxima?: number;

  @Column({ type: 'enum', enum: localInventario, name: 'ubicacion_almacen' })
  ubicacion_almacen!: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  fecha_entrada!: Date;

  @Column({ type: 'timestamptz' })
  fecha_caducidad!: Date;
}
