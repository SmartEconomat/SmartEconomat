# 🚀 Normalización de Datos - Quick Reference

## Uso Rápido

### 1. Strings con Trim

```typescript
import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';

@Transform(TrimStringTransformer.transform)
@IsString()
nombre: string;
```

### 2. Email en Minúsculas

```typescript
import { LowercaseStringTransformer } from '../../../common/transformers/lowercase-string.transformer';

@Transform(LowercaseStringTransformer.transform)
@IsEmail()
email: string;
```

### 3. Números

```typescript
import { Type, Transform } from 'class-transformer';
import { StringToNumberTransformer } from '../../../common/transformers/string-to-number.transformer';

@Type(() => Number)
@Transform(StringToNumberTransformer.transform)
@IsNumber()
precio: number;
```

### 4. Fechas

```typescript
import { Type, Transform } from 'class-transformer';
import { StringToDateTransformer } from '../../../common/transformers/string-to-date.transformer';

@Type(() => Date)
@Transform(StringToDateTransformer.transform)
@IsDate()
fecha: Date;
```

### 5. Booleanos

```typescript
import { Transform } from 'class-transformer';
import { StringToBooleanTransformer } from '../../../common/transformers/string-to-boolean.transformer';

@Transform(StringToBooleanTransformer.transform)
@IsBoolean()
activo: boolean;
```

## Decoradores Simplificados

```typescript
import {
  Trim,
  ToLowercase,
  ToUppercase,
  NormalizeNumber,
  NormalizeBoolean,
  NormalizeDate,
} from '../../../common/decorators/normalize.decorator';

export class MiDto {
  @Trim()
  nombre: string;

  @ToLowercase()
  email: string;

  @ToUppercase()
  codigo: string;

  @NormalizeNumber()
  precio: number;

  @NormalizeBoolean()
  activo: boolean;

  @NormalizeDate()
  fecha: Date;
}
```

## Orden Correcto de Decoradores

```typescript
// ✅ CORRECTO - Transform antes que Validate
@Transform(TrimStringTransformer.transform)
@IsString()
@IsNotEmpty()
@MaxLength(100)
nombre: string;

// ❌ INCORRECTO - Validate antes que Transform
@IsString()
@Transform(TrimStringTransformer.transform)  // ❌ Demasiado tarde
nombre: string;
```

## Transformers Disponibles

| Transformer | Import                                                       | Uso                                                |
| ----------- | ------------------------------------------------------------ | -------------------------------------------------- |
| TrimString  | `../../../common/transformers/trim-string.transformer`       | `@Transform(TrimStringTransformer.transform)`      |
| Uppercase   | `../../../common/transformers/uppercase-string.transformer`  | `@Transform(UppercaseStringTransformer.transform)` |
| Lowercase   | `../../../common/transformers/lowercase-string.transformer`  | `@Transform(LowercaseStringTransformer.transform)` |
| Number      | `../../../common/transformers/string-to-number.transformer`  | `@Transform(StringToNumberTransformer.transform)`  |
| Boolean     | `../../../common/transformers/string-to-boolean.transformer` | `@Transform(StringToBooleanTransformer.transform)` |
| Date        | `../../../common/transformers/string-to-date.transformer`    | `@Transform(StringToDateTransformer.transform)`    |
| Array       | `../../../common/transformers/normalize-array.transformer`   | `@Transform(NormalizeArrayTransformer.transform)`  |

## Ejemplo Completo

```typescript
import { i18nValidationMessage } from 'nestjs-i18n';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { LowercaseStringTransformer } from '../../../common/transformers/lowercase-string.transformer';
import { StringToNumberTransformer } from '../../../common/transformers/string-to-number.transformer';

export class CreateUsuarioDto {
  @Transform(TrimStringTransformer.transform)
  @IsString({
    message: i18nValidationMessage('validation.EL_NOMBRE_DEBE_SER_UNA_CADENA'),
  })
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @Transform(LowercaseStringTransformer.transform)
  @IsEmail()
  @IsOptional()
  email?: string;

  @Type(() => Number)
  @Transform(StringToNumberTransformer.transform)
  @IsNumber()
  @IsOptional()
  edad?: number;
}
```

## Documentación Completa

Ver [`docs/NORMALIZACION_DATOS.md`](./NORMALIZACION_DATOS.md) para guía completa.
