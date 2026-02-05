import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from 'src/modules/usuario/usuario.entity/usuario.entity';
import { Recepcion } from 'src/modules/recepcion/recepcion.entity/recepcion.entity';

@Entity('incidencia')
export class Incidencia {
  @PrimaryGeneratedColumn({ name: 'id_incidencia' })
  id!: number;

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

  @CreateDateColumn({ name: 'fecha_resolucion', type: 'timestamp' })
  fechaResolucion!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
