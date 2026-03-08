import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';

@Entity('archivos')
export class Archivo extends BaseEntity {
  @Column()
  nombre: string;

  @Column()
  url: string;

  @Column()
  tamano: number;

  @Column()
  mimeType: string;

  @ManyToOne(() => Usuario, { nullable: true })
  usuario: Usuario;
}
