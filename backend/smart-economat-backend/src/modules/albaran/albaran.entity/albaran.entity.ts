import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { AlbaranPedidoRecepcion } from '../albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity';

@Entity('albaran')
export class Albaran {
  @PrimaryColumn('uuid', {
    name: 'id_albaran',
    default: () => 'uuid_generate_v7()',
  })
  readonly id!: string;

  @Column({ name: 'n_albaran', type: 'varchar', length: 50 })
  nAlbaran: string;

  @Column({ type: 'boolean', nullable: true })
  concordancia: boolean;

  @Column({ type: 'date', nullable: true })
  fecha: Date;

  @OneToMany(() => AlbaranPedidoRecepcion, (apr) => apr.albaran)
  albaranPedidoRecepcion: AlbaranPedidoRecepcion[];

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
  })
  deletedAt?: Date;
}
