import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Recepcion } from '../../recepcion/recepcion.entity/recepcion.entity';

@Entity('incidencia')
export class Incidencia {
  @PrimaryColumn('uuid', {
    name: 'id_incidencia',
    default: () => 'uuid_generate_v7()',
  })
  readonly id!: string;

  @ManyToOne(() => Recepcion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_recepcion' })
  recepcion!: Recepcion;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'id_usuario_resolutor' })
  usuarioResolutor?: Usuario;

  @Column({ type: 'jsonb' })
  datosOriginales!: {
    productos: {
      idPedidoProducto: string;
      cantidadPedida: number;
      cantidadRecibida: number;
      diferencia: number;
      observaciones?: string;
    }[];
    observacionesRecepcion?: string;
  };

  @Column({ type: 'text', nullable: true })
  observacionesResolucion?: string;

  @CreateDateColumn({ name: 'fecha_resolucion', type: 'timestamptz' })
  readonly fechaResolucion!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  readonly updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt?: Date;
}
