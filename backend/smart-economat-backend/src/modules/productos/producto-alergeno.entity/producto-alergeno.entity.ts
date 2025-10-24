import { Entity, ManyToOne, PrimaryColumn, JoinColumn } from 'typeorm';
import { Producto } from '../producto.entity/producto.entity';
import { AlergenoProducto } from '../enums/producto.enums';

@Entity({ name: 'producto_alergeno' })
export class ProductoAlergeno {
  @PrimaryColumn('uuid', { name: 'id_producto' })
  id!: string;

  @PrimaryColumn({
    type: 'enum',
    enum: AlergenoProducto,
    enumName: 'alergeno_producto',
  })
  alergeno!: AlergenoProducto;

  @ManyToOne(() => Producto, (producto) => producto.alergenos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_producto' })
  producto!: Producto;
}
