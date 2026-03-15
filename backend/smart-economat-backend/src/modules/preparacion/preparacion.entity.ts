import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Producto } from '../producto/producto.entity/producto.entity';

@Entity('preparaciones')
export class PreparacionEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ unique: true })
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column('int')
  tiempoEstimadoMinutos: number;

  @Column('decimal', { precision: 10, scale: 2 })
  costeEstimado: number;

  @ManyToMany(() => Producto, { eager: true })
  @JoinTable({ name: 'preparacion_ingredientes' })
  ingredientes: Producto[];
}
