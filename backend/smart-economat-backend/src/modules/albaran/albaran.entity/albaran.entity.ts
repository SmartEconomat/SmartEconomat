import { Entity, Column, OneToMany, Index } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AlbaranPedidoRecepcion } from '../albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity';

@Entity({ name: 'albaran' })
@Index('idx_albaran_n_albaran', ['nAlbaran'])
@Index('idx_albaran_fecha', ['fecha'])
export class Albaran extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true, name: 'n_albaran' })
  nAlbaran!: string;

  @Column({ type: 'boolean', default: false, name: 'es_automatico' })
  esAutomatico!: boolean;

  @Column({ type: 'boolean', nullable: true })
  concordancia?: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  fecha?: Date;

  /**
   * URL/ruta relativa del documento escaneado del albarán (foto o PDF).
   * El archivo físico se almacena en disco; aquí solo se guarda la referencia.
   */
  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'documento_url',
  })
  documentoUrl?: string;

  /**
   * Nombre original del archivo subido (ej: "albaran_firmado.pdf").
   */
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'documento_nombre',
  })
  documentoNombre?: string;

  /**
   * Tipo MIME del documento (image/jpeg, image/png, application/pdf, etc.).
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'documento_mime_type',
  })
  documentoMimeType?: string;

  /**
   * Tamaño del archivo en bytes.
   */
  @Column({ type: 'int', nullable: true, name: 'documento_tamano' })
  documentoTamano?: number;

  @OneToMany(() => AlbaranPedidoRecepcion, (apr) => apr.albaran)
  albaranPedidoRecepcion!: Relation<AlbaranPedidoRecepcion[]>;
}
