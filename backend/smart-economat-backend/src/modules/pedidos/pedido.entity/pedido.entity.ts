import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { EstadoPedido } from '../enums/estado-pedido.enum';
import { ProductoProveedor } from 'src/modules/productos/producto-proveedor.entity/producto-proveedor.entity';
import { Usuario } from 'src/modules/usuario/usuario.entity/usuario.entity';

@Entity('pedido')
export class Pedido {
  @PrimaryGeneratedColumn('uuid', { name: 'id_pedido' })
  id!: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.pedidos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_usuario', referencedColumnName: 'id' })
  usuario!: Usuario;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  fecha_pedido!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  fecha_entrega?: Date;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  coste_total?: number;

  @Column({ type: 'enum', enum: EstadoPedido, default: EstadoPedido.PENDIENTE })
  estado!: EstadoPedido;

  @ManyToMany(() => ProductoProveedor, { cascade: true })
  @JoinTable({
    name: 'pedido_producto_proveedor',
    joinColumn: {
      name: 'id_pedido',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'id_producto_proveedor',
      referencedColumnName: 'id',
    },
  })
  productos!: ProductoProveedor[];
}
