# Auditoría de Cobertura Documental Backend y API

Este documento evalúa el estado real de la documentación del backend y de la API pública de SmartEconomat, tomando como referencia el código actual en `backend/smart-economat-backend/src/modules` y la wiki activa.

## Tipo de documento

Referencia operativa con finalidad de auditoría y planificación.

## Audiencia

- Desarrolladores backend.
- Desarrolladores frontend que consumen `/api/v1`.
- QA técnico e integradores internos.

## Objetivo

Determinar qué partes del backend y de la API pública están ya documentadas, cuáles están cubiertas solo parcialmente y qué huecos deben cerrarse para poder afirmar que el sistema está documentado de forma mantenible.

## Alcance de esta auditoría

Incluye:

- módulos backend cargados en `src/modules`;
- controladores HTTP y contrato publicado bajo `/api/v1`;
- documentación de arquitectura backend y referencias técnicas relacionadas;
- documentación funcional de módulos cuando afecta al entendimiento del backend o del contrato API.

Queda fuera de esta fase:

- documentación completa de frontend;
- runbooks de despliegue distintos del backend/API;
- documentación de UX o diseño visual;
- reescritura exhaustiva de todos los documentos existentes.

## Criterio de cobertura usado

Para considerar un área como bien documentada en esta fase, debería existir al menos:

1. una referencia navegable de endpoints o capacidades públicas;
2. contexto funcional suficiente para entender para qué existe el área;
3. enlace o relación clara con entidades, DTOs, permisos o contrato global;
4. alineación con el código real actual, sin omitir módulos o controllers activos.

Estados usados en la matriz:

- `Completo`: cubre razonablemente el área y está alineado con el código visible.
- `Parcial`: existe documentación útil, pero faltan detalles, cobertura o alineación.
- `Ausente`: no existe documentación suficiente en la wiki para esa área.
- `Desactualizado`: existe documento, pero no refleja con fidelidad la estructura real del backend actual.

## Inventario real observado en código

### Módulos detectados en `src/modules`

Se observan 27 módulos de backend:

- `admin`
- `albaran`
- `alumno`
- `archivo`
- `auth`
- `dashboard`
- `distribucion`
- `export`
- `incidencia`
- `inventario`
- `merma`
- `movimiento`
- `openfoodfacts`
- `pedido`
- `pedido-draft`
- `permisos`
- `plantillas-roles`
- `preparacion`
- `producto`
- `profesor`
- `proveedor`
- `recepcion`
- `recepcion-draft`
- `receta`
- `roles`
- `ubicacion`
- `usuario`

### Controladores HTTP detectados

Se observan 36 controladores bajo `src/modules/**/controller/*.ts`, incluyendo controladores específicos que la documentación debe reflejar explícitamente:

- `pedido-usuario.controller.ts`
- `purchase-batch.controller.ts`
- `distribucion.controller.ts`
- `openfoodfacts.controller.ts`
- `roles.controller.ts`
- `permisos.controller.ts`
- `plantillas-roles.controller.ts`
- `recepcion-producto.controller.ts`
- `producto-proveedor.controller.ts`
- `producto-alergeno.controller.ts`
- `historial-precio.controller.ts`

## Inventario documental actual

### Referencia API por dominios

La carpeta `wiki/reference/api/` contiene 7 documentos:

- `README.md`
- `contrato-global.md`
- `catalogo-e-inventario.md`
- `compras-recepciones-e-incidencias.md`
- `produccion-y-recetas.md`
- `usuarios-admin-y-seguridad.md`
- `modulo-educativo-soporte-y-operaciones.md`

Conclusión inicial: la API está documentada con una estructura útil por dominios y con buen punto de entrada para integradores.

### Referencia transversal backend

Existen además documentos técnicos relevantes:

- `wiki/reference/endpoints.md`
- `wiki/reference/entidades.md`
- `wiki/reference/modulos-y-responsabilidades.md`
- `wiki/reference/typeorm-y-datasource.md`
- `wiki/reference/variables-entorno.md`
- `wiki/reference/pipes-guards-interceptors-globales.md`
- `wiki/architecture/backend.md`

### Documentación funcional por módulos

La wiki sí contiene documentación funcional útil para algunas áreas concretas:

- `pedido`
- `recepcion`
- `producto`
- `inventario`
- `produccion`

No existe la misma profundidad de documentación funcional para buena parte del resto de módulos del backend.

## Matriz de cobertura actual

| Área | Código real | Documentación actual | Estado | Observación principal |
| --- | --- | --- | --- | --- |
| Contrato global API | Sí | `reference/api/contrato-global.md` | Completo | Buen punto de entrada para autenticación, envelope y convenciones. |
| Catálogo e inventario | Sí | `reference/api/catalogo-e-inventario.md` | Completo | Cubre productos, proveedores, inventario, alertas, movimientos, mermas, ubicaciones y OpenFoodFacts. |
| Compras, recepción, incidencias y distribuciones | Sí | `reference/api/compras-recepciones-e-incidencias.md` | Completo | Incluye `pedido-usuarios`, `purchase-batches`, recepciones, incidencias, albaranes y distribuciones. |
| Producción y recetas | Sí | `reference/api/produccion-y-recetas.md` | Completo | Cubre recetas, producción y preparaciones a nivel de integración. |
| Usuarios, auth, admin y plantillas | Sí | `reference/api/usuarios-admin-y-seguridad.md` | Parcial | Útil para integración, pero mezcla muchas áreas y no separa con suficiente detalle `roles` y `permisos` como módulos propios. |
| Módulo educativo, archivos y exportación | Sí | `reference/api/modulo-educativo-soporte-y-operaciones.md` | Completo | Buena cobertura de profesores, alumnos, archivos, exportaciones y endpoint raíz. |
| Mapa rápido de endpoints | Sí | `reference/endpoints.md` | Completo | Buen índice corto; depende de que la referencia detallada siga actualizada. |
| Entidades de backend | Sí | `reference/entidades.md` | Parcial | Útil como referencia base, pero no sustituye documentación por agregado o por endpoint. |
| Módulos y responsabilidades | Sí | `reference/modulos-y-responsabilidades.md` | Desactualizado | No refleja todo el backend actual: omite módulos o controllers visibles como `distribucion`, `openfoodfacts`, `pedido-usuario`, `roles` y `permisos` expuestos. |
| Arquitectura backend general | Sí | `architecture/backend.md` | Desactualizado | Sigue siendo útil, pero arrastra descripciones y recuentos antiguos del backend. |
| TypeORM, datasource y entorno | Sí | `reference/typeorm-y-datasource.md`, `reference/variables-entorno.md` | Completo | Cobertura técnica transversal razonable. |
| Guards, pipes e interceptores | Sí | `reference/pipes-guards-interceptors-globales.md` | Completo | Buena documentación de infraestructura cross-cutting. |
| Documentación funcional de pedidos | Sí | `modules/pedido/*.md` | Completo | Es la zona funcional mejor desarrollada de la wiki. |
| Documentación funcional de recepción | Sí | `modules/recepcion/*.md` | Parcial | Buena cobertura operativa, pero más orientada al flujo que al inventario completo del módulo. |
| Documentación funcional de producto | Sí | `modules/producto/*.md` | Parcial | Hay casos de uso relevantes, pero no un mapa funcional equivalente al peso real del módulo. |
| Documentación funcional de inventario | Sí | `modules/inventario/*.md` | Parcial | Existe material útil, pero insuficiente para cubrir toda la superficie del módulo. |
| Documentación funcional de distribución | Sí | `modules/distribucion/README.md` | Parcial | Existe documento, pero queda menos visible y menos integrado con la referencia general. |
| Documentación funcional de auth y usuario | Sí | `security/*.md` y `reference/api/usuarios-admin-y-seguridad.md` | Parcial | Hay piezas sueltas y de seguridad, pero no una visión funcional backend unificada del dominio. |
| Documentación funcional de albarán | Sí | No localizada como documento de módulo dedicado | Ausente | Solo aparece integrada dentro de la referencia API y de flujos relacionados. |
| Documentación funcional de admin/dashboard/export | Sí | No localizada como documentos dedicados de módulo | Ausente | Cubiertos por referencia API, sin documentación narrativa específica de backend. |
| Documentación funcional de roles/permisos/plantillas | Sí | Parcial en `usuarios-admin-y-seguridad.md` | Parcial | Falta separación conceptual clara entre catálogo de permisos, roles y plantillas. |

## Huecos críticos detectados

### 1. Documento de módulos y responsabilidades desalineado con el código

`wiki/reference/modulos-y-responsabilidades.md` ya no representa correctamente el backend actual. La desalineación es crítica porque este documento debería actuar como mapa maestro del backend.

Problemas observables:

- no refleja todos los módulos activos visibles en `src/modules`;
- no enumera controllers hoy expuestos como `pedido-usuario`, `distribucion`, `openfoodfacts`, `roles` o `permisos`;
- mantiene descripciones demasiado resumidas para módulos que ya crecieron en responsabilidad.

### 2. Arquitectura backend general con nivel de detalle insuficiente

`wiki/architecture/backend.md` sigue siendo válido como visión general, pero no alcanza el nivel de precisión necesario para mantenimiento avanzado del sistema actual.

Falta especialmente:

- reflejar mejor la evolución del dominio de pedidos, distribuciones y agregados;
- describir módulos nuevos o ya desacoplados del núcleo inicial;
- separar mejor contratos públicos, servicios internos y componentes transversales.

### 3. Cobertura funcional muy desigual entre módulos

Pedidos está mucho mejor documentado que otras áreas. Esto genera una wiki útil, pero no homogénea.

Áreas con menor cobertura narrativa específica:

- `albaran`
- `admin`
- `dashboard`
- `export`
- `roles`
- `permisos`
- `plantillas-roles`
- `archivo`
- `profesor`
- `alumno`
- `auth`
- `usuario`

### 4. Falta una matriz canónica módulo -> controller -> endpoints -> documento

La wiki tiene buenos índices, pero no una tabla maestra que permita responder con rapidez:

- qué controller expone cada área;
- qué endpoints cubre cada documento;
- qué DTOs y permisos dominan cada bloque;
- qué partes siguen sin documento dedicado.

### 5. El backend está razonablemente documentado para integración, pero no todavía para mantenimiento total

La referencia API es suficiente para consumir muchos endpoints. No lo es todavía para afirmar que el backend está documentado “al 100%” desde el punto de vista de mantenimiento, onboarding y evolución de módulos.

## Valoración global

### Estado de la referencia API pública

`Alto`.

La API pública ya dispone de una base documental útil y navegable. El principal trabajo pendiente no es rehacerla desde cero, sino completarla, mantenerla alineada y ganar precisión en zonas concretas.

### Estado de la documentación backend como sistema mantenible

`Medio`.

Existe suficiente material para entender varias áreas importantes, pero todavía no hay cobertura homogénea ni mapa documental completo del backend real.

### Estado de “100% documentado” para backend/API

`No alcanzado todavía`.

La base existente es buena, pero falta cerrar alineación estructural y cubrir varios módulos con narrativa técnica y funcional equivalente.

## Prioridad recomendada de ejecución

### Prioridad 1

- Actualizar `wiki/reference/modulos-y-responsabilidades.md` para reflejar el backend real actual.
- Actualizar `wiki/architecture/backend.md` para alinearlo con los módulos y responsabilidades reales.
- Crear una matriz canónica módulo -> controller -> documento.

### Prioridad 2

- Completar la referencia de seguridad para diferenciar con más claridad `auth`, `usuarios`, `roles`, `permisos` y `plantillas-roles`.
- Añadir documentación funcional de módulos aún sin documento narrativo propio: `albaran`, `admin`, `dashboard`, `export`, `archivo`.

### Prioridad 3

- Igualar la profundidad funcional entre módulos del dominio educativo y administrativo.
- Añadir documentación de mantenimiento por agregado o flujo para áreas con más lógica interna.

## Distribución recomendada según Diátaxis

### Referencia

Debe contener:

- endpoints;
- DTOs principales;
- entidades relacionadas;
- permisos aplicables;
- rutas especiales y convenciones.

### Explicación

Debe contener:

- decisiones de arquitectura;
- separación entre agregados y modelos operativos;
- trade-offs del diseño actual;
- relación entre módulos y componentes transversales.

### How-to

Debe cubrir:

- cómo integrar nuevos endpoints en la referencia;
- cómo documentar un módulo nuevo;
- cómo mantener sincronizada la wiki con controllers y DTOs.

### Tutorial

No es la prioridad principal de esta fase. Puede añadirse más adelante para onboarding de desarrolladores nuevos, una vez que la referencia y la explicación estén cerradas.

## Siguiente paso recomendado

Usar esta auditoría como documento base y ejecutar de inmediato la fase 2:

1. corregir el mapa maestro de módulos;
2. actualizar la arquitectura backend;
3. completar documentación faltante de módulos backend con prioridad alta.