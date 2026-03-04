 # Guía de TypeORM en Smart-Economat-Backend

 Esta guía detalla cómo trabajar con TypeORM en nuestro proyecto NestJS, incluyendo la creación de entidades, configuración de módulos, validaciones, seeders y buenas prácticas. Está pensada para que cualquier desarrollador pueda añadir o modificar funcionalidades relacionadas con la base de datos sin dudas.

 ## 1. Estructura del proyecto

 ```
 .
 ├── package.json
 ├── tsconfig.json
 ├── src
 │   ├── app.module.ts
 │   ├── main.ts
 │   ├── modules
 │   │   └── <feature>
 │   │       ├── <feature>.module.ts
 │   │       ├── controllers
 │   │       │   └── <feature>.controller.ts
 │   │       ├── services
 │   │       │   └── <feature>.service.ts
 │   │       ├── <entity>.entity
 │   │       │   └── <entity>.entity.ts
 │   │       └── enums
 │   │           └── <feature>.enum.ts
 │   └── seeders
 │       ├── seed.ts
 │       └── <feature>.seeder.ts
 └── .env
 ```

 - **src/app.module.ts**: Configuración global de Nest y TypeORM.
 - **src/modules/**: Cada carpeta es un módulo de dominio (feature) con sus entidades, controladores y servicios.
 - **src/seeders/**: Runner y seeders individuales para poblar la base de datos.
 - **.env**: Variables de entorno necesarias.

 ## 2. Variables de entorno

 Definir en `.env` (a nivel raíz):
 ```env
 POSTGRES_HOST=localhost
 DB_PORT=5432
 POSTGRES_USER=usuario
 POSTGRES_PASSWORD=secreto
 POSTGRES_DB=nombre_bd
 DB_SYNC=true        # 'true' para sincronizar entidades (dev), 'false' en prod
 PORT=3001           # Puerto de la API
 ```

 ## 3. Configuración de TypeORM

 ### 3.1 En `src/app.module.ts`
 ```ts
 import { TypeOrmModule } from '@nestjs/typeorm';
 import { ConfigModule, ConfigService } from '@nestjs/config';

 @Module({
   imports: [
     ConfigModule.forRoot({ isGlobal: true }),
     TypeOrmModule.forRootAsync({
       imports: [ConfigModule],
       inject: [ConfigService],
       useFactory: (cs: ConfigService) => ({
         type: 'postgres',
         host: cs.get('POSTGRES_HOST'),
         port: +cs.get<number>('DB_PORT'),
         username: cs.get('POSTGRES_USER'),
         password: cs.get('POSTGRES_PASSWORD'),
         database: cs.get('POSTGRES_DB'),
         synchronize: cs.get('DB_SYNC') === 'true',
         entities: [__dirname + '/**/*.entity.{ts,js}'],
       }),
     }),
     // ... otros módulos
   ],
 })
 export class AppModule {}
 ```

 ### 3.2 En seeders (`src/seeders/seed.ts`)
 ```ts
 export const dataSource = new DataSource({
  type: 'postgres',
  host: cs.get('POSTGRES_HOST'),
  port: +cs.get<number>('DB_PORT'),
  username: cs.get('POSTGRES_USER'),
  password: cs.get('POSTGRES_PASSWORD'),
  database: cs.get('POSTGRES_DB'),
  entities: [join(__dirname, '../**/*.entity.{ts,js}')],
  synchronize: cs.get('DB_SYNC') === 'true',
});
 ```

 ## 4. Generación de módulos, controladores y servicios

 Usando Nest CLI:
 ```bash
 # Generar un nuevo módulo de 'usuarios'
 nest g module modules/usuarios

 # Generar controlador y servicio dentro del módulo
 nest g controller modules/usuarios/controllers/usuarios --no-spec
 nest g service modules/usuarios/services/usuarios --no-spec
 ```

 ## 5. Creación de entidades

 1. Crear carpeta de entidad: `src/modules/<feature>/<entity>.entity/`
 2. Archivo `<entity>.entity.ts` con formato:
    ```ts
    import { Entity, PrimaryGeneratedColumn, Column, /* relaciones */ } from 'typeorm';

    @Entity('<nombre_tabla>')
    export class <EntityName>Entity {
      @PrimaryGeneratedColumn('uuid', { name: 'id_<feature>' })
      id: string;

      @Column({ type: 'varchar', length: 100, nullable: false })
      campo: string;
      // ... más columnas y decoradores
    }
    ```
 3. Convención de nombres:
    - Clases: `PascalCase` con sufijo `Entity`.
    - Tablas y columnas: `snake_case`.
    - File: `<entidad>.entity.ts`.

 ## 6. Configuración de módulos para TypeORM

 En `modules/<feature>/<feature>.module.ts`:
 ```ts
 import { Module } from '@nestjs/common';
 import { TypeOrmModule } from '@nestjs/typeorm';
 import { <EntityOne>Entity } from './<entity-one>.entity/<entity-one>.entity';
 import { <EntityTwo>Entity } from './<entity-two>.entity/<entity-two>.entity';
 import { <Feature>Service } from './services/<feature>.service';
 import { <Feature>Controller } from './controllers/<feature>.controller';

 @Module({
   imports: [TypeOrmModule.forFeature([<EntityOne>Entity, <EntityTwo>Entity])],
   providers: [<Feature>Service],
   controllers: [<Feature>Controller],
   exports: [<Feature>Service],
 })
 export class <Feature>Module {}
 ```

 ## 7. Relaciones entre entidades

 - OneToMany / ManyToOne:
   ```ts
   @OneToMany(() => ChildEntity, child => child.parent, { cascade: true })
   children: ChildEntity[];
   
   @ManyToOne(() => ParentEntity, parent => parent.children, { onDelete: 'CASCADE' })
   @JoinColumn({ name: 'id_parent' })
   parent: ParentEntity;
   ```
 - Muchos a muchos: usar `@ManyToMany` y tabla intermedia o `@JoinTable()`.

 ## 8. Migraciones (recomendado en producción)

 1. Crear archivo `data-source.ts` en la raíz con la configuración.
 2. Instalar CLI de TypeORM: `npm install typeorm --save-dev`
 3. Generar migración:
    ```bash
    npx typeorm migration:generate -d ./data-source.ts NombreMigracion
    ```
 4. Ejecutar migraciones:
    ```bash
    npx typeorm migration:run -d ./data-source.ts
    ```

 ## 9. Seeders

 - **Ubicación**: `src/seeders/`.
 - **Runner**: `seed.ts` detecta archivos `*.seeder.ts` o `*.seeder.js` y ejecuta `runSeeder(dataSource)`.
 - **Definir un seeder** en `<feature>.seeder.ts`:
   ```ts
   export const runSeeder = async (ds: DataSource) => {
     const repo = ds.getRepository(<Entity>);
     const items = [/* ... crear entidades ... */];
     await repo.save(items);
   };
   ```
 - **Scripts en package.json**:
   ```json
   {
     "scripts": {
       "seed": "ts-node -r tsconfig-paths/register -r dotenv/config src/seeders/seed.ts",
       "seed:<name>": "ts-node -r tsconfig-paths/register -r dotenv/config src/seeders/seed.ts <name>"
     }
   }
   ```
 - **Ejecutar**:
   ```bash
   npm run seed         # Todos los seeders
   npm run seed:pedido  # Solo el seeder 'pedido'
   ```

 ## 10. Validaciones (class-validator)

 1. Crear **DTOs** en `modules/<feature>/dto/`:
    ```ts
    import { IsString, IsNotEmpty } from 'class-validator';

    export class Create<Feature>Dto {
      @IsString()
      @IsNotEmpty()
      nombre: string;
    }
    ```
 2. En `main.ts`, habilitar pipes globales:
    ```ts
    import { ValidationPipe } from '@nestjs/common';
    
    async function bootstrap() {
      const app = await NestFactory.create(AppModule);
      app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
      await app.listen(process.env.PORT || 3001);
    }
    ```

 ## 11. Buenas prácticas

 - **Evitar `synchronize: true` en producción**; usar migraciones.
 - **Nombrar consistentemente** (snake_case en BD, PascalCase en clases).
 - **Separar responsabilidades**: DTOs, entidades, servicios.
 - **Control de versiones** en migraciones y seeders.
 - **Limpiar datos sensibles**: nunca exponer contraseñas en código.

 ## 12. Referencias

 - NestJS · TypeORM: https://docs.nestjs.com/techniques/database
 - TypeORM Documentation: https://typeorm.io/
 - class-validator: https://github.com/typestack/class-validator
 - NestJS CLI: https://docs.nestjs.com/cli/overview