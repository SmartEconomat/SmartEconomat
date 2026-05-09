import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';

/** Clase pública (PedidoDraft). Paquete: smart-economat-backend (Nest). */
@Entity({ name: 'pedido_draft' })
@Index(['usuarioId', 'updatedAt'])
@Index(['expiresAt'])
export class PedidoDraft extends BaseEntity {
  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId!: string;

  @ManyToOne(() => Usuario, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Relation<Usuario>;

  @Column({ name: 'draft_version', type: 'integer', default: 1 })
  draftVersion!: number;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({
    name: 'expires_at',
    type: 'timestamptz',
    nullable: true,
  })
  expiresAt!: Date | null;
}
