# Auditoría Técnica Completa — Alumno

## Resumen Ejecutivo

- **Estado general**: Módulo educativo con rutas **públicas** de registro y consulta de slots/aulas, más operaciones autenticadas para cambio de profesor y perfil.
- **Nivel de riesgo**: Medio-alto en endpoints `@Public()` (enumeración y abuso de registro).
- **Principales problemas**: Superficie expuesta sin autenticación para listados de aulas/slots; requiere throttling y validación de negocio estricta en servicio.
- **Principales fortalezas**: Separación clara entre flujo de alta de alumno y operaciones posteriores con permisos.
- **Criticidad general**: Media (impacto reputacional y de datos personales en entorno educativo).

## Métricas Generales

- **Arquitectura**: Buena
- **Mantenibilidad**: Buena
- **Escalabilidad**: Aceptable
- **Seguridad**: Aceptable
- **Performance**: Aceptable
- **Coherencia de dominio**: Buena
- **Tipado**: Buena
- **Resiliencia**: Aceptable
- **Claridad del código**: Buena

## Hallazgos

### [ALUMNO-001] Endpoints públicos amplios (registro y catálogos)

#### Severidad
Alta

#### Categoría
Seguridad / Abuso

#### Descripción
Varios métodos del controlador están marcados como `@Public()`, incluyendo registro y consultas de catálogo por código de clase, sin capa adicional de autenticación en el controlador.

#### Riesgo real
Enumeración de códigos de clase/aulas, creación masiva de cuentas inactivas, consumo de recursos y posible fuga de metadatos organizativos.

#### Evidencia

```41:58:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\alumno\controller\alumno.controller.ts
  @Post('register')
  @Public()
  async register(@Body() dto: RegisterAlumnoDto) {
    return this.alumnoService.register(dto);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {string} codigoClase - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ codigoClase: string | undefined; aula: string; numeroClase: number; profesor: string; cialProfesor: string; }>} Datos efectivos después de ejecutar la operación.
   */
  @Get('slots/:codigoClase')
  @Public()
  async getSlotByCode(@Param('codigoClase') codigoClase: string) {
    return this.alumnoService.getSlotByCode(codigoClase);
  }
```

#### Impacto

- **Técnico**: Mayor carga y logs ruidosos.
- **Negocio**: Riesgo de fraude o suplantación en flujos mal endurecidos.
- **UX**: Posible degradación por bots.
- **Escalabilidad**: Picos de tráfico anónimo.
- **Mantenibilidad**: Baja.

#### Solución recomendada
Reforzar rate limiting específico, CAPTCHA o token de invitación firmado para registro, y minimizar datos devueltos en endpoints públicos; auditar `AlumnoService.register` para límites por slot/IP.

#### Prioridad recomendada
Alta

#### Riesgo de regresión
Medio

### [ALUMNO-002] Riesgo de inconsistencia de guards a nivel de clase

#### Severidad
Baja

#### Categoría
Seguridad / Consistencia

#### Descripción
El controlador no declara `@UseGuards` a nivel de clase; cada método autenticado debe recordar añadir guards — patrón más frágil que el de otros módulos.

#### Riesgo real
Un nuevo endpoint podría omitir guards por error humano.

#### Evidencia

```24:31:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\alumno\controller\alumno.controller.ts
@Controller('alumnos')
export class AlumnoController {
  /**
   * Inicializa la instancia con los colaboradores necesarios para el flujo de la aplicación.
   *
   * @param private readonly alumnoService Parámetro de entrada para la operación.
   */
  constructor(private readonly alumnoService: AlumnoService) {}
```

#### Impacto

- **Técnico**: Posible endpoint accidentalmente abierto.
- **Negocio**: Medio si ocurre.
- **UX**: Ninguno directo.
- **Escalabilidad**: Ninguno.
- **Mantenibilidad**: Medio.

#### Solución recomendada
Aplicar `@UseGuards(JwtAuthGuard, PermisosGuard)` a nivel de clase y usar `@Public()` solo en handlers explícitos (patrón ya usado en `ProfesorController`).

#### Prioridad recomendada
Media

#### Riesgo de regresión
Bajo

## Inconsistencias Frontend/Backend

No detectadas en el alcance revisado (no se contrastaron DTOs con el cliente educativo).

## Riesgos Potenciales Futuros

- Cambios en el modelo `AlumnoSlot` que requieran versionar las respuestas públicas.

## Deuda Técnica

- **Crítica**: Ninguna en código leído.
- **Importante**: Endurecimiento de rutas públicas.
- **Tolerable**: JSDoc redundante similar a otros módulos.

## Recomendaciones Estratégicas

- Tratar el registro de alumno como **flujo controlado** (invitación) en despliegues enterprise.
- Métricas y alertas en `/alumnos/register` y `/alumnos/slots/*`.

## Conclusión Final

El módulo **alumno** es funcional y coherente con el dominio educativo, pero concentra **riesgo de seguridad en la superficie pública**. Ese es el eje principal de mejora prioritaria.
