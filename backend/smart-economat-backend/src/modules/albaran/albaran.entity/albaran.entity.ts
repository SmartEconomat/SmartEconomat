import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AlbaranPedidoRecepcion } from '../albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity';

/**
 * Albaran Entity
 */
@Entity({ name: 'albaran' })
@Index('idx_albaran_n_albaran', ['nAlbaran'])
@Index('idx_albaran_fecha', ['fecha'])
export class Albaran extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true, name: 'n_albaran' })
  nAlbaran!: string;

  @Column({ type: 'boolean', nullable: true })
  concordancia?: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  fecha?: Date;

  @OneToMany(() => AlbaranPedidoRecepcion, (apr) => apr.albaran)
  albaranPedidoRecepcion!: AlbaranPedidoRecepcion[];
}
