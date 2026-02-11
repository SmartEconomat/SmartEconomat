import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { localInventario } from '../enums/inventario.enums';

@Entity({ name: 'inventario' })
export class Inventario {
  @PrimaryGeneratedColumn('uuid', { name: 'id_inventario' })
  id!: string;

  @ManyToOne(() => ProductoProveedor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_producto_proveedor' })
  productoProveedor!: ProductoProveedor;

  @Column({ type: 'integer', default: 0, name: 'cantidad_actual' })
  cantidadActual!: number;

  @Column({ type: 'integer', default: 0, name: 'cantidad_minima' })
  cantidadMinima!: number;

  @Column({ type: 'integer', name: 'cantidad_maxima' })
  cantidadMaxima?: number;

  @Column({ type: 'enum', enum: localInventario, name: 'ubicacion_almacen' })
  ubicacionAlmacen!: string;

  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'fecha_entrada',
  })
  fechaEntrada!: Date;

  @Column({ type: 'timestamptz', name: 'fecha_caducidad' })
  fechaCaducidad!: Date;
}
