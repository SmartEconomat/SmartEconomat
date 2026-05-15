# Auditoría Técnica Completa — Archivo

## Resumen Ejecutivo

- **Estado general**: API de gestión de ficheros bajo `/archivos` con permisos granulares, subida vía Multer y rutas de descarga.
- **Nivel de riesgo**: Medio-alto (almacenamiento, integridad, filtrado de contenido).
- **Principales problemas**: Tipado débil en la respuesta de subida (`Promise<any>`); la seguridad efectiva depende de validaciones en `ArchivoService` (no auditado línea a línea aquí).
- **Principales fortalezas**: Guards estándar (`JwtAuthGuard`, `PermisosGuard`) y separación de DTOs de listado.
- **Criticidad general**: Alta por naturaleza del activo (binarios).

## Métricas Generales

- **Arquitectura**: Buena
- **Mantenibilidad**: Aceptable
- **Escalabilidad**: Aceptable
- **Seguridad**: Aceptable
- **Performance**: Aceptable
- **Coherencia de dominio**: Buena
- **Tipado**: Deficiente (en controlador)
- **Resiliencia**: Aceptable
- **Claridad del código**: Buena

## Hallazgos

### [ARCHIVO-001] Respuesta de subida tipada como `any`

#### Severidad
Media

#### Categoría
Tipado / Contratos API

#### Descripción
El método `uploadFile` declara retorno `Promise<any>`, rompiendo la regla de proyecto de TypeScript estricto sin `any` y debilitando el contrato con el frontend.

#### Riesgo real
Desalineación silenciosa entre backend y cliente; regresiones en serialización no detectadas por el compilador.

#### Evidencia

```81:88:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\archivo\controller\archivo.controller.ts
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: { user: Usuario }
  ): Promise<any> {
    const user = req.user;
    const result = await this.archivoService.uploadFile(file, user);
```

#### Impacto

- **Técnico**: Pérdida de garantías de tipo.
- **Negocio**: Bajo directo.
- **UX**: Errores de parseo en cliente.
- **Escalabilidad**: Ninguno.
- **Mantenibilidad**: Alto coste de cambio.

#### Solución recomendada
Definir un DTO de respuesta explícito (p. ej. `UploadArchivoResponseDto`) y usarlo como tipo de retorno y en `@ApiResponse`.

#### Prioridad recomendada
Alta

#### Riesgo de regresión
Bajo

### [ARCHIVO-002] Cabecera de caché agresiva en contenido servido

#### Severidad
Baja

#### Categoría
Performance / Invalidación

#### Descripción
Se define `Cache-Control` largo e `immutable` para contenido de archivo, lo que puede complicar la invalidación si los ficheros pueden reemplazarse manteniendo la misma URL.

#### Riesgo real
Clientes/CDN sirven contenido obsoleto tras sustitución lógica del fichero.

#### Evidencia

```37:37:c:\Users\psych\projects\SmartEconomat\backend\smart-economat-backend\src\modules\archivo\controller\archivo.controller.ts
const ARCHIVO_CONTENT_CACHE_CONTROL = 'public, max-age=2592000, immutable';
```

#### Impacto

- **Técnico**: Caché dura de CDN/navegador.
- **Negocio**: Confusión de documentos si hay reemplazo.
- **UX**: Usuario ve versión antigua.
- **Escalabilidad**: Positivo para tráfico; negativo para frescura.
- **Mantenibilidad**: Bajo.

#### Solución recomendada
Versionar por query param con hash de contenido o usar URLs únicas por revisión; documentar política de sustitución.

#### Prioridad recomendada
Media

#### Riesgo de regresión
Medio

## Inconsistencias Frontend/Backend

No detectadas en el alcance revisado (el cliente debería alinear el shape de `data` con el DTO propuesto).

## Riesgos Potenciales Futuros

- Crecimiento del volumen de ficheros sin externalización a object storage (S3/Blob).

## Deuda Técnica

- **Crítica**: Ninguna en el fragmento auditado.
- **Importante**: Eliminación de `any` en controlador.
- **Tolerable**: Revisión conjunta de límites Multer.

## Recomendaciones Estratégicas

- Antivirus/clamav o validación mágica de firmas para PDFs/imágenes en entornos regulados.
- Métricas de tamaño total por tenant/centro.

## Conclusión Final

El módulo **archivo** sigue el patrón de seguridad del monolito, pero el **contrato de subida** debe endurecerse tipográficamente y alinearse con el frontend para evitar regresiones silenciosas.
