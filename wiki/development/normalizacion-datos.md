# 📋 Guía de Normalización de Datos

## 🎯 Objetivo

Implementar la normalización **absoluta de todos los datos recibidos desde el frontend** en cualquier endpoint del backend, siguiendo la arquitectura y flujos existentes, con cambios mínimos y reutilizando lógica actual.

---

## 📌 Principios de Normalización

### ¿Qué es la Normalización?

La normalización es el proceso de transformar los datos recibidos del frontend a un formato estándar y consistente **antes** de cualquier validación u operación de negocio.

### ¿Por qué Normalizar?

1. **Consistencia**: Garantiza que todos los datos sigan el mismo formato
2. **Seguridad**: Previene inyección de datos malformados
3. **Validación**: Facilita validaciones estrictas y predecibles
4. **Mantenibilidad**: Centraliza la lógica de transformación de datos

---

## 🏗️ Arquitectura de Normalización

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND REQUEST                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  1. NORMALIZACIÓN AUTOMÁTICA (class-transformer)            │
│     - Trim de strings                                       │
│     - Conversión de tipos (string → number, boolean, Date)  │
│     - Mayúsculas/minúsculas                                 │
│     - Arrays y objetos anidados                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  2. VALIDACIÓN ESTRICTA (class-validator)                   │
│     - @IsString(), @IsNumber(), @IsBoolean()                │
│     - @IsNotEmpty(), @IsOptional()                          │
│     - @Min(), @Max(), @MaxLength()                          │
│     - @IsEnum(), @IsUUID(), @IsEmail()                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  3. PROCESAMIENTO DE NEGOCIO (Services)                     │
│     - Datos ya normalizados y validados                     │
│     - Transacciones con queryRunner                         │
│     - Logs y excepciones claras                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  4. PERSISTENCIA (TypeORM Repositories)                     │
│     - Datos listos para guardar                             │
│     - Sin transformaciones adicionales                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Componentes de Normalización

### 1. Transformers (`src/common/transformers/`)

Los transformers son funciones puras que transforman los datos antes de la validación.

#### Transformers Disponibles

| Transformer | Descripción | Ejemplo de Uso |
|------------|-------------|----------------|
| `TrimStringTransformer` | Elimina espacios al inicio/final de strings | `@Transform(TrimStringTransformer.transform)` |
| `UppercaseStringTransformer` | Convierte a mayúsculas con trim | `@Transform(UppercaseStringTransformer.transform)` |
| `LowercaseStringTransformer` | Convierte a minúsculas con trim | `@Transform(LowercaseStringTransformer.transform)` |
| `StringToNumberTransformer` | Convierte strings a números | `@Transform(StringToNumberTransformer.transform)` |
| `StringToBooleanTransformer` | Convierte strings a booleanos | `@Transform(StringToBooleanTransformer.transform)` |
| `StringToDateTransformer` | Convierte strings a Dates | `@Transform(StringToDateTransformer.transform)` |
| `NormalizeArrayTransformer` | Normaliza arrays | `@Transform(NormalizeArrayTransformer.transform)` |

#### Ejemplo de Uso en DTO

```typescript
import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { LowercaseStringTransformer } from '../../../common/transformers/lowercase-string.transformer';

export class CreateUsuarioDto {
  @Transform(TrimStringTransformer.transform)
  @IsString()
  @IsNotEmpty()
  username!: string;

  @Transform(LowercaseStringTransformer.transform)
  @IsEmail()
  email?: string;
}
```

---

### 2. Decoradores de Normalización (`src/common/decorators/normalize.decorator.ts`)

Decoradores simplificados para casos comunes de normalización.

#### Decoradores Disponibles

| Decorador | Descripción | Equivalente |
|-----------|-------------|-------------|
| `@Trim()` | Aplica trim a strings | `@Transform(TrimStringTransformer.transform)` |
| `@ToUppercase()` | Mayúsculas con trim | `@Transform(UppercaseStringTransformer.transform)` |
| `@ToLowercase()` | Minúsculas con trim | `@Transform(LowercaseStringTransformer.transform)` |
| `@NormalizeNumber()` | Convierte a número | `@Transform(StringToNumberTransformer.transform)` |
| `@NormalizeBoolean()` | Convierte a booleano | `@Transform(StringToBooleanTransformer.transform)` |
| `@NormalizeDate()` | Convierte a Date | `@Transform(StringToDateTransformer.transform)` |
| `@NormalizeArray()` | Normaliza array | `@Transform(NormalizeArrayTransformer.transform)` |

#### Ejemplo de Uso

```typescript
import { 
  Trim, 
  ToLowercase, 
  NormalizeNumber, 
  NormalizeDate 
} from '../../../common/decorators/normalize.decorator';

export class CreateProductoDto {
  @Trim()
  nombre: string;

  @ToLowercase()
  email: string;

  @NormalizeNumber()
  precio: number;

  @NormalizeDate()
  fechaCaducidad: Date;
}
```

---

### 3. Pipes de Normalización (`src/common/pipes/`)

Los pipes se ejecutan a nivel de controller para normalización global.

#### NormalizeDataPipe

Pipe global que se ejecuta automáticamente en todos los endpoints gracias a la configuración en `main.ts`.

```typescript
// En main.ts
app.useGlobalPipes(
  new I18nValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  })
);
```

---

## 📝 Convenciones de Normalización por Tipo de Dato

### Strings

```typescript
// ✅ CORRECTO - Todos los strings deben tener trim
@Transform(TrimStringTransformer.transform)
@IsString()
@IsNotEmpty()
nombre: string;

// ✅ CORRECTO - Emails en minúsculas
@Transform(LowercaseStringTransformer.transform)
@IsEmail()
email: string;

// ✅ CORRECTO - Códigos en mayúsculas
@Transform(UppercaseStringTransformer.transform)
@IsString()
@Matches(/^[A-Z0-9]+$/)
codigo: string;
```

### Números

```typescript
// ✅ CORRECTO - Números con conversión desde string
@Type(() => Number)
@Transform(StringToNumberTransformer.transform)
@IsNumber()
@Min(0)
precio: number;

// ✅ CORRECTO - Enteros
@Type(() => Number)
@Transform(StringToNumberTransformer.transform)
@IsInt()
@Min(1)
cantidad: number;
```

### Fechas

```typescript
// ✅ CORRECTO - Fechas desde string ISO
@Type(() => Date)
@Transform(StringToDateTransformer.transform)
@IsDate()
fechaCaducidad: Date;

// ✅ CORRECTO - Fechas como string ISO (para APIs)
@Transform(StringToDateTransformer.transform)
@IsDateString()
fechaEntrega: string;
```

### Booleanos

```typescript
// ✅ CORRECTO - Booleanos con conversión
@Transform(StringToBooleanTransformer.transform)
@IsBoolean()
activo: boolean;
```

### Arrays

```typescript
// ✅ CORRECTO - Arrays normalizados
@IsArray()
@ValidateNested({ each: true })
@Type(() => ItemDto)
items: ItemDto[];

// ✅ CORRECTO - Arrays de enums
@IsArray()
@IsEnum(Alergeno, { each: true })
alergenos: Alergeno[];
```

---

## 🔄 Flujo Completo de Normalización

### Ejemplo: Crear Usuario

#### 1. Request del Frontend

```json
{
  "username": "  JuanPerez  ",
  "email": "  JUAN.PEREZ@EXAMPLE.COM  ",
  "password": "SecurePass123!",
  "rol": "USER",
  "status": "ACTIVE"
}
```

#### 2. Después de Normalización (DTO)

```typescript
{
  username: "JuanPerez",           // Trim aplicado
  email: "juan.perez@example.com", // Trim + lowercase
  password: "SecurePass123!",      // Sin cambios
  rol: "USER",                     // Enum validado
  status: "ACTIVE"                 // Enum validado
}
```

#### 3. Después de Validación

```typescript
// class-validator verifica:
// - username: string, no vacío, max 100 chars ✅
// - email: email válido, max 255 chars ✅
// - password: strong password ✅
// - rol: enum válido ✅
// - status: enum válido ✅
```

#### 4. En el Servicio

```typescript
async create(dto: CreateUsuarioDto) {
  // Los datos YA están normalizados y validados
  // No se necesita transformación adicional
  
  return this.usuarioRepo.createUsuario(dto);
}
```

---

## 📚 Ejemplos por Módulo

### Módulo Usuario

```typescript
import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { LowercaseStringTransformer } from '../../../common/transformers/lowercase-string.transformer';

export class CreateUsuarioDto {
  @Transform(TrimStringTransformer.transform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  username!: string;

  @Transform(LowercaseStringTransformer.transform)
  @IsEmail()
  email?: string | null;

  @IsEnum(rolUsuario)
  rol!: rolUsuario;
}
```

### Módulo Producto

```typescript
import { Transform, Type } from 'class-transformer';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { UppercaseStringTransformer } from '../../../common/transformers/uppercase-string.transformer';
import { StringToDateTransformer } from '../../../common/transformers/string-to-date.transformer';

export class CreateProductoDto {
  @Transform(TrimStringTransformer.transform)
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @Transform(TrimStringTransformer.transform)
  @IsString()
  @IsOptional()
  marca?: string;

  @Transform(UppercaseStringTransformer.transform)
  @IsString()
  @Matches(/^\d{13}$/)
  codigoBarras?: string;

  @Transform(StringToDateTransformer.transform)
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  fechaCaducidad?: Date;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  contenido!: number;
}
```

### Módulo Recepción (Complejo)

```typescript
export class CreateRecepcionDto {
  @Transform(TrimStringTransformer.transform)
  @IsString()
  @IsOptional()
  nAlbaran?: string;

  @Transform(StringToDateTransformer.transform)
  @Type(() => Date)
  @IsOptional()
  fechaRecepcion?: Date;

  @Transform(TrimStringTransformer.transform)
  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecepcionLineDto)
  productos: RecepcionLineDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductoNuevoRecepcionDto)
  @IsOptional()
  productosNuevos?: ProductoNuevoRecepcionDto[];
}
```

---

## ⚠️ Errores Comunes a Evitar

### ❌ INCORRECTO - Sin normalización

```typescript
export class CreateUsuarioDto {
  @IsString()
  username: string;  // ¿Qué pasa si viene con espacios?
}
```

### ✅ CORRECTO - Con normalización

```typescript
export class CreateUsuarioDto {
  @Transform(TrimStringTransformer.transform)
  @IsString()
  username: string;  // Siempre sin espacios
}
```

### ❌ INCORRECTO - Validación antes de transformación

```typescript
// El orden de los decoradores importa
@IsEmail()
@Transform(LowercaseStringTransformer.transform)  // ❌ Demasiado tarde
email: string;
```

### ✅ CORRECTO - Transformación antes de validación

```typescript
// Primero transformar, luego validar
@Transform(LowercaseStringTransformer.transform)
@IsEmail()  // ✅ Valida el email ya transformado
email: string;
```

### ❌ INCORRECTO - Sin Type para números/fechas

```typescript
@IsNumber()
precio: number;  // ❌ Puede fallar si viene como string

@IsDate()
fecha: Date;  // ❌ Puede fallar si viene como string ISO
```

### ✅ CORRECTO - Con Type para conversión

```typescript
@Type(() => Number)
@IsNumber()
precio: number;  // ✅ Convierte string a number

@Type(() => Date)
@IsDate()
fecha: Date;  // ✅ Convierte string ISO a Date
```

---

## 🔧 Configuración Global

### main.ts

La normalización está configurada globalmente en `main.ts`:

```typescript
app.useGlobalPipes(
  new I18nValidationPipe({
    whitelist: true,              // Elimina propiedades no definidas en el DTO
    forbidNonWhitelisted: true,   // Lanza error si hay propiedades extra
    transform: true,              // Habilita transformación automática
    transformOptions: {
      enableImplicitConversion: true,  // Conversión implícita de tipos
    },
  })
);
```

---

## 📖 Mejores Prácticas

### 1. **Siempre usar @Transform antes de @Is***

```typescript
// ✅ CORRECTO
@Transform(TrimStringTransformer.transform)
@IsString()
@IsNotEmpty()
nombre: string;
```

### 2. **Usar @Type para números y fechas**

```typescript
// ✅ CORRECTO
@Type(() => Number)
@IsNumber()
precio: number;

@Type(() => Date)
@IsDate()
fecha: Date;
```

### 3. **Normalizar strings anidados en objetos**

```typescript
// ✅ CORRECTO - Objetos anidados también normalizados
export class RecepcionLineDto {
  @Transform(TrimStringTransformer.transform)
  @IsString()
  observaciones?: string;
}

export class CreateRecepcionDto {
  @ValidateNested({ each: true })
  @Type(() => RecepcionLineDto)
  productos: RecepcionLineDto[];  // Cada línea se normaliza
}
```

### 4. **Documentar con Swagger**

```typescript
// ✅ CORRECTO - Documentación clara
@ApiProperty({
  description: 'Nombre del producto (sin espacios extra)',
  example: 'Tomate Frito',
})
@Transform(TrimStringTransformer.transform)
@IsString()
nombre: string;
```

### 5. **Usar i18n para mensajes de error**

```typescript
// ✅ CORRECTO - Mensajes en español/inglés
@IsString({
  message: i18nValidationMessage('validation.EL_NOMBRE_DEBE_SER_UNA_CADENA'),
})
nombre: string;
```

---

## 🧪 Testing

### Test Unitarios de DTOs

```typescript
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUsuarioDto } from './create-usuario.dto';

describe('CreateUsuarioDto', () => {
  it('debería normalizar username con trim', async () => {
    const dto = plainToInstance(CreateUsuarioDto, {
      username: '  JuanPerez  ',
      email: '  JUAN@EXAMPLE.COM  ',
      password: 'SecurePass123!',
      rol: 'USER',
      status: 'ACTIVE',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.username).toBe('JuanPerez');
    expect(dto.email).toBe('juan@example.com');
  });
});
```

---

## 📊 Checklist de Normalización

Al crear o actualizar un DTO, verifica:

- [ ] ¿Todos los strings tienen `@Transform(TrimStringTransformer.transform)`?
- [ ] ¿Los emails tienen `@Transform(LowercaseStringTransformer.transform)`?
- [ ] ¿Los códigos tienen `@Transform(UppercaseStringTransformer.transform)` si aplica?
- [ ] ¿Los números tienen `@Type(() => Number)` y `@Transform(StringToNumberTransformer.transform)`?
- [ ] ¿Las fechas tienen `@Type(() => Date)` y `@Transform(StringToDateTransformer.transform)`?
- [ ] ¿Los booleanos tienen `@Transform(StringToBooleanTransformer.transform)`?
- [ ] ¿Los arrays tienen `@ValidateNested({ each: true })` y `@Type()`?
- [ ] ¿Todas las validaciones tienen mensajes i18n?
- [ ] ¿El orden de decoradores es correcto (Transform antes que Is*)?
- [ ] ¿Está documentado con Swagger (@ApiProperty)?

---

## 🚀 Migración de DTOs Existentes

Para actualizar DTOs existentes con normalización:

### Paso 1: Identificar campos a normalizar

```typescript
// ANTES
export class CreateProductoDto {
  @IsString()
  nombre: string;

  @IsNumber()
  precio: number;
}
```

### Paso 2: Agregar transformers

```typescript
// DESPUÉS
import { Transform, Type } from 'class-transformer';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { StringToNumberTransformer } from '../../../common/transformers/string-to-number.transformer';

export class CreateProductoDto {
  @Transform(TrimStringTransformer.transform)
  @IsString()
  nombre: string;

  @Type(() => Number)
  @Transform(StringToNumberTransformer.transform)
  @IsNumber()
  precio: number;
}
```

---

## 📞 Soporte

Para dudas o problemas con la normalización:

1. Revisa esta documentación
2. Consulta los DTOs de ejemplo en `src/modules/`
3. Revisa los tests e2e para casos de uso reales

---

## 📝 Resumen

| Componente | Ubicación | Propósito |
|------------|-----------|-----------|
| Transformers | `src/common/transformers/` | Funciones de transformación puras |
| Decoradores | `src/common/decorators/normalize.decorator.ts` | Decoradores simplificados |
| Pipes | `src/common/pipes/` | Pipes de normalización global |
| DTOs | `src/modules/*/dto/` | DTOs con normalización aplicada |
| i18n | `src/i18n/*/translation.json` | Mensajes de error traducidos |

---

**Implementado siguiendo la arquitectura existente con cambios mínimos y máxima reutilización.**
