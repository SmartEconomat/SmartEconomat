# Auditoría Técnica Completa — Preparación

## Resumen Ejecutivo

- **Estado general**: API de preparaciones de cocina bajo `/preparaciones` con permisos de recetas (`cocinar`, `listar`) y operaciones de ciclo de vida.
- **Nivel de riesgo**: Medio-alto (producción ligada a recetas e inventario vía otros servicios).
- **Principales problemas**: **Bug de extracción de rol** en `findAll`: se usa `req.user?.rol?.nombre` pero el JWT validado expone `rol` como `string`, no como objeto.
- **Principales fortalezas**: Validación explícita de `userId` en `create` con `UnauthorizedException` si falta.
- **Criticidad general**: Alta para operaciones de cocina; el bug de rol afecta visibilidad de soft-delete para administradores.

## Métricas Generales

- **Arquitectura**: Buena
- **Mantenibilidad**: Aceptable
- **Escalabilidad**: Aceptable
- **Seguridad**: Aceptable
- **Performance**: Aceptable
- **Coherencia de dominio**: Buena
- **Tipado**: Aceptable
- **Resiliencia**: Aceptable
- **Claridad del código**: Aceptable

## Hallazgos

### [PREPARACION-001] Lectura incorrecta del rol del usuario (`rol.nombre` vs `rol` string)

#### Severidad
Alta

#### Categoría
Bug / Autorización / Integridad de datos

#### Descripción
`findAll` obtiene `userRole` desde `req.user?.rol?.nombre`, pero `JwtStrategy.validate` devuelve `rol` como cadena (`getRolPrincipal` retorna `string`). El resultado es `userRole === undefined` siempre, por lo que la rama «admin» del repositorio nunca se activa vía este path.

#### Riesgo real
Los administradores **no listan preparaciones soft-deleted** (`withDeleted: isAdmin` queda en falso) y cualquier lógica futura basada en rol queda rota en este endpoint.

#### Evidencia

```71:78:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\preparacion\controller\preparacion.controller.ts
  @Get()
  @RequirePermissions(PERMISSIONS.recetas.listar)
  async findAll(
    @SortableFields(SORTABLE_FIELDS.preparaciones) query: PaginationQueryDto,
    @Req() req: Request & { user?: { rol?: { nombre?: string } } }
  ) {
    const userRole = req.user?.rol?.nombre;
    return this.preparacionService.findAll(query, userRole);
  }
```

```70:75:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\auth\strategies\jwt.strategy.ts
    return {
      id: user.id,
      username: user.username,
      rol: getRolPrincipal(user.roles, user.rol),
      idioma: user.idioma,
    };
```

```56:73:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\preparacion\repository\preparacion.repository.ts
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';
...
    const [data, total] = await this.preparacionRepo.findAndCount({
      relations: ['receta', 'usuario'],
      order: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
      withDeleted: isAdmin,
    });
```

#### Impacto

- **Técnico**: Bug de autorización/consulta.
- **Negocio**: Datos «perdidos» para administración/recuperación.
- **UX**: Inconsistencias entre pantallas.
- **Escalabilidad**: Ninguno.
- **Mantenibilidad**: Alto (dificulta depuración).

#### Solución recomendada
Cambiar a `const userRole = typeof req.user?.rol === 'string' ? req.user.rol : req.user?.rol?.nombre;` o unificar tipo `AuthenticatedUser` en todo el backend.

#### Prioridad recomendada
Inmediata

#### Riesgo de regresión
Medio

### [PREPARACION-002] Listado sin filtro por usuario para roles no admin

#### Severidad
Media

#### Categoría
Autorización / Privacidad

#### Descripción
`findAllPaginated` no aplica filtro por `usuarioId` cuando `isAdmin` es falso; todos los usuarios con permiso de listar ven todas las preparaciones.

#### Riesgo real
Fuga de información operativa entre usuarios de cocina si el negocio esperaba aislamiento por creador.

#### Evidencia

```67:73:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\preparacion\repository\preparacion.repository.ts
    const [data, total] = await this.preparacionRepo.findAndCount({
      relations: ['receta', 'usuario'],
      order: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
      withDeleted: isAdmin,
    });
```

#### Impacto

- **Técnico**: Visibilidad amplia.
- **Negocio**: Confidencialidad operativa.
- **UX**: Listados con preparaciones ajenas.
- **Escalabilidad**: Ninguno.
- **Mantenibilidad**: Medio.

#### Solución recomendada
Si el requisito es aislar, añadir `where` por `usuarioId` salvo admin; si es intencional (cocina colaborativa), documentarlo explícitamente en API y permisos.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Alto (cambia visibilidad)

## Inconsistencias Frontend/Backend

No detectadas en el alcance revisado (`Preparaciones.tsx` no contrastada línea a línea).

## Riesgos Potenciales Futuros

- Estados de preparación concurrentes (`iniciar`/`finalizar`) sin bloqueo optimista.

## Deuda Técnica

- **Crítica**: Bug `rol.nombre` en `GET /preparaciones`.
- **Importante**: Clarificar modelo de visibilidad en listados.
- **Tolerable**: Tipos `Request` genéricos en controlador.

## Recomendaciones Estratégicas

- Tests de contrato del objeto `user` inyectado por Passport en módulos clave.

## Conclusión Final

El módulo **preparacion** tiene una base sólida, pero el hallazgo **PREPARACION-001** es un **defecto objetivo** alineado con evidencia de JWT y debe corregirse antes de confiar en la vista administrativa de borrados.
