import { MigrationInterface, QueryRunner } from 'typeorm';

export class BaselineSchema1775000000000 implements MigrationInterface {
  name = 'BaselineSchema1775000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await this.shouldSkipBaseline(queryRunner)) {
      return;
    }

    await queryRunner.query(
      `CREATE TYPE "public"."producto_alergeno_alergeno_enum" AS ENUM('GLUTEN', 'CRUSTACEOS', 'HUEVOS', 'PESCADO', 'CACAHUETES', 'SOJA', 'LACTEOS', 'FRUTOS_CON_CASCARA', 'APIO', 'MOSTAZA', 'SESAMO', 'SULFITO', 'ALTRAMUCES', 'MOLUSCOS')`
    );
    await queryRunner.query(
      `CREATE TABLE "producto_alergeno" ("producto_id" uuid NOT NULL, "alergeno" "public"."producto_alergeno_alergeno_enum" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_5d4af3af3e2381f3e69ea0be56d" PRIMARY KEY ("producto_id", "alergeno"))`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."merma_motivo_enum" AS ENUM('rotura', 'deterioro', 'hurto', 'error_preparacion', 'otros')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."merma_tipo_enum" AS ENUM('recepcion', 'produccion', 'caducidad', 'rotura', 'inventario')`
    );
    await queryRunner.query(
      `CREATE TABLE "merma" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "producto_id" uuid NOT NULL, "usuario_id" uuid, "cantidad" numeric(12,3) NOT NULL, "motivo" "public"."merma_motivo_enum" NOT NULL, "tipo" "public"."merma_tipo_enum" NOT NULL DEFAULT 'inventario', "notas" text, "origen_entidad" character varying(50), "origen_id" uuid, "referencia_id" uuid, "idempotency_key" uuid, CONSTRAINT "CHK_58f1ee030ad106613de48cf476" CHECK ("cantidad" > 0), CONSTRAINT "PK_49155afd7ee8855f3ec39ebeedf" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ce20a05544fcee5736267801ee" ON "merma" ("idempotency_key") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_17667704858947b4c4c6d3f429" ON "merma" ("origen_entidad", "origen_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_60ae0107c6481403f87fe8ace2" ON "merma" ("tipo", "created_at") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a7ae848f42dea18368fe40211f" ON "merma" ("created_at") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e6afa3b841aa0bf071af5a0782" ON "merma" ("usuario_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a31ee0c37aeb524da1f43a5b72" ON "merma" ("tipo") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b41b9238cd076cddeee696f105" ON "merma" ("motivo") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7f0c639a18360c2d62aa873675" ON "merma" ("producto_id") `
    );
    await queryRunner.query(
      `CREATE TYPE "public"."producto_unidad_enum" AS ENUM('KG', 'G', 'L', 'ML', 'UNIDAD', 'PAQ')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."producto_tipo_enum" AS ENUM('verdura', 'fruta', 'carne', 'pescado', 'marisco', 'lacteo', 'huevo', 'cereal', 'legumbre', 'fruto_seco', 'condimento', 'aceite', 'azucar', 'bebida', 'elaborado', 'otro')`
    );
    await queryRunner.query(
      `CREATE TABLE "producto" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "nombre" character varying(100) NOT NULL, "marca" character varying(100), "descripcion" text, "unidad" "public"."producto_unidad_enum", "fecha_caducidad" TIMESTAMP WITH TIME ZONE, "path_img" character varying(200), "tipo" "public"."producto_tipo_enum", "codigo_barras" character varying(130), "contenido" numeric(10,2) NOT NULL DEFAULT '0', "pmp" numeric(10,4) NOT NULL DEFAULT '0', CONSTRAINT "UQ_bd23c8bcd2ec20dbeff299d2413" UNIQUE ("codigo_barras"), CONSTRAINT "CHK_860dee46ca2ec02b72fa0083d8" CHECK ("fecha_caducidad" IS NULL OR "fecha_caducidad" > "created_at"), CONSTRAINT "PK_5be023b11909fe103e24c740c7d" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bd23c8bcd2ec20dbeff299d241" ON "producto" ("codigo_barras") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d86d179360134b4b74bda75066" ON "producto" ("nombre") `
    );
    await queryRunner.query(
      `CREATE TABLE "proveedor" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "nombre" character varying(100) NOT NULL, "contacto" character varying(100), "telefono" character varying(50), "email" character varying(255), "direccion" text, "nif" character varying(20), CONSTRAINT "UQ_0ead73e80c85c4eaf267b191df5" UNIQUE ("nif"), CONSTRAINT "PK_405f60886417ece76cb5681550a" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0ead73e80c85c4eaf267b191df" ON "proveedor" ("nif") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0b402d9d1ecd20001e5fd310fd" ON "proveedor" ("nombre") `
    );
    await queryRunner.query(
      `CREATE TABLE "ubicacion" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "nombre" character varying(150) NOT NULL, "descripcion" character varying(255), CONSTRAINT "UQ_c3c8aa9011bead017f523658861" UNIQUE ("nombre"), CONSTRAINT "PK_6ed79468fe4f565d8be642742a3" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "inventario" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "producto_proveedor_id" uuid NOT NULL, "ubicacion_id" uuid NOT NULL, "cantidad_actual" numeric(12,3) NOT NULL, "cantidad_minima" numeric(12,3) NOT NULL, "cantidad_maxima" numeric(12,3), "fecha_entrada" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_caducidad" TIMESTAMP WITH TIME ZONE, CONSTRAINT "CHK_8886c6d3709f1d5e9fde3d6180" CHECK ("cantidad_maxima" IS NULL OR "cantidad_maxima" >= "cantidad_minima"), CONSTRAINT "CHK_4a56d969f4f706e9f2e4b60882" CHECK ("cantidad_minima" >= 0), CONSTRAINT "CHK_b17b9e6de4bb1d338522e87ffd" CHECK ("cantidad_actual" >= 0), CONSTRAINT "PK_90f2b8f62985685e15fea12e237" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9e0f1ec638a8cb2c681ee2297a" ON "inventario" ("ubicacion_id", "fecha_caducidad") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b058eaa68bbaf8e9fa98d27d16" ON "inventario" ("fecha_caducidad") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6d9c5c09e5fc8a7d675e5be8aa" ON "inventario" ("ubicacion_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_51b8f559ad2d145c83f882bad8" ON "inventario" ("producto_proveedor_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "historial_precio" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "producto_proveedor_id" uuid NOT NULL, "precio" numeric(10,2) NOT NULL, "cantidad" numeric(12,3), "documento_origen" character varying(50), "recepcion_id" uuid, "fecha" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_dde40d1bccbe7071897adf72a9" CHECK ("precio" > 0), CONSTRAINT "PK_864ed3500cfbfdabff8f50c3aa6" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d809420cff80a38ef063cf158f" ON "historial_precio" ("fecha") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_167351b501de3a9bbda86e3261" ON "historial_precio" ("producto_proveedor_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "producto_proveedor" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "producto_id" uuid NOT NULL, "proveedor_id" uuid NOT NULL, "marca" character varying(100), "codigo_barras" character varying(130), "precio_unitario" numeric(10,2), "merma_esperada" numeric(5,2) DEFAULT '0', "pmp" numeric(10,4) NOT NULL DEFAULT '0', CONSTRAINT "UQ_3a28eddb5ae19f969fcd368bc1b" UNIQUE ("producto_id", "proveedor_id"), CONSTRAINT "CHK_a9f5acfdf0745644a3181ae17f" CHECK ("precio_unitario" IS NULL OR "precio_unitario" > 0), CONSTRAINT "PK_9d7eb17b15ec2971a26f48a8329" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9e66fbc60135bb0a2b5d45cbb4" ON "producto_proveedor" ("proveedor_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7587673df9ed2964d7fa4a2412" ON "producto_proveedor" ("producto_id") `
    );
    await queryRunner.query(
      `CREATE TYPE "public"."estado_pedido_usuario" AS ENUM('borrador', 'pendiente', 'aprobado', 'cancelado', 'consolidado')`
    );
    await queryRunner.query(
      `CREATE TABLE "pedido_usuario" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "usuario_id" uuid, "numero_global" BIGSERIAL NOT NULL, "fecha_pedido" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_entrega" TIMESTAMP WITH TIME ZONE, "observaciones" text, "coste_total" numeric(14,4) NOT NULL DEFAULT '0', "estado" "public"."estado_pedido_usuario" NOT NULL DEFAULT 'pendiente', CONSTRAINT "UQ_66d0393a45c13673fbcc56c5161" UNIQUE ("numero_global"), CONSTRAINT "CHK_3fa7a9cc7517e31b267f971daa" CHECK ("coste_total" >= 0), CONSTRAINT "PK_a76ebc7864e48113c6b27cf47a9" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_34dc773462666496d3bedd539f" ON "pedido_usuario" ("fecha_pedido") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4bd4760f556f0b9617306ed845" ON "pedido_usuario" ("estado") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_66d0393a45c13673fbcc56c516" ON "pedido_usuario" ("numero_global") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_57e60878eac7fdeddf1ba34512" ON "pedido_usuario" ("usuario_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "pedido_usuario_linea" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "pedido_usuario_id" uuid NOT NULL, "producto_proveedor_id" uuid NOT NULL, "cantidad" numeric(12,3) NOT NULL, "precio_unitario" numeric(12,4) NOT NULL, "observaciones" text, CONSTRAINT "CHK_b1052a46141a49b1f7f6f8e63b" CHECK ("precio_unitario" >= 0), CONSTRAINT "CHK_6484c42cd9fb99a8932aa31805" CHECK ("cantidad" > 0), CONSTRAINT "PK_de516156e83045030448df6b308" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_152434b3e2e20e850567fed3a5" ON "pedido_usuario_linea" ("producto_proveedor_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ccc9ff398bd7a1d8033bb7de00" ON "pedido_usuario_linea" ("pedido_usuario_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "pedido_producto" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "pedido_id" uuid NOT NULL, "producto_proveedor_id" uuid NOT NULL, "pedido_usuario_linea_id" uuid, "cantidad" numeric(12,3) NOT NULL, "precio_unitario" numeric(12,4) NOT NULL, "observaciones" text, CONSTRAINT "CHK_f10b1f24e3a884828e61f9aa5c" CHECK ("precio_unitario" >= 0), CONSTRAINT "CHK_4bf11f5360db352b24dfda2f32" CHECK ("cantidad" > 0), CONSTRAINT "PK_97f69aaf286bdd82afbd487e4d5" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a4d3381551b984299309fe45fd" ON "pedido_producto" ("pedido_usuario_linea_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_421bfaaa0af9cb66b544e3153a" ON "pedido_producto" ("producto_proveedor_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3d683a14b23ae2025106e90242" ON "pedido_producto" ("pedido_id") `
    );
    await queryRunner.query(
      `CREATE TYPE "public"."purchase_batch_estado_enum" AS ENUM('pendiente', 'parcial', 'completado', 'incidencia', 'cancelado')`
    );
    await queryRunner.query(
      `CREATE TABLE "purchase_batch" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "usuario_id" uuid, "observaciones" text, "estado" "public"."purchase_batch_estado_enum" NOT NULL DEFAULT 'pendiente', CONSTRAINT "PK_83360a3b6931b979ae57142b40f" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f64cb01481764f206dfdc5cf6f" ON "purchase_batch" ("usuario_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bd18dc8b8e9514061f1e1d2a5d" ON "purchase_batch" ("created_at") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3ceb56c7dee6bff4e6537830bd" ON "purchase_batch" ("estado") `
    );
    await queryRunner.query(
      `CREATE TYPE "public"."estado_pedido" AS ENUM('pendiente_de_aprobacion', 'por_recepcionar', 'recepcionado', 'incidencia', 'parcial', 'cancelado')`
    );
    await queryRunner.query(
      `CREATE TABLE "pedido" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "numero_global" bigint NOT NULL, "usuario_id" uuid, "proveedor_id" uuid, "batch_id" uuid, "pedido_usuario_id" uuid, "fecha_pedido" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_entrega" TIMESTAMP WITH TIME ZONE, "observaciones" text, "coste_total" numeric(14,4) NOT NULL DEFAULT '0', "estado" "public"."estado_pedido" NOT NULL DEFAULT 'pendiente_de_aprobacion', "motivo_cancelacion" text, "motivo_incidencia" text, CONSTRAINT "UQ_e93275d2baa8aa95b46e7296591" UNIQUE ("numero_global"), CONSTRAINT "CHK_a743736cf6726011e0d9033d57" CHECK ("coste_total" >= 0), CONSTRAINT "PK_af8d8b3d07fae559c37f56b3f43" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fc44cd8f26d8772b414c97e2f2" ON "pedido" ("estado", "created_at") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cb62b189425f2ca829b2b6aed0" ON "pedido" ("pedido_usuario_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_086666189136207ffa3568ae79" ON "pedido" ("batch_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b99552b8d2f8a4f7cb137838ae" ON "pedido" ("proveedor_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a76ebc7864e48113c6b27cf47a" ON "pedido" ("usuario_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8c70086d2133fed1dcadc0e903" ON "pedido" ("fecha_pedido") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_076f2a4e67d5232136ed070884" ON "pedido" ("estado") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e93275d2baa8aa95b46e729659" ON "pedido" ("numero_global") `
    );
    await queryRunner.query(
      `CREATE TABLE "albaran" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "n_albaran" character varying(50) NOT NULL, "es_automatico" boolean NOT NULL DEFAULT false, "concordancia" boolean, "fecha" TIMESTAMP WITH TIME ZONE, "documento_url" character varying(500), "documento_nombre" character varying(255), "documento_mime_type" character varying(100), "documento_tamano" integer, CONSTRAINT "UQ_1d3ee44f262cbf60d6d0fb500d8" UNIQUE ("n_albaran"), CONSTRAINT "PK_ba2c732ef0e2bc515f9d0991b20" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_albaran_fecha" ON "albaran" ("fecha") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_albaran_n_albaran" ON "albaran" ("n_albaran") `
    );
    await queryRunner.query(
      `CREATE TABLE "albaran_pedido_recepcion" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "albaran_id" uuid NOT NULL, "recepcion_pedido_id" uuid NOT NULL, CONSTRAINT "PK_4e4493d09233df5680248038b50" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_664fb648b17b03aecc5639284e" ON "albaran_pedido_recepcion" ("recepcion_pedido_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e7038c3a7398fcd951fac49956" ON "albaran_pedido_recepcion" ("albaran_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "recepcion_pedido" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "recepcion_id" uuid NOT NULL, "pedido_id" uuid NOT NULL, "fecha_vinculacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_582a9239e17a2ed19d010fdce25" UNIQUE ("recepcion_id", "pedido_id"), CONSTRAINT "PK_1b3fc0c090a639fbcce70e59f89" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ed26b758c3765cb49876275cc2" ON "recepcion_pedido" ("pedido_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_42686443478f10158bf2d0b414" ON "recepcion_pedido" ("recepcion_id") `
    );
    await queryRunner.query(
      `CREATE TYPE "public"."incidencia_linea_tipo_diferencia_enum" AS ENUM('FALTANTE', 'EXCESO', 'DEFECTUOSO')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."incidencia_linea_estado_reclamacion_enum" AS ENUM('PENDIENTE', 'RECLAMADO', 'ABONADO', 'REENVIADO')`
    );
    await queryRunner.query(
      `CREATE TABLE "incidencia_linea" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "incidencia_id" uuid NOT NULL, "pedido_producto_id" uuid NOT NULL, "cantidad_esperada" numeric(12,3) NOT NULL, "cantidad_recibida" numeric(12,3) NOT NULL, "diferencia" numeric(12,3) NOT NULL, "tipo_diferencia" "public"."incidencia_linea_tipo_diferencia_enum" NOT NULL, "estado_reclamacion" "public"."incidencia_linea_estado_reclamacion_enum" NOT NULL DEFAULT 'PENDIENTE', "observaciones" text, CONSTRAINT "PK_28e0e3cc62508847a2c93c2c3be" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b30e4a5cbad7750650ca806bfe" ON "incidencia_linea" ("pedido_producto_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c3124f5ecd068aa12d05c6c623" ON "incidencia_linea" ("incidencia_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "incidencia" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "recepcion_id" uuid NOT NULL, "pedido_id" uuid, "usuario_resolutor_id" uuid, "observaciones_recepcion" text, "observaciones_resolucion" text, "fecha_resolucion" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_1e98587e9dc53e62e039e0dbabf" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_807e1989e29cc1c12a249c90e9" ON "incidencia" ("usuario_resolutor_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7e44b7fd67f2ba738e201820e0" ON "incidencia" ("pedido_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3001265b19773eb9d66e0d3612" ON "incidencia" ("recepcion_id") `
    );
    await queryRunner.query(
      `CREATE TYPE "public"."recepcion_producto_estado_producto_enum" AS ENUM('PERFECTO', 'ROTO', 'FALTA_TOTAL', 'EXCEDE')`
    );
    await queryRunner.query(
      `CREATE TABLE "recepcion_producto" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "recepcion_id" uuid NOT NULL, "pedido_producto_id" uuid NOT NULL, "incidencia_id" uuid, "cantidad_recibida" numeric(12,3) NOT NULL, "observaciones" text, "estado_producto" "public"."recepcion_producto_estado_producto_enum" NOT NULL DEFAULT 'PERFECTO', "fecha_recepcion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "is_weighed_with_scale" boolean NOT NULL DEFAULT false, CONSTRAINT "REL_a80ab4fe55d3cf775839248660" UNIQUE ("incidencia_id"), CONSTRAINT "CHK_e1e5cf04fe15dc63fb770655ef" CHECK ("cantidad_recibida" >= 0), CONSTRAINT "PK_dd320fd72605b5312dfc2f16ca4" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a80ab4fe55d3cf775839248660" ON "recepcion_producto" ("incidencia_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b0f146177ebdc8c20aaf1d27a6" ON "recepcion_producto" ("pedido_producto_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4b593021de092d8e1a6d02e8cd" ON "recepcion_producto" ("recepcion_id") `
    );
    await queryRunner.query(
      `CREATE TYPE "public"."recepcion_estado_enum" AS ENUM('COMPLETADA', 'PARCIAL', 'CON_INCIDENCIAS')`
    );
    await queryRunner.query(
      `CREATE TABLE "recepcion" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "usuario_id" uuid, "fecha_recepcion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "estado" "public"."recepcion_estado_enum" NOT NULL DEFAULT 'COMPLETADA', "observaciones" text, "incidencia" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_47d2fdb94ecf7269b6c30b6c7c7" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e90ac11f55ee175bf0e754b407" ON "recepcion" ("estado") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a0b2ad3f5f476a2b8024d5402a" ON "recepcion" ("fecha_recepcion") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6b5d81373095626e1c70eb2273" ON "recepcion" ("usuario_id") `
    );
    await queryRunner.query(
      `CREATE TYPE "public"."movimiento_tipo_enum" AS ENUM('entrada', 'salida', 'ajuste', 'pedido', 'entrada_compra', 'salida_elaboracion', 'produccion_consumo', 'produccion_resultado', 'salida_ajuste', 'merma')`
    );
    await queryRunner.query(
      `CREATE TABLE "movimiento" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "usuario_id" uuid, "inventario_id" uuid, "producto_proveedor_id" uuid, "tipo" "public"."movimiento_tipo_enum" NOT NULL, "cantidad" numeric(12,3) NOT NULL, "entidad_tipo" character varying(50) NOT NULL, "entidad_id" uuid NOT NULL, "descripcion" text, CONSTRAINT "CHK_7abefab94d4896762a3402cc57" CHECK ("cantidad" >= 0), CONSTRAINT "PK_809988d143ce94a95f3d30164ab" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3e838175798a028c27ca686ca2" ON "movimiento" ("created_at") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4fc1d76faf193b83d37ae29fa2" ON "movimiento" ("producto_proveedor_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_46b3c1c6a31b3b0ee001df7888" ON "movimiento" ("inventario_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3312757621191da88e0af84137" ON "movimiento" ("entidad_id", "entidad_tipo") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_91ee335adf4aff70d9a95c3000" ON "movimiento" ("entidad_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6915a1703d4608308507b17197" ON "movimiento" ("entidad_tipo", "tipo") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d5ba7acb558e7acd7fcef55dfb" ON "movimiento" ("usuario_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1cc85f3409fa42b33ce52d8975" ON "movimiento" ("tipo") `
    );
    await queryRunner.query(
      `CREATE TABLE "archivo" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "nombre" character varying(255) NOT NULL, "url" character varying(500) NOT NULL, "tamano" integer NOT NULL, "mimeType" character varying(100) NOT NULL, "is_deleted" boolean NOT NULL DEFAULT false, "usuario_id" uuid, "url_optimized" character varying(500), "tamano_optimized" integer, "mime_type_optimized" character varying(100), CONSTRAINT "PK_635ec16a167251dabbd41681555" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6389bd3aaa9f0acbae746ae732" ON "archivo" ("is_deleted") `
    );
    await queryRunner.query(
      `CREATE TABLE "alumno_slot" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "aula" character varying NOT NULL, "numero_clase" integer NOT NULL, "capacidad" integer NOT NULL DEFAULT '30', "codigo_slot" character varying, "profesor_id" uuid, CONSTRAINT "UQ_77c874ff179cb8c2c1581b7e0ab" UNIQUE ("codigo_slot"), CONSTRAINT "PK_91fb60059da013049de1843333d" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_slot_profesor_aula_clase" ON "alumno_slot" ("profesor_id", "aula", "numero_clase") `
    );
    await queryRunner.query(
      `CREATE TABLE "alumno" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "user_id" uuid, "slot_id" uuid, "profesor_id" uuid, CONSTRAINT "REL_b35254e55b6b08bf00e70223c9" UNIQUE ("user_id"), CONSTRAINT "PK_7f3dc49afa47af23777d1ddf00c" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_alumno_user" ON "alumno" ("user_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "profesor" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "cial" character varying NOT NULL, "user_id" uuid, CONSTRAINT "UQ_cd3e623f4e4f99bf9778294a751" UNIQUE ("cial"), CONSTRAINT "REL_8f36295dbf50eacec160ff56ba" UNIQUE ("user_id"), CONSTRAINT "PK_89ab503ec3d28c357d8105f2092" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_profesor_user" ON "profesor" ("user_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "plantilla_rol" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "nombre" character varying(100) NOT NULL, "descripcion" text, "es_editable" boolean NOT NULL DEFAULT true, "activo" boolean NOT NULL DEFAULT true, "plantilla_padre_id" uuid, CONSTRAINT "UQ_4f9b2c7e6684aef682784361afe" UNIQUE ("nombre"), CONSTRAINT "PK_33e1eca8846f3d176a200a8bbb0" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_plantilla_activo" ON "plantilla_rol" ("activo") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_plantilla_nombre" ON "plantilla_rol" ("nombre") `
    );
    await queryRunner.query(
      `CREATE TABLE "permiso" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "codigo" character varying(100) NOT NULL, "nombre" character varying(150) NOT NULL, "descripcion" text, "modulo" character varying(50) NOT NULL, "accion" character varying(50) NOT NULL, "activo" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_70a3960f3bb071a0eea3ea307bf" UNIQUE ("codigo"), CONSTRAINT "PK_8f675309c577bd8f4d826994e95" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_permiso_activo" ON "permiso" ("activo") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_permiso_modulo" ON "permiso" ("modulo") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_permiso_codigo" ON "permiso" ("codigo") `
    );
    await queryRunner.query(
      `CREATE TABLE "rol" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "nombre" character varying(100) NOT NULL, "descripcion" text, "es_sistema" boolean NOT NULL DEFAULT false, "activo" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_9792c580a992d554ee1621c5b45" UNIQUE ("nombre"), CONSTRAINT "PK_c93a22388638fac311781c7f2dd" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_rol_activo" ON "rol" ("activo") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_rol_nombre" ON "rol" ("nombre") `
    );
    await queryRunner.query(
      `CREATE TYPE "public"."usuario_rol_enum" AS ENUM('SUPER_ADMIN', 'ADMIN', 'PROFESOR', 'ALUMNO')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."usuario_status_enum" AS ENUM('INACTIVE', 'ACTIVE', 'BLOCKED')`
    );
    await queryRunner.query(
      `CREATE TABLE "usuario" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "nombre" character varying(150), "username" character varying(100) NOT NULL, "password" character varying(100) NOT NULL, "email" character varying(255), "rol" "public"."usuario_rol_enum" NOT NULL DEFAULT 'ALUMNO', "status" "public"."usuario_status_enum" NOT NULL DEFAULT 'INACTIVE', "resetPasswordOtp" character varying, "resetPasswordOtpExpires" TIMESTAMP WITH TIME ZONE, "must_change_password" boolean NOT NULL DEFAULT false, "activo" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_6ccff37176a6978449a99c82e10" UNIQUE ("username"), CONSTRAINT "UQ_2863682842e688ca198eb25c124" UNIQUE ("email"), CONSTRAINT "PK_a56c58e5cabaa04fb2c98d2d7e2" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_usuario_status" ON "usuario" ("status") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2863682842e688ca198eb25c12" ON "usuario" ("email") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6ccff37176a6978449a99c82e1" ON "usuario" ("username") `
    );
    await queryRunner.query(
      `CREATE TABLE "usuario_rol" ("usuario_id" uuid NOT NULL, "rol_id" uuid NOT NULL, "asignado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "asignado_por" uuid, "activo" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_40b321ebb932d588934043a2639" PRIMARY KEY ("usuario_id", "rol_id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_usuario_rol_activo" ON "usuario_rol" ("activo") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_usuario_rol_rol" ON "usuario_rol" ("rol_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_usuario_rol_usuario" ON "usuario_rol" ("usuario_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "rol_permiso" ("rol_id" uuid NOT NULL, "permiso_id" uuid NOT NULL, "asignado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "asignado_por" uuid, CONSTRAINT "PK_256c1f4f9321263545469f2aff0" PRIMARY KEY ("rol_id", "permiso_id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_rol_permiso_permiso" ON "rol_permiso" ("permiso_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_rol_permiso_rol" ON "rol_permiso" ("rol_id") `
    );
    await queryRunner.query(
      `CREATE TYPE "public"."receta_ingrediente_unidad_enum" AS ENUM('g', 'kg', 'l', 'ml', 'pieza', 'cda', 'cdta')`
    );
    await queryRunner.query(
      `CREATE TABLE "receta_ingrediente" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "receta_id" uuid NOT NULL, "producto_id" uuid NOT NULL, "cantidad" numeric(12,4) NOT NULL, "unidad" "public"."receta_ingrediente_unidad_enum" NOT NULL, "merma_aplicada" numeric(5,2) NOT NULL DEFAULT '0', "proveedor_favorito_id" uuid, CONSTRAINT "PK_e4cf60e3b5465b74b4db01c6222" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."dificultad_receta_enum" AS ENUM('Fácil', 'Media', 'Difícil')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."receta_unidad_resultado_enum" AS ENUM('g', 'kg', 'l', 'ml', 'pieza', 'cda', 'cdta')`
    );
    await queryRunner.query(
      `CREATE TABLE "receta" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "nombre" character varying(150) NOT NULL, "instrucciones" text NOT NULL, "tiempo_estimado_minutos" integer NOT NULL DEFAULT '0', "dificultad" "public"."dificultad_receta_enum" NOT NULL, "path_img" character varying(255), "path_img_optimized" character varying(255), "rendimiento" numeric(12,3), "unidad_resultado" "public"."receta_unidad_resultado_enum", "dias_caducidad" integer, "coste_unitario_estimado" numeric(12,4), "raciones" numeric(12,3) DEFAULT '1', "tamanio_racion" numeric(12,3), CONSTRAINT "PK_f3acd9397b95e92dd92c8b089ce" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c1c8bde7245c6d026d85fa358e" ON "receta" ("dificultad", "tiempo_estimado_minutos") `
    );
    await queryRunner.query(
      `CREATE TYPE "public"."produccion_lote_estado_enum" AS ENUM('disponible', 'agotado')`
    );
    await queryRunner.query(
      `CREATE TABLE "produccion_lote" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "receta_id" uuid NOT NULL, "usuario_id" uuid, "preparacion_id" character varying, "cantidad_producida" numeric(12,3) NOT NULL, "fecha_produccion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_caducidad" TIMESTAMP WITH TIME ZONE, "coste_total_real" numeric(14,4) NOT NULL, "porciones_producidas" numeric(12,3) NOT NULL DEFAULT '0', "porciones_restantes" numeric(10,3) NOT NULL DEFAULT '0', "estado" "public"."produccion_lote_estado_enum" NOT NULL DEFAULT 'disponible', CONSTRAINT "PK_8b7bc4dc420fe284a3bf6f9ac66" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_505dcdcd22e7e70500fca3aceb" ON "produccion_lote" ("fecha_produccion") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6711682cf29ceded805aac284b" ON "produccion_lote" ("preparacion_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2224301d51d481df79857e3815" ON "produccion_lote" ("usuario_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fa820d7b2fa7f242a8d6ec2d90" ON "produccion_lote" ("receta_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "recepcion_draft" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "usuario_id" uuid NOT NULL, "draft_version" integer NOT NULL DEFAULT '1', "payload" jsonb NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_4cc0a6dc87bbfff3b0c555b4738" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ee625eb3f20055fd081c92350a" ON "recepcion_draft" ("expires_at") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2ece75142aa08636f2dd56b440" ON "recepcion_draft" ("usuario_id", "updated_at") `
    );
    await queryRunner.query(
      `CREATE TYPE "public"."preparacion_estado_enum" AS ENUM('PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA')`
    );
    await queryRunner.query(
      `CREATE TABLE "preparacion" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "receta_id" uuid NOT NULL, "usuario_id" uuid, "ubicacion_destino_id" character varying, "cantidad_a_producir" numeric(12,3) NOT NULL, "estado" "public"."preparacion_estado_enum" NOT NULL DEFAULT 'PENDIENTE', "fecha_programada" TIMESTAMP WITH TIME ZONE, "fecha_inicio" TIMESTAMP WITH TIME ZONE, "fecha_finalizacion" TIMESTAMP WITH TIME ZONE, "observaciones" text, CONSTRAINT "PK_58cacf2d4ca9172ccac79e4f598" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "plantilla_rol_permiso" ("plantilla_rol_id" uuid NOT NULL, "permiso_id" uuid NOT NULL, "asignado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ce02e35ba9df08c662fbead7f90" PRIMARY KEY ("plantilla_rol_id", "permiso_id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_plantilla_permiso_permiso" ON "plantilla_rol_permiso" ("permiso_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_plantilla_permiso_plantilla" ON "plantilla_rol_permiso" ("plantilla_rol_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "pedido_draft" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "usuario_id" uuid NOT NULL, "draft_version" integer NOT NULL DEFAULT '1', "payload" jsonb NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_0c66cc8757ed80d928f185fbf52" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_82bcc3688713572e34e15c1d05" ON "pedido_draft" ("expires_at") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_229516cf91339177d70f1baaaf" ON "pedido_draft" ("usuario_id", "updated_at") `
    );
    await queryRunner.query(
      `CREATE TYPE "public"."incidencia_resuelta_tipo_resolucion_enum" AS ENUM('aceptada', 'rechazada', 'parcial', 'devolucion', 'abono', 'cambio')`
    );
    await queryRunner.query(
      `CREATE TABLE "incidencia_resuelta" ("id" uuid NOT NULL DEFAULT uuid_generate_v7(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "version" integer NOT NULL DEFAULT '1', "incidencia_id" uuid NOT NULL, "usuario_resolutor_id" uuid, "tipo_resolucion" "public"."incidencia_resuelta_tipo_resolucion_enum" NOT NULL, "fecha_resolucion" TIMESTAMP WITH TIME ZONE NOT NULL, "observaciones" text, CONSTRAINT "PK_94296b45f68d0028be285d9be1d" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1198981166f140fb44f6aeda8b" ON "incidencia_resuelta" ("usuario_resolutor_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_445a98d2e31719542ca3369c71" ON "incidencia_resuelta" ("incidencia_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "usuario_permiso_adicional" ("usuario_id" uuid NOT NULL, "permiso_id" uuid NOT NULL, CONSTRAINT "PK_a046e93dee0a9791989511f1b40" PRIMARY KEY ("usuario_id", "permiso_id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b7fec64c27926c73e4bc4a0fd9" ON "usuario_permiso_adicional" ("usuario_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_438f6f178dcd10ba608245d8a8" ON "usuario_permiso_adicional" ("permiso_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "usuario_permiso_excluido" ("usuario_id" uuid NOT NULL, "permiso_id" uuid NOT NULL, CONSTRAINT "PK_65c93202020bef42d99afea292a" PRIMARY KEY ("usuario_id", "permiso_id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_23c8ffbff595a8b728cb8b96ae" ON "usuario_permiso_excluido" ("usuario_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e9e538ec5acb79fcd237836849" ON "usuario_permiso_excluido" ("permiso_id") `
    );
    await queryRunner.query(
      `ALTER TABLE "plantilla_rol_permiso" DROP COLUMN "asignado_en"`
    );
    await queryRunner.query(
      `ALTER TABLE "rol_permiso" DROP COLUMN "asignado_en"`
    );
    await queryRunner.query(
      `ALTER TABLE "rol_permiso" DROP COLUMN "asignado_por"`
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_rol" DROP COLUMN "asignado_en"`
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_rol" DROP COLUMN "asignado_por"`
    );
    await queryRunner.query(`DROP INDEX "public"."idx_usuario_rol_activo"`);
    await queryRunner.query(`ALTER TABLE "usuario_rol" DROP COLUMN "activo"`);
    await queryRunner.query(
      `ALTER TABLE "usuario_rol" ADD "asignado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_rol" ADD "asignado_por" uuid`
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_rol" ADD "activo" boolean NOT NULL DEFAULT true`
    );
    await queryRunner.query(
      `ALTER TABLE "rol_permiso" ADD "asignado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "rol_permiso" ADD "asignado_por" uuid`
    );
    await queryRunner.query(
      `ALTER TABLE "plantilla_rol_permiso" ADD "asignado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_usuario_rol_activo" ON "usuario_rol" ("activo") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_748ced9aed467c34dfd03acdce" ON "plantilla_rol_permiso" ("plantilla_rol_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9cd0dc105cca3b3680681e727f" ON "plantilla_rol_permiso" ("permiso_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c59b6b0fee02257a3e1ca75c47" ON "rol_permiso" ("rol_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3c476728351cd2f8f875ceb32e" ON "rol_permiso" ("permiso_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_29e9a9079c7ba01c1b301cf555" ON "usuario_rol" ("usuario_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ac8911cd54a61461c992654140" ON "usuario_rol" ("rol_id") `
    );
    await queryRunner.query(
      `ALTER TABLE "producto_alergeno" ADD CONSTRAINT "FK_bc3e25a49feddab9251f9673529" FOREIGN KEY ("producto_id") REFERENCES "producto"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "merma" ADD CONSTRAINT "FK_7f0c639a18360c2d62aa8736758" FOREIGN KEY ("producto_id") REFERENCES "producto"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "merma" ADD CONSTRAINT "FK_e6afa3b841aa0bf071af5a07823" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "inventario" ADD CONSTRAINT "FK_51b8f559ad2d145c83f882bad88" FOREIGN KEY ("producto_proveedor_id") REFERENCES "producto_proveedor"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "inventario" ADD CONSTRAINT "FK_6d9c5c09e5fc8a7d675e5be8aa4" FOREIGN KEY ("ubicacion_id") REFERENCES "ubicacion"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "historial_precio" ADD CONSTRAINT "FK_167351b501de3a9bbda86e32616" FOREIGN KEY ("producto_proveedor_id") REFERENCES "producto_proveedor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "producto_proveedor" ADD CONSTRAINT "FK_7587673df9ed2964d7fa4a24124" FOREIGN KEY ("producto_id") REFERENCES "producto"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "producto_proveedor" ADD CONSTRAINT "FK_9e66fbc60135bb0a2b5d45cbb4f" FOREIGN KEY ("proveedor_id") REFERENCES "proveedor"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "pedido_usuario" ADD CONSTRAINT "FK_57e60878eac7fdeddf1ba345122" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "pedido_usuario_linea" ADD CONSTRAINT "FK_ccc9ff398bd7a1d8033bb7de00f" FOREIGN KEY ("pedido_usuario_id") REFERENCES "pedido_usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "pedido_usuario_linea" ADD CONSTRAINT "FK_152434b3e2e20e850567fed3a58" FOREIGN KEY ("producto_proveedor_id") REFERENCES "producto_proveedor"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "pedido_producto" ADD CONSTRAINT "FK_3d683a14b23ae2025106e902427" FOREIGN KEY ("pedido_id") REFERENCES "pedido"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "pedido_producto" ADD CONSTRAINT "FK_421bfaaa0af9cb66b544e3153a0" FOREIGN KEY ("producto_proveedor_id") REFERENCES "producto_proveedor"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "pedido_producto" ADD CONSTRAINT "FK_a4d3381551b984299309fe45fd9" FOREIGN KEY ("pedido_usuario_linea_id") REFERENCES "pedido_usuario_linea"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_batch" ADD CONSTRAINT "FK_f64cb01481764f206dfdc5cf6f1" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "pedido" ADD CONSTRAINT "FK_a76ebc7864e48113c6b27cf47a9" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "pedido" ADD CONSTRAINT "FK_b99552b8d2f8a4f7cb137838ae0" FOREIGN KEY ("proveedor_id") REFERENCES "proveedor"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "pedido" ADD CONSTRAINT "FK_086666189136207ffa3568ae79e" FOREIGN KEY ("batch_id") REFERENCES "purchase_batch"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "pedido" ADD CONSTRAINT "FK_cb62b189425f2ca829b2b6aed0f" FOREIGN KEY ("pedido_usuario_id") REFERENCES "pedido_usuario"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "albaran_pedido_recepcion" ADD CONSTRAINT "FK_e7038c3a7398fcd951fac499560" FOREIGN KEY ("albaran_id") REFERENCES "albaran"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "albaran_pedido_recepcion" ADD CONSTRAINT "FK_664fb648b17b03aecc5639284e2" FOREIGN KEY ("recepcion_pedido_id") REFERENCES "recepcion_pedido"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "recepcion_pedido" ADD CONSTRAINT "FK_42686443478f10158bf2d0b4144" FOREIGN KEY ("recepcion_id") REFERENCES "recepcion"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "recepcion_pedido" ADD CONSTRAINT "FK_ed26b758c3765cb49876275cc20" FOREIGN KEY ("pedido_id") REFERENCES "pedido"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "incidencia_linea" ADD CONSTRAINT "FK_c3124f5ecd068aa12d05c6c6239" FOREIGN KEY ("incidencia_id") REFERENCES "incidencia"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "incidencia_linea" ADD CONSTRAINT "FK_b30e4a5cbad7750650ca806bfec" FOREIGN KEY ("pedido_producto_id") REFERENCES "pedido_producto"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "incidencia" ADD CONSTRAINT "FK_3001265b19773eb9d66e0d36126" FOREIGN KEY ("recepcion_id") REFERENCES "recepcion"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "incidencia" ADD CONSTRAINT "FK_7e44b7fd67f2ba738e201820e01" FOREIGN KEY ("pedido_id") REFERENCES "pedido"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "incidencia" ADD CONSTRAINT "FK_807e1989e29cc1c12a249c90e99" FOREIGN KEY ("usuario_resolutor_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "recepcion_producto" ADD CONSTRAINT "FK_4b593021de092d8e1a6d02e8cd3" FOREIGN KEY ("recepcion_id") REFERENCES "recepcion"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "recepcion_producto" ADD CONSTRAINT "FK_b0f146177ebdc8c20aaf1d27a68" FOREIGN KEY ("pedido_producto_id") REFERENCES "pedido_producto"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "recepcion_producto" ADD CONSTRAINT "FK_a80ab4fe55d3cf7758392486605" FOREIGN KEY ("incidencia_id") REFERENCES "incidencia"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "recepcion" ADD CONSTRAINT "FK_6b5d81373095626e1c70eb2273d" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "movimiento" ADD CONSTRAINT "FK_d5ba7acb558e7acd7fcef55dfb6" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "movimiento" ADD CONSTRAINT "FK_46b3c1c6a31b3b0ee001df7888e" FOREIGN KEY ("inventario_id") REFERENCES "inventario"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "movimiento" ADD CONSTRAINT "FK_4fc1d76faf193b83d37ae29fa22" FOREIGN KEY ("producto_proveedor_id") REFERENCES "producto_proveedor"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "archivo" ADD CONSTRAINT "FK_186d74255bdfb84a897384b4f64" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "alumno_slot" ADD CONSTRAINT "FK_e16584c870db2f5dd021c7b072c" FOREIGN KEY ("profesor_id") REFERENCES "profesor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "alumno" ADD CONSTRAINT "FK_b35254e55b6b08bf00e70223c90" FOREIGN KEY ("user_id") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "alumno" ADD CONSTRAINT "FK_91fb60059da013049de1843333d" FOREIGN KEY ("slot_id") REFERENCES "alumno_slot"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "alumno" ADD CONSTRAINT "FK_de4f9152788566685b4a53277ea" FOREIGN KEY ("profesor_id") REFERENCES "profesor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "profesor" ADD CONSTRAINT "FK_8f36295dbf50eacec160ff56ba0" FOREIGN KEY ("user_id") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "plantilla_rol" ADD CONSTRAINT "FK_3d8eb792b10180dd7f4a28aa5e6" FOREIGN KEY ("plantilla_padre_id") REFERENCES "plantilla_rol"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_rol" ADD CONSTRAINT "FK_29e9a9079c7ba01c1b301cf5555" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_rol" ADD CONSTRAINT "FK_ac8911cd54a61461c9926541401" FOREIGN KEY ("rol_id") REFERENCES "rol"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "rol_permiso" ADD CONSTRAINT "FK_c59b6b0fee02257a3e1ca75c47b" FOREIGN KEY ("rol_id") REFERENCES "rol"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "rol_permiso" ADD CONSTRAINT "FK_3c476728351cd2f8f875ceb32ee" FOREIGN KEY ("permiso_id") REFERENCES "permiso"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "receta_ingrediente" ADD CONSTRAINT "FK_cf9a356ab2634d0a959d5303a73" FOREIGN KEY ("receta_id") REFERENCES "receta"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "receta_ingrediente" ADD CONSTRAINT "FK_e505fbe5a887d9826c108040b07" FOREIGN KEY ("producto_id") REFERENCES "producto"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "receta_ingrediente" ADD CONSTRAINT "FK_74b8d209e8baa7c4177a9a00205" FOREIGN KEY ("proveedor_favorito_id") REFERENCES "proveedor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "produccion_lote" ADD CONSTRAINT "FK_fa820d7b2fa7f242a8d6ec2d906" FOREIGN KEY ("receta_id") REFERENCES "receta"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "produccion_lote" ADD CONSTRAINT "FK_2224301d51d481df79857e38154" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "recepcion_draft" ADD CONSTRAINT "FK_794f8ffa4a5752ffdf0b8069bda" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "preparacion" ADD CONSTRAINT "FK_6688e11cf56b82dc8a0ba3f3dd1" FOREIGN KEY ("receta_id") REFERENCES "receta"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "preparacion" ADD CONSTRAINT "FK_25fac2cb129705307fb801b1892" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "plantilla_rol_permiso" ADD CONSTRAINT "FK_748ced9aed467c34dfd03acdce2" FOREIGN KEY ("plantilla_rol_id") REFERENCES "plantilla_rol"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "plantilla_rol_permiso" ADD CONSTRAINT "FK_9cd0dc105cca3b3680681e727fe" FOREIGN KEY ("permiso_id") REFERENCES "permiso"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "pedido_draft" ADD CONSTRAINT "FK_11f829210d03a83b237d772acf5" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "incidencia_resuelta" ADD CONSTRAINT "FK_445a98d2e31719542ca3369c716" FOREIGN KEY ("incidencia_id") REFERENCES "incidencia"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "incidencia_resuelta" ADD CONSTRAINT "FK_1198981166f140fb44f6aeda8ba" FOREIGN KEY ("usuario_resolutor_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_permiso_adicional" ADD CONSTRAINT "FK_b7fec64c27926c73e4bc4a0fd9d" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_permiso_adicional" ADD CONSTRAINT "FK_438f6f178dcd10ba608245d8a86" FOREIGN KEY ("permiso_id") REFERENCES "permiso"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_permiso_excluido" ADD CONSTRAINT "FK_23c8ffbff595a8b728cb8b96aee" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_permiso_excluido" ADD CONSTRAINT "FK_e9e538ec5acb79fcd2378368495" FOREIGN KEY ("permiso_id") REFERENCES "permiso"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  private async shouldSkipBaseline(queryRunner: QueryRunner): Promise<boolean> {
    const rows = (await queryRunner.query(
      `SELECT
         to_regclass('public.usuario') IS NOT NULL AS has_usuario,
         to_regclass('public.rol') IS NOT NULL AS has_rol,
         to_regclass('public.permiso') IS NOT NULL AS has_permiso,
         to_regclass('public.plantilla_rol') IS NOT NULL AS has_plantilla_rol,
         to_regtype('public.producto_alergeno_alergeno_enum') IS NOT NULL AS has_alergeno_enum`
    )) as Array<{
      has_usuario?: boolean | string;
      has_rol?: boolean | string;
      has_permiso?: boolean | string;
      has_plantilla_rol?: boolean | string;
      has_alergeno_enum?: boolean | string;
    }>;

    const marker = rows[0] ?? {};
    const existingSignals = [
      this.toBoolean(marker.has_usuario),
      this.toBoolean(marker.has_rol),
      this.toBoolean(marker.has_permiso),
      this.toBoolean(marker.has_plantilla_rol),
      this.toBoolean(marker.has_alergeno_enum),
    ].filter(Boolean).length;

    return existingSignals >= 3;
  }

  private toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === 't' || normalized === 'true';
    }

    return false;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuario_permiso_excluido" DROP CONSTRAINT "FK_e9e538ec5acb79fcd2378368495"`
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_permiso_excluido" DROP CONSTRAINT "FK_23c8ffbff595a8b728cb8b96aee"`
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_permiso_adicional" DROP CONSTRAINT "FK_438f6f178dcd10ba608245d8a86"`
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_permiso_adicional" DROP CONSTRAINT "FK_b7fec64c27926c73e4bc4a0fd9d"`
    );
    await queryRunner.query(
      `ALTER TABLE "incidencia_resuelta" DROP CONSTRAINT "FK_1198981166f140fb44f6aeda8ba"`
    );
    await queryRunner.query(
      `ALTER TABLE "incidencia_resuelta" DROP CONSTRAINT "FK_445a98d2e31719542ca3369c716"`
    );
    await queryRunner.query(
      `ALTER TABLE "pedido_draft" DROP CONSTRAINT "FK_11f829210d03a83b237d772acf5"`
    );
    await queryRunner.query(
      `ALTER TABLE "plantilla_rol_permiso" DROP CONSTRAINT "FK_9cd0dc105cca3b3680681e727fe"`
    );
    await queryRunner.query(
      `ALTER TABLE "plantilla_rol_permiso" DROP CONSTRAINT "FK_748ced9aed467c34dfd03acdce2"`
    );
    await queryRunner.query(
      `ALTER TABLE "preparacion" DROP CONSTRAINT "FK_25fac2cb129705307fb801b1892"`
    );
    await queryRunner.query(
      `ALTER TABLE "preparacion" DROP CONSTRAINT "FK_6688e11cf56b82dc8a0ba3f3dd1"`
    );
    await queryRunner.query(
      `ALTER TABLE "recepcion_draft" DROP CONSTRAINT "FK_794f8ffa4a5752ffdf0b8069bda"`
    );
    await queryRunner.query(
      `ALTER TABLE "produccion_lote" DROP CONSTRAINT "FK_2224301d51d481df79857e38154"`
    );
    await queryRunner.query(
      `ALTER TABLE "produccion_lote" DROP CONSTRAINT "FK_fa820d7b2fa7f242a8d6ec2d906"`
    );
    await queryRunner.query(
      `ALTER TABLE "receta_ingrediente" DROP CONSTRAINT "FK_74b8d209e8baa7c4177a9a00205"`
    );
    await queryRunner.query(
      `ALTER TABLE "receta_ingrediente" DROP CONSTRAINT "FK_e505fbe5a887d9826c108040b07"`
    );
    await queryRunner.query(
      `ALTER TABLE "receta_ingrediente" DROP CONSTRAINT "FK_cf9a356ab2634d0a959d5303a73"`
    );
    await queryRunner.query(
      `ALTER TABLE "rol_permiso" DROP CONSTRAINT "FK_3c476728351cd2f8f875ceb32ee"`
    );
    await queryRunner.query(
      `ALTER TABLE "rol_permiso" DROP CONSTRAINT "FK_c59b6b0fee02257a3e1ca75c47b"`
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_rol" DROP CONSTRAINT "FK_ac8911cd54a61461c9926541401"`
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_rol" DROP CONSTRAINT "FK_29e9a9079c7ba01c1b301cf5555"`
    );
    await queryRunner.query(
      `ALTER TABLE "plantilla_rol" DROP CONSTRAINT "FK_3d8eb792b10180dd7f4a28aa5e6"`
    );
    await queryRunner.query(
      `ALTER TABLE "profesor" DROP CONSTRAINT "FK_8f36295dbf50eacec160ff56ba0"`
    );
    await queryRunner.query(
      `ALTER TABLE "alumno" DROP CONSTRAINT "FK_de4f9152788566685b4a53277ea"`
    );
    await queryRunner.query(
      `ALTER TABLE "alumno" DROP CONSTRAINT "FK_91fb60059da013049de1843333d"`
    );
    await queryRunner.query(
      `ALTER TABLE "alumno" DROP CONSTRAINT "FK_b35254e55b6b08bf00e70223c90"`
    );
    await queryRunner.query(
      `ALTER TABLE "alumno_slot" DROP CONSTRAINT "FK_e16584c870db2f5dd021c7b072c"`
    );
    await queryRunner.query(
      `ALTER TABLE "archivo" DROP CONSTRAINT "FK_186d74255bdfb84a897384b4f64"`
    );
    await queryRunner.query(
      `ALTER TABLE "movimiento" DROP CONSTRAINT "FK_4fc1d76faf193b83d37ae29fa22"`
    );
    await queryRunner.query(
      `ALTER TABLE "movimiento" DROP CONSTRAINT "FK_46b3c1c6a31b3b0ee001df7888e"`
    );
    await queryRunner.query(
      `ALTER TABLE "movimiento" DROP CONSTRAINT "FK_d5ba7acb558e7acd7fcef55dfb6"`
    );
    await queryRunner.query(
      `ALTER TABLE "recepcion" DROP CONSTRAINT "FK_6b5d81373095626e1c70eb2273d"`
    );
    await queryRunner.query(
      `ALTER TABLE "recepcion_producto" DROP CONSTRAINT "FK_a80ab4fe55d3cf7758392486605"`
    );
    await queryRunner.query(
      `ALTER TABLE "recepcion_producto" DROP CONSTRAINT "FK_b0f146177ebdc8c20aaf1d27a68"`
    );
    await queryRunner.query(
      `ALTER TABLE "recepcion_producto" DROP CONSTRAINT "FK_4b593021de092d8e1a6d02e8cd3"`
    );
    await queryRunner.query(
      `ALTER TABLE "incidencia" DROP CONSTRAINT "FK_807e1989e29cc1c12a249c90e99"`
    );
    await queryRunner.query(
      `ALTER TABLE "incidencia" DROP CONSTRAINT "FK_7e44b7fd67f2ba738e201820e01"`
    );
    await queryRunner.query(
      `ALTER TABLE "incidencia" DROP CONSTRAINT "FK_3001265b19773eb9d66e0d36126"`
    );
    await queryRunner.query(
      `ALTER TABLE "incidencia_linea" DROP CONSTRAINT "FK_b30e4a5cbad7750650ca806bfec"`
    );
    await queryRunner.query(
      `ALTER TABLE "incidencia_linea" DROP CONSTRAINT "FK_c3124f5ecd068aa12d05c6c6239"`
    );
    await queryRunner.query(
      `ALTER TABLE "recepcion_pedido" DROP CONSTRAINT "FK_ed26b758c3765cb49876275cc20"`
    );
    await queryRunner.query(
      `ALTER TABLE "recepcion_pedido" DROP CONSTRAINT "FK_42686443478f10158bf2d0b4144"`
    );
    await queryRunner.query(
      `ALTER TABLE "albaran_pedido_recepcion" DROP CONSTRAINT "FK_664fb648b17b03aecc5639284e2"`
    );
    await queryRunner.query(
      `ALTER TABLE "albaran_pedido_recepcion" DROP CONSTRAINT "FK_e7038c3a7398fcd951fac499560"`
    );
    await queryRunner.query(
      `ALTER TABLE "pedido" DROP CONSTRAINT "FK_cb62b189425f2ca829b2b6aed0f"`
    );
    await queryRunner.query(
      `ALTER TABLE "pedido" DROP CONSTRAINT "FK_086666189136207ffa3568ae79e"`
    );
    await queryRunner.query(
      `ALTER TABLE "pedido" DROP CONSTRAINT "FK_b99552b8d2f8a4f7cb137838ae0"`
    );
    await queryRunner.query(
      `ALTER TABLE "pedido" DROP CONSTRAINT "FK_a76ebc7864e48113c6b27cf47a9"`
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_batch" DROP CONSTRAINT "FK_f64cb01481764f206dfdc5cf6f1"`
    );
    await queryRunner.query(
      `ALTER TABLE "pedido_producto" DROP CONSTRAINT "FK_a4d3381551b984299309fe45fd9"`
    );
    await queryRunner.query(
      `ALTER TABLE "pedido_producto" DROP CONSTRAINT "FK_421bfaaa0af9cb66b544e3153a0"`
    );
    await queryRunner.query(
      `ALTER TABLE "pedido_producto" DROP CONSTRAINT "FK_3d683a14b23ae2025106e902427"`
    );
    await queryRunner.query(
      `ALTER TABLE "pedido_usuario_linea" DROP CONSTRAINT "FK_152434b3e2e20e850567fed3a58"`
    );
    await queryRunner.query(
      `ALTER TABLE "pedido_usuario_linea" DROP CONSTRAINT "FK_ccc9ff398bd7a1d8033bb7de00f"`
    );
    await queryRunner.query(
      `ALTER TABLE "pedido_usuario" DROP CONSTRAINT "FK_57e60878eac7fdeddf1ba345122"`
    );
    await queryRunner.query(
      `ALTER TABLE "producto_proveedor" DROP CONSTRAINT "FK_9e66fbc60135bb0a2b5d45cbb4f"`
    );
    await queryRunner.query(
      `ALTER TABLE "producto_proveedor" DROP CONSTRAINT "FK_7587673df9ed2964d7fa4a24124"`
    );
    await queryRunner.query(
      `ALTER TABLE "historial_precio" DROP CONSTRAINT "FK_167351b501de3a9bbda86e32616"`
    );
    await queryRunner.query(
      `ALTER TABLE "inventario" DROP CONSTRAINT "FK_6d9c5c09e5fc8a7d675e5be8aa4"`
    );
    await queryRunner.query(
      `ALTER TABLE "inventario" DROP CONSTRAINT "FK_51b8f559ad2d145c83f882bad88"`
    );
    await queryRunner.query(
      `ALTER TABLE "merma" DROP CONSTRAINT "FK_e6afa3b841aa0bf071af5a07823"`
    );
    await queryRunner.query(
      `ALTER TABLE "merma" DROP CONSTRAINT "FK_7f0c639a18360c2d62aa8736758"`
    );
    await queryRunner.query(
      `ALTER TABLE "producto_alergeno" DROP CONSTRAINT "FK_bc3e25a49feddab9251f9673529"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ac8911cd54a61461c992654140"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_29e9a9079c7ba01c1b301cf555"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3c476728351cd2f8f875ceb32e"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c59b6b0fee02257a3e1ca75c47"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9cd0dc105cca3b3680681e727f"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_748ced9aed467c34dfd03acdce"`
    );
    await queryRunner.query(`DROP INDEX "public"."idx_usuario_rol_activo"`);
    await queryRunner.query(
      `ALTER TABLE "plantilla_rol_permiso" DROP COLUMN "asignado_en"`
    );
    await queryRunner.query(
      `ALTER TABLE "rol_permiso" DROP COLUMN "asignado_por"`
    );
    await queryRunner.query(
      `ALTER TABLE "rol_permiso" DROP COLUMN "asignado_en"`
    );
    await queryRunner.query(`ALTER TABLE "usuario_rol" DROP COLUMN "activo"`);
    await queryRunner.query(
      `ALTER TABLE "usuario_rol" DROP COLUMN "asignado_por"`
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_rol" DROP COLUMN "asignado_en"`
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_rol" ADD "activo" boolean NOT NULL DEFAULT true`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_usuario_rol_activo" ON "usuario_rol" ("activo") `
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_rol" ADD "asignado_por" uuid`
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_rol" ADD "asignado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "rol_permiso" ADD "asignado_por" uuid`
    );
    await queryRunner.query(
      `ALTER TABLE "rol_permiso" ADD "asignado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "plantilla_rol_permiso" ADD "asignado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e9e538ec5acb79fcd237836849"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_23c8ffbff595a8b728cb8b96ae"`
    );
    await queryRunner.query(`DROP TABLE "usuario_permiso_excluido"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_438f6f178dcd10ba608245d8a8"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b7fec64c27926c73e4bc4a0fd9"`
    );
    await queryRunner.query(`DROP TABLE "usuario_permiso_adicional"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_445a98d2e31719542ca3369c71"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1198981166f140fb44f6aeda8b"`
    );
    await queryRunner.query(`DROP TABLE "incidencia_resuelta"`);
    await queryRunner.query(
      `DROP TYPE "public"."incidencia_resuelta_tipo_resolucion_enum"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_229516cf91339177d70f1baaaf"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_82bcc3688713572e34e15c1d05"`
    );
    await queryRunner.query(`DROP TABLE "pedido_draft"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_plantilla_permiso_plantilla"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_plantilla_permiso_permiso"`
    );
    await queryRunner.query(`DROP TABLE "plantilla_rol_permiso"`);
    await queryRunner.query(`DROP TABLE "preparacion"`);
    await queryRunner.query(`DROP TYPE "public"."preparacion_estado_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2ece75142aa08636f2dd56b440"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ee625eb3f20055fd081c92350a"`
    );
    await queryRunner.query(`DROP TABLE "recepcion_draft"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fa820d7b2fa7f242a8d6ec2d90"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2224301d51d481df79857e3815"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6711682cf29ceded805aac284b"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_505dcdcd22e7e70500fca3aceb"`
    );
    await queryRunner.query(`DROP TABLE "produccion_lote"`);
    await queryRunner.query(`DROP TYPE "public"."produccion_lote_estado_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c1c8bde7245c6d026d85fa358e"`
    );
    await queryRunner.query(`DROP TABLE "receta"`);
    await queryRunner.query(
      `DROP TYPE "public"."receta_unidad_resultado_enum"`
    );
    await queryRunner.query(`DROP TYPE "public"."dificultad_receta_enum"`);
    await queryRunner.query(`DROP TABLE "receta_ingrediente"`);
    await queryRunner.query(
      `DROP TYPE "public"."receta_ingrediente_unidad_enum"`
    );
    await queryRunner.query(`DROP INDEX "public"."idx_rol_permiso_rol"`);
    await queryRunner.query(`DROP INDEX "public"."idx_rol_permiso_permiso"`);
    await queryRunner.query(`DROP TABLE "rol_permiso"`);
    await queryRunner.query(`DROP INDEX "public"."idx_usuario_rol_usuario"`);
    await queryRunner.query(`DROP INDEX "public"."idx_usuario_rol_rol"`);
    await queryRunner.query(`DROP INDEX "public"."idx_usuario_rol_activo"`);
    await queryRunner.query(`DROP TABLE "usuario_rol"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6ccff37176a6978449a99c82e1"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2863682842e688ca198eb25c12"`
    );
    await queryRunner.query(`DROP INDEX "public"."idx_usuario_status"`);
    await queryRunner.query(`DROP TABLE "usuario"`);
    await queryRunner.query(`DROP TYPE "public"."usuario_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."usuario_rol_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_rol_nombre"`);
    await queryRunner.query(`DROP INDEX "public"."idx_rol_activo"`);
    await queryRunner.query(`DROP TABLE "rol"`);
    await queryRunner.query(`DROP INDEX "public"."idx_permiso_codigo"`);
    await queryRunner.query(`DROP INDEX "public"."idx_permiso_modulo"`);
    await queryRunner.query(`DROP INDEX "public"."idx_permiso_activo"`);
    await queryRunner.query(`DROP TABLE "permiso"`);
    await queryRunner.query(`DROP INDEX "public"."idx_plantilla_nombre"`);
    await queryRunner.query(`DROP INDEX "public"."idx_plantilla_activo"`);
    await queryRunner.query(`DROP TABLE "plantilla_rol"`);
    await queryRunner.query(`DROP INDEX "public"."idx_profesor_user"`);
    await queryRunner.query(`DROP TABLE "profesor"`);
    await queryRunner.query(`DROP INDEX "public"."idx_alumno_user"`);
    await queryRunner.query(`DROP TABLE "alumno"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_slot_profesor_aula_clase"`
    );
    await queryRunner.query(`DROP TABLE "alumno_slot"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6389bd3aaa9f0acbae746ae732"`
    );
    await queryRunner.query(`DROP TABLE "archivo"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1cc85f3409fa42b33ce52d8975"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d5ba7acb558e7acd7fcef55dfb"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6915a1703d4608308507b17197"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_91ee335adf4aff70d9a95c3000"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3312757621191da88e0af84137"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_46b3c1c6a31b3b0ee001df7888"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4fc1d76faf193b83d37ae29fa2"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3e838175798a028c27ca686ca2"`
    );
    await queryRunner.query(`DROP TABLE "movimiento"`);
    await queryRunner.query(`DROP TYPE "public"."movimiento_tipo_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6b5d81373095626e1c70eb2273"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a0b2ad3f5f476a2b8024d5402a"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e90ac11f55ee175bf0e754b407"`
    );
    await queryRunner.query(`DROP TABLE "recepcion"`);
    await queryRunner.query(`DROP TYPE "public"."recepcion_estado_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4b593021de092d8e1a6d02e8cd"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b0f146177ebdc8c20aaf1d27a6"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a80ab4fe55d3cf775839248660"`
    );
    await queryRunner.query(`DROP TABLE "recepcion_producto"`);
    await queryRunner.query(
      `DROP TYPE "public"."recepcion_producto_estado_producto_enum"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3001265b19773eb9d66e0d3612"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7e44b7fd67f2ba738e201820e0"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_807e1989e29cc1c12a249c90e9"`
    );
    await queryRunner.query(`DROP TABLE "incidencia"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c3124f5ecd068aa12d05c6c623"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b30e4a5cbad7750650ca806bfe"`
    );
    await queryRunner.query(`DROP TABLE "incidencia_linea"`);
    await queryRunner.query(
      `DROP TYPE "public"."incidencia_linea_estado_reclamacion_enum"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."incidencia_linea_tipo_diferencia_enum"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_42686443478f10158bf2d0b414"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ed26b758c3765cb49876275cc2"`
    );
    await queryRunner.query(`DROP TABLE "recepcion_pedido"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e7038c3a7398fcd951fac49956"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_664fb648b17b03aecc5639284e"`
    );
    await queryRunner.query(`DROP TABLE "albaran_pedido_recepcion"`);
    await queryRunner.query(`DROP INDEX "public"."idx_albaran_n_albaran"`);
    await queryRunner.query(`DROP INDEX "public"."idx_albaran_fecha"`);
    await queryRunner.query(`DROP TABLE "albaran"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e93275d2baa8aa95b46e729659"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_076f2a4e67d5232136ed070884"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8c70086d2133fed1dcadc0e903"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a76ebc7864e48113c6b27cf47a"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b99552b8d2f8a4f7cb137838ae"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_086666189136207ffa3568ae79"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cb62b189425f2ca829b2b6aed0"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fc44cd8f26d8772b414c97e2f2"`
    );
    await queryRunner.query(`DROP TABLE "pedido"`);
    await queryRunner.query(`DROP TYPE "public"."estado_pedido"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3ceb56c7dee6bff4e6537830bd"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bd18dc8b8e9514061f1e1d2a5d"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f64cb01481764f206dfdc5cf6f"`
    );
    await queryRunner.query(`DROP TABLE "purchase_batch"`);
    await queryRunner.query(`DROP TYPE "public"."purchase_batch_estado_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3d683a14b23ae2025106e90242"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_421bfaaa0af9cb66b544e3153a"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a4d3381551b984299309fe45fd"`
    );
    await queryRunner.query(`DROP TABLE "pedido_producto"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ccc9ff398bd7a1d8033bb7de00"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_152434b3e2e20e850567fed3a5"`
    );
    await queryRunner.query(`DROP TABLE "pedido_usuario_linea"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_57e60878eac7fdeddf1ba34512"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_66d0393a45c13673fbcc56c516"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4bd4760f556f0b9617306ed845"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_34dc773462666496d3bedd539f"`
    );
    await queryRunner.query(`DROP TABLE "pedido_usuario"`);
    await queryRunner.query(`DROP TYPE "public"."estado_pedido_usuario"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7587673df9ed2964d7fa4a2412"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9e66fbc60135bb0a2b5d45cbb4"`
    );
    await queryRunner.query(`DROP TABLE "producto_proveedor"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_167351b501de3a9bbda86e3261"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d809420cff80a38ef063cf158f"`
    );
    await queryRunner.query(`DROP TABLE "historial_precio"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_51b8f559ad2d145c83f882bad8"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6d9c5c09e5fc8a7d675e5be8aa"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b058eaa68bbaf8e9fa98d27d16"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9e0f1ec638a8cb2c681ee2297a"`
    );
    await queryRunner.query(`DROP TABLE "inventario"`);
    await queryRunner.query(`DROP TABLE "ubicacion"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0b402d9d1ecd20001e5fd310fd"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0ead73e80c85c4eaf267b191df"`
    );
    await queryRunner.query(`DROP TABLE "proveedor"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d86d179360134b4b74bda75066"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bd23c8bcd2ec20dbeff299d241"`
    );
    await queryRunner.query(`DROP TABLE "producto"`);
    await queryRunner.query(`DROP TYPE "public"."producto_tipo_enum"`);
    await queryRunner.query(`DROP TYPE "public"."producto_unidad_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7f0c639a18360c2d62aa873675"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b41b9238cd076cddeee696f105"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a31ee0c37aeb524da1f43a5b72"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e6afa3b841aa0bf071af5a0782"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a7ae848f42dea18368fe40211f"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_60ae0107c6481403f87fe8ace2"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_17667704858947b4c4c6d3f429"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ce20a05544fcee5736267801ee"`
    );
    await queryRunner.query(`DROP TABLE "merma"`);
    await queryRunner.query(`DROP TYPE "public"."merma_tipo_enum"`);
    await queryRunner.query(`DROP TYPE "public"."merma_motivo_enum"`);
    await queryRunner.query(`DROP TABLE "producto_alergeno"`);
    await queryRunner.query(
      `DROP TYPE "public"."producto_alergeno_alergeno_enum"`
    );
  }
}
