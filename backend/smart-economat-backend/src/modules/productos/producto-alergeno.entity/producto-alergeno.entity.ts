import { Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { AlergenoProducto } from '../enums/product.enums';
import { Producto } from '../producto.entity/producto.entity';

@Entity({ name: 'producto_alergeno' })
export class ProductoAlergeno {
  @PrimaryColumn('uuid', { name: 'id_producto' })
  id: string;

  @PrimaryColumn({ type: 'enum', enum: AlergenoProducto })
  alergeno: AlergenoProducto;

  @ManyToOne(() => Producto, (p) => p.alergenos, { onDelete: 'CASCADE' })
  producto: Producto;
}
