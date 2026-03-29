---
name: testing-react-nestjs
description: Guía pruebas unitarias e integración para el frontend React (Vitest, Testing Library, jsdom) y el backend NestJS (Jest, @nestjs/testing). Use al escribir o revisar tests, al mockear servicios/repositorios, o cuando el usuario mencione tests, cobertura, specs, mocks o e2e en SmartEconomat.
---

# Testing React y NestJS (SmartEconomat)

## Dónde vive cada cosa

| Ámbito | Ruta del paquete | Comando principal |
|--------|------------------|-------------------|
| Backend NestJS | `backend/smart-economat-backend` | `npm run test` |
| Frontend React | `frontend/smart-economat-frontend` | `npm run test` |

Ejecutar un fichero concreto (ejemplos):

```bash
cd backend/smart-economat-backend && npx jest test/modules/auth/auth.service.spec.ts
cd frontend/smart-economat-frontend && npx vitest run test/components/recepcion/PasoRevision.test.tsx
```

Otros scripts útiles en backend: `test:watch`, `test:cov`, `test:e2e` (Jest con `test/jest-e2e.json`). En frontend: `test:watch`, `test:coverage`.

---

## NestJS (Jest)

### Convenciones del repo

- Ficheros: `*.spec.ts` en `src/` o en `test/modules/...`.
- Transformación TypeScript: **@swc/jest** (decoradores y metadata activos).
- Alias en Jest: `^src/(.*)$` → `src/$1`, `^test/(.*)$` → `test/$1`.
- Entorno: **node** (no jsdom).

### Patrón estándar: servicio con dependencias mockeadas

1. Importar `Test` y `TestingModule` desde `@nestjs/testing`.
2. Crear objetos `jest.fn()` para repos, `JwtService`, `DataSource`, etc.
3. Registrar el servicio bajo prueba y sustituir cada token con `{ provide: ..., useValue: mock }`.
4. Para TypeORM: `getRepositoryToken(Entity)` como `provide`.
5. En `beforeEach`: `jest.clearAllMocks()` y recompilar el módulo si hace falta un estado limpio.
6. Obtener el servicio con `module.get<Service>(Service)`.

### Controladores

- Misma idea: mockear el servicio del controlador y usar `supertest` solo si el test ejerce HTTP real; muchos tests del repo prueban el controlador inyectando el servicio mock.

### E2E

- Config separada: `test/jest-e2e.json`; entrada típica `test/e2e/all.e2e-spec.ts`.
- No mezclar asunciones de unit tests con flujos que requieren app levantada y BD salvo que el test e2e lo defina explícitamente.

### Prioridades al diseñar el test

- Probar comportamiento observable (excepciones HTTP, valores devueltos, llamadas a colaboradores con argumentos esperados).
- Evitar acoplar el test a detalles internos que no aporten señal de regresión.

---

## React (Vitest + Testing Library)

### Convenciones del repo

- Tests en `src/**/*.test.ts(x)` o `test/**/*.test.ts(x)` (según Vitest/Vite; el proyecto usa ambos árboles).
- Entorno: **jsdom** (`vite.config.ts` → `test.environment`).
- Setup global: `src/setupTests.ts` importa `@testing-library/jest-dom/vitest` (matchers tipo `toBeInTheDocument` si se usan).
- API de tests: importar `describe`, `it`, `expect`, `vi`, `beforeEach` desde **`vitest`** (no asumir globals salvo que el fichero confíe en `globals: true`).

### Componentes

- `render` + `screen` de `@testing-library/react`.
- Preferir consultas accesibles: `getByRole`, `getByLabelText`; usar `getByText` cuando refleje lo que ve el usuario.
- Interacción: `@testing-library/user-event` cuando haga falta (clics, teclado).
- Mocks: `vi.fn()`, `vi.mock('ruta', ...)` para módulos; alinear con el estilo del fichero bajo prueba.

### Hooks y utilidades

- Probar hooks con utilidades del RTL o tests que monten un componente wrapper mínimo, según el patrón ya usado en `test/hooks/`.

### Servicios / fetch

- Mockear `fetch` o módulos de API con `vi` y restaurar en `afterEach` si se reemplaza globalmente.

---

## Checklist rápido (nuevo test)

**NestJS**

- [ ] Nombre del `describe` claro (clase o función bajo prueba).
- [ ] Mocks tipados o al menos con la forma usada en el código.
- [ ] Casos felices + al menos un error esperado (`BadRequestException`, etc.) si aplica.

**React**

- [ ] Datos de prueba mínimos pero válidos (props, store, context).
- [ ] Aserciones sobre el DOM o callbacks (`toHaveBeenCalled`), no sobre detalles de implementación interna salvo necesidad.
- [ ] Sin warnings de act/async no resueltos; usar `findBy*` o `waitFor` cuando haya efectos asíncronos.

---

## Recursos opcionales

Si la skill crece, extraer a `reference.md`: tablas de matchers RTL, lista de tokens Nest comunes del repo, o plantillas de `TestingModule` copiables. Mantener aquí solo lo esencial.
