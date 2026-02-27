import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Check,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import type { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import type { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity';
import { localInventario } from '../enums/inventario.enums';

@Entity({ name: 'inventario' })
@Index('idx_inventario_producto_proveedor', ['productoProveedor'])
@Index('idx_inventario_ubicacion', ['ubicacionAlmacen'])
@Index('idx_inventario_fecha_caducidad', ['fechaCaducidad'])
@Index('idx_inventario_ubicacion_caducidad', [
  'ubicacionAlmacen',
  'fechaCaducidad',
])
@Check(`"cantidad_actual" >= 0`)
@Check(`"cantidad_minima" >= 0`)
@Check(`"cantidad_maxima" IS NULL OR "cantidad_maxima" >= "cantidad_minima"`)
export class Inventario extends BaseEntity {
  @ManyToOne('ProductoProveedor', (pp: ProductoProveedor) => pp.inventarios, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'id_producto_proveedor' })
  productoProveedor!: Relation<ProductoProveedor>;

  @Column({
    type: 'int',
    name: 'cantidad_actual',
  })
  cantidadActual!: number;

  @Column({
    type: 'int',
    name: 'cantidad_minima',
  })
  cantidadMinima!: number;

  @Column({
    type: 'int',
    nullable: true,
    name: 'cantidad_maxima',
  })
  cantidadMaxima?: number | null;

  @Column({
    type: 'enum',
    enum: localInventario,
    name: 'ubicacion_almacen',
  })
  ubicacionAlmacen!: localInventario;

  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'fecha_entrada',
  })
  fechaEntrada!: Date;

  @Column({
    type: 'timestamptz',
    nullable: false,
    name: 'fecha_caducidad',
  })
  fechaCaducidad!: Date;

  @OneToMany('Movimiento', (mov: Movimiento) => mov.inventario)
  movimientos!: Relation<Movimiento[]>;

  ajustarCantidad(delta: number): void {
    this.cantidadActual = Number(this.cantidadActual) + delta;
    if (this.cantidadActual < 0) {
      throw new Error(
        `Stock insuficiente. Actual: ${this.cantidadActual}, Delta: ${delta}`
      );
    }
  }

  esBajoStock(): boolean {
    return Number(this.cantidadActual) < Number(this.cantidadMinima);
  }

  proximoACaducar(diasUmbral: number = 7): boolean {
    const umbralFecha = new Date();
    umbralFecha.setDate(umbralFecha.getDate() + diasUmbral);
    return this.fechaCaducidad <= umbralFecha;
  }
}
