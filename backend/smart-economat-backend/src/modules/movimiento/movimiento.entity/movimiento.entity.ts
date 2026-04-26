import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { TipoMovimiento } from '../enums/movimiento.enums';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Inventario } from '../../inventario/inventario.entity/inventario.entity';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';

/**
 * Documentación en español.
 */
@Entity({ name: 'movimiento' })
@Index(['tipo'])
@Index(['usuarioId'])
@Index(['entidad', 'tipo'])
@Index(['entidadId'])
@Index(['entidadId', 'entidad'])
@Index(['inventarioId'])
@Index(['productoProveedorId'])
@Index(['createdAt'])
@Check(`"cantidad" >= 0`)
export class Movimiento extends BaseEntity {
        /**
     * Documentación en español.
     */
  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

        /**
     * Documentación en español.
     */
  @Column({ name: 'inventario_id', nullable: true })
  inventarioId?: string;

        /**
     * Documentación en español.
     */
  @Column({ name: 'producto_proveedor_id', nullable: true })
  productoProveedorId?: string;

        /**
     * Documentación en español.
     */
  @Column({ type: 'enum', enum: TipoMovimiento })
  tipo!: TipoMovimiento;

        /**
     * Documentación en español.
     */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: new ColumnNumericTransformer(),
  })
  cantidad!: number;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => Usuario, (usuario) => usuario.movimientos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario>;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => Inventario, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'inventario_id' })
  inventario?: Relation<Inventario>;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => ProductoProveedor, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'producto_proveedor_id' })
  productoProveedor?: Relation<ProductoProveedor>;

        /**
     * Documentación en español.
     */
  @Column({ type: 'varchar', length: 50, name: 'entidad_tipo' })
  entidad!: string;

        /**
     * Documentación en español.
     */
  @Column({ type: 'uuid', name: 'entidad_id' })
  entidadId!: string;

        /**
     * Documentación en español.
     */
  @Column({ type: 'text', nullable: true })
  descripcion?: string;
}

export { TipoMovimiento };
