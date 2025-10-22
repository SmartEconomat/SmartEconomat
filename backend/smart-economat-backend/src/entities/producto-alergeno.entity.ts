import { Entity, Column, ManyToOne, PrimaryColumn } from 'typeorm';
import { Producto } from './producto.entity';
import { AlergenoProducto } from './product.enums';

@Entity({ name: 'producto_alergeno' })
export class ProductoAlergeno {
  @PrimaryColumn({ name: 'id_producto', type: 'int' })
  id_producto: number;

  @PrimaryColumn({ type: 'enum', enum: AlergenoProducto })
  alergeno: AlergenoProducto;

  @ManyToOne(() => Producto, (p) => p.alergenos, { onDelete: 'CASCADE' })
  producto: Producto;
}
