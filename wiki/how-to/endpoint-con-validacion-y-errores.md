# How-to: Implementar endpoint con validación y manejo de errores

## Pasos
1. Define DTO con `class-validator`.
2. Declara endpoint en controller con decoradores Swagger.
3. Delega lógica al service.
4. Lanza excepciones HTTP de dominio (`BadRequestException`, `NotFoundException`, etc.).
5. Deja que `GlobalExceptionFilter` normalice la respuesta final.

## Ejemplo DTO
```ts
export class CreateXDto {
  @IsString()
  @Length(3, 120)
  nombre: string;

  @IsOptional()
  @IsUUID()
  referenciaId?: string;
}
```

## Ejemplo endpoint
```ts
@Post()
create(@Body() dto: CreateXDto) {
  return this.service.create(dto);
}
```

## Resultado
- Input inválido: error 400 con detalle de validación.
- Error de unicidad/relación: conflict normalizado por el filtro global.
