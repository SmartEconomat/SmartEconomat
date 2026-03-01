# ✅ Checklist de Implementación - Plan de Acción

Documento para seguimiento de implementación de recomendaciones de auditoría.

---

## 🔴 CRÍTICO - Sprint 1-2 (2 Semanas)

### Seguridad: Password Policy + Rate Limiting

- [ ] **Crear validador custom `IsStrongPassword`**
  - Archivo: `src/common/validators/strong-password.validator.ts`
  - Requisitos OWASP: 12+ chars, mayús, minús, número, símbolo
  - Tests incluidos
  - Estimado: 2h

- [ ] **Instalar y configurar Throttler**
  - `npm install @nestjs/throttler`
  - Configurar en `src/app.module.ts`
  - Login: 5 intentos/minuto
  - Register: 3 intentos/hora
  - Estimado: 1h

- [ ] **Aplicar validaciones a DTOs**
  - `src/modules/auth/dto/register-user.dto.ts`
  - `src/modules/usuario/dto/create-usuario.dto.ts`
  - Crear tests para validaciones
  - Estimado: 1.5h

- [ ] **Test Password Policy**
  - Unit tests con pytest/Jest
  - Validar casos válidos e inválidos
  - Estimado: 1h

**Total Estimado: 5.5 horas**

---

### Seguridad: SameSite + CSRF

- [ ] **Crear constants de seguridad**
  - Archivo: `src/common/constants/security.constants.ts`
  - SECURE_COOKIE_OPTIONS, CORS_OPTIONS, SECURITY_HEADERS
  - Estimado: 1h

- [ ] **Implementar CSRF Guard**
  - Archivo: `src/common/guards/csrf.guard.ts`
  - Validar token en headers vs cookies
  - Estimado: 1.5h

- [ ] **Middleware CSRF token injection**
  - Archivo: `src/common/middleware/csrf.middleware.ts`
  - Inyectar token en responses GET
  - Estimado: 1h

- [ ] **Aplicar en AuthController**
  - Homogeneizar cookies: `sameSite: 'strict'`
  - Estimado: 0.5h

- [ ] **Actualizar main.ts con headers de seguridad**
  - HSTS, CSP, X-Frame-Options, etc.
  - Estimado: 1h

- [ ] **Tests E2E para CSRF**
  - Verificar CSRF token en cookies
  - Verificar rechazo sin token válido
  - Estimado: 1h

**Total Estimado: 6 horas**

---

### Performance: N+1 Queries

- [ ] **Analizar queries actuales con logs**
  - Activar query logging en TypeORM
  - Identificar queries problemáticas
  - Estimado: 1h

- [ ] **Refactorizar ProductoService.findAll()**
  - Mover lógica de query builder al repository
  - Separar leftJoinAndSelect si es necesario
  - Estimado: 2h

- [ ] **Crear métodos específicos en ProductoRepository**
  - `findWithProveedores(id)`
  - `findWithAlergenos(id)`
  - `findFiltered(filters)` con optimizaciones
  - Estimado: 2h

- [ ] **Benchmark antes/después**
  - Comparar latencias
  - Documentar mejoras
  - Estimado: 1h

- [ ] **Tests para rendimiento**
  - Query count assertions
  - Response time assertions
  - Estimado: 1h

**Total Estimado: 7 horas**

---

### Performance: Dashboard Sequential Queries

- [ ] **Refactorizar DashboardService.getStats()**
  - Convertir 10+ queries secuenciales a paralelas
  - Usar Promise.all()
  - Estimado: 2h

- [ ] **Crear métodos privados por métrica**
  - `calculateInventoryValue()`
  - `getStockAlerts()`
  - `getExpirationStats()`
  - `getOrderStats()`
  - Estimado: 1.5h

- [ ] **Benchmark paralelo vs secuencial**
  - Medir diferencia de latencia
  - Target: <200ms
  - Estimado: 1h

**Total Estimado: 4.5 horas**

---

### **TOTALES CRÍTICO**

- **Tiempo Total**: ~23 horas
- **Recursos**: 1 Senior Backend + 1 Mid
- **Plazo**: 2 sprints (2 semanas)
- **Entregables**:
  - ✓ 0 vulnerabilidades críticas
  - ✓ <100ms en búsquedas
  - ✓ Rate limiting activo
  - ✓ CSRF protegido

---

## 🟠 ALTO - Sprint 2-3 (2 Semanas)

### Arquitectura: Repository Base Pattern

- [ ] **Crear BaseRepository abstract**
  - Archivo: `src/common/repositories/base.repository.ts`
  - Métodos: paginate, findOneById, findAll, create, update, remove
  - Generics con Entity
  - Estimado: 2h

- [ ] **Refactorizar ProductoRepository**
  - Heredar de BaseRepository<Producto>
  - Mantener métodos específicos
  - Remover código duplicado
  - Estimado: 1h

- [ ] **Refactorizar UsuarioRepository**
  - Heredar de BaseRepository<Usuario>
  - Mantener métodos como `findByIdWithPassword()`
  - Estimado: 1h

- [ ] **Refactorizar RecepcionRepository** (si existe)
  - Aplicar mismo patrón
  - Estimado: 0.5h

- [ ] **Refactorizar otros repositories**
  - PedidoRepository
  - ProveedorRepository
  - Estimado: 1h

- [ ] **Tests unitarios para BaseRepository**
  - Mock implementations
  - Verificar comportamiento de paginate
  - Estimado: 2h

**Total Estimado: 7.5 horas**

---

### Refactoring: Services - Extract Methods

- [ ] **Analizar ProductoService**
  - Identificar métodos >100 líneas
  - Medir complejidad ciclomática
  - Estimado: 1h

- [ ] **Dividir ProductoService.findAll()**
  - Mover query building al repository
  - Quedará <20 líneas
  - Estimado: 1h

- [ ] **Dividir ProductoService.create()**
  - Separar tracking de creación
  - Estimado: 0.5h

- [ ] **Analizar otros Services grandes**
  - RecepcionService
  - PedidoService
  - Estimado: 1h

- [ ] **Refactorizar según análisis**
  - Extract methods
  - Complejidad ciclomática < 5
  - Estimado: 3h

- [ ] **Tests unitarios para Services**
  - Cobertura >80%
  - Estimado: 2h

**Total Estimado: 8.5 horas**

---

### Caching: Redis Integration

- [ ] **Instalar cache-manager**
  - `npm install @nestjs/cache-manager cache-manager cache-manager-redis-store`
  - Estimado: 0.5h

- [ ] **Crear CacheConfigModule**
  - Archivo: `src/cache/cache.module.ts`
  - Configurar Redis connection
  - Estimado: 1h

- [ ] **Integrar en DashboardService**
  - Cachear getStats() 5 minutos
  - Método invalidateStatsCache()
  - Estimado: 1.5h

- [ ] **Implementar cache invalidation en CRUD**
  - Al crear/editar producto, invalidar stats
  - Al crear/editar pedido, invalidar stats
  - Estimado: 1h

- [ ] **Cachear búsquedas de productos**
  - Productos frecuentes (por categoría)
  - TTL: 10 minutos
  - Estimado: 1h

- [ ] **Tests para caching**
  - Verificar hit/miss
  - Verificar invalidation
  - Estimado: 1.5h

**Total Estimado: 6.5 horas**

---

### Testing: Increase Coverage

- [ ] **Setup coverage reporting**
  - Configurar Jest con coverage
  - Target: 60%
  - Estimado: 1h

- [ ] **Unit tests para Services**
  - ProductoService
  - UsuarioService
  - PedidoService
  - Estimado: 8h

- [ ] **Unit tests para Guards**
  - JwtAuthGuard
  - RolesGuard
  - CsrfGuard (nueva)
  - Estimado: 3h

- [ ] **Integration tests para Repositories**
  - BaseRepository
  - ProductoRepository
  - UsuarioRepository
  - Estimado: 4h

- [ ] **E2E test improvements**
  - Cleanup/seed mejorado
  - Isolation entre tests
  - Estimado: 2h

**Total Estimado: 18 horas**

---

### **TOTALES ALTO**

- **Tiempo Total**: ~40.5 horas
- **Recursos**: 1 Senior + 1 Mid + 1 QA
- **Plazo**: 2 sprints (2 semanas, intenso)
- **Entregables**:
  - ✓ Código base refactorizado
  - ✓ Pattern consistente (BaseRepository)
  - ✓ Complejidad reducida
  - ✓ 60% test coverage

---

## 🟡 MEDIO - Sprint 3-4 (2 Semanas)

### Arquitectura: Documentación (ADRs)

- [ ] **ADR #1: JWT en Cookies vs Bearer**
  - Decisión: Solo cookies (httpOnly)
  - Justificación: XSS protection
  - Archivo: `docs/adr/001-jwt-authentication.md`
  - Estimado: 1h

- [ ] **ADR #2: Repository Pattern**
  - Decisión: Composición + Inheritance de BaseRepository
  - Justificación: Reutilización de código
  - Archivo: `docs/adr/002-repository-pattern.md`
  - Estimado: 1h

- [ ] **ADR #3: Service Layer Architecture**
  - Decisión: Services = Application Layer, no domain logic
  - Archivo: `docs/adr/003-service-layer.md`
  - Estimado: 1h

- [ ] **ADR #4: Caching Strategy**
  - Decisión: Redis con TTL por métrica
  - Archivo: `docs/adr/004-caching.md`
  - Estimado: 1h

- [ ] **Actualizar README.md**
  - Agregar sección Arquitectura
  - Agregar diagrama de modelos
  - Agregar guía de contribución
  - Estimado: 2h

**Total Estimado: 6 horas**

---

### Database: Migrations

- [ ] **Crear migration inicial**
  - `typeorm migration:generate -n Init`
  - Verificar que cubre todas las entidades
  - Estimado: 1.5h

- [ ] **Cambiar synchronize: false**
  - Actualizar config
  - Verificar en development y production
  - Estimado: 0.5h

- [ ] **Crear migration de índices**
  - Agregar índices compostos faltantes
  - Archivo: `src/migrations/XXX-AddMissingIndexes.ts`
  - Estimado: 1h

- [ ] **Testar migrations en nuevo DB**
  - Crear DB limpia
  - Correr migraciones
  - Verificar integridad
  - Estimado: 1h

- [ ] **Documentar proceso de migrations**
  - README con comandos
  - Guía para crear nuevas
  - Estimado: 1h

**Total Estimado: 5 horas**

---

### Autorización: Resource-Level

- [ ] **Analizar endpoints que necesitan resource auth**
  - PATCH /productos/:id (¿propietario?)
  - DELETE /productos/:id (¿propietario?)
  - GET /usuarios/:id (¿self o admin?)
  - Estimado: 1h

- [ ] **Agregar createdBy a entidades key**
  - Producto
  - Pedido
  - Estimado: 1h

- [ ] **Crear ResourceOwnerGuard**
  - Validar req.user.id === resource.createdBy
  - Archivo: `src/common/guards/resource-owner.guard.ts`
  - Estimado: 1.5h

- [ ] **Aplicar guard en controllers**
  - ProductoController.update()
  - ProductoController.delete()
  - Estimado: 1h

- [ ] **Tests para autorización por recurso**
  - User A no puede editar recurso de User B
  - Admin puede editar cualquiera
  - Estimado: 2h

**Total Estimado: 6.5 horas**

---

### **TOTALES MEDIO**

- **Tiempo Total**: ~17.5 horas
- **Recursos**: 1 Senior
- **Plazo**: 1-2 sprints (flexible)
- **Entregables**:
  - ✓ ADRs documentadas
  - ✓ Migrations en lugar de sync
  - ✓ Autorización por recurso

---

## 🟠 FUTURE - Sprint 5+ (Long-term)

### Observabilidad

- [ ] Structured logging (Winston)
- [ ] Distributed tracing (Jaeger)
- [ ] Metrics (Prometheus)
- [ ] Health checks endpoint

### Feature Flags

- [ ] Feature flag system
- [ ] Toggle para nuevas features
- [ ] A/B testing capability

### API Versioning

- [ ] Versioning setup para v2
- [ ] Backwards compatibility layer
- [ ] Migration guide

### Load Testing

- [ ] k6 o Artillery tests
- [ ] Baseline performance
- [ ] Regression detection

---

## 📊 Resumen de Esfuerzo

| Prioridad | Tema              | Horas     | Sprint | Status       |
| --------- | ----------------- | --------- | ------ | ------------ |
| 🔴        | Password Policy   | 5.5       | S1-2   | ⏳ Pendiente |
| 🔴        | SameSite + CSRF   | 6         | S1-2   | ⏳ Pendiente |
| 🔴        | N+1 Queries       | 7         | S1-2   | ⏳ Pendiente |
| 🔴        | Dashboard Queries | 4.5       | S1-2   | ⏳ Pendiente |
| 🟠        | BaseRepository    | 7.5       | S2-3   | ⏳ Pendiente |
| 🟠        | Extract Methods   | 8.5       | S2-3   | ⏳ Pendiente |
| 🟠        | Caching Redis     | 6.5       | S2-3   | ⏳ Pendiente |
| 🟠        | Testing Coverage  | 18        | S2-3   | ⏳ Pendiente |
| 🟡        | ADRs              | 6         | S3-4   | ⏳ Pendiente |
| 🟡        | Migrations        | 5         | S3-4   | ⏳ Pendiente |
| 🟡        | Resource Auth     | 6.5       | S3-4   | ⏳ Pendiente |
| **TOTAL** |                   | **80.5h** |        |              |

---

## 👥 Asignación de Recursos Recomendada

### Equipo Mínimo (Rápido)

- **1 Senior Backend** (Lead arquitectura + code review)
- **1 Mid Backend** (Implementación principal)
- **Plazo**: 4 sprints (4 semanas)

### Equipo Óptimo (Calidad)

- **1 Senior Backend** (Arquitectura, seguridad, code review)
- **2 Mid Backend** (Implementación)
- **1 QA Engineer** (Testing, validación)
- **Plazo**: 3 sprints (3 semanas)

### Equipo Cómodo (Sostenible)

- **1 Senior Backend** (Arquitectura)
- **1 Mid Backend** (Features + refactoring)
- **1 Junior Backend** (Tests, docs)
- **1 QA** (Testing)
- **Plazo**: 4-5 sprints (flexible)

---

## 📋 Tracking semanal

### Semana 1 (Sprint 1, días 1-5)

**Target**: Cerrar vulnerabilidades críticas

```
Day 1:
- [ ] Setup Password Validator (2h)
- [ ] Setup Throttler (1h)

Day 2:
- [ ] CSRF Guard + Middleware (2.5h)
- [ ] Security constants (1h)

Day 3:
- [ ] Apply to Controllers (0.5h)
- [ ] Analyze N+1 queries (1h)
- [ ] Refactor ProductoService (2h)

Day 4:
- [ ] Refactor Dashboard (2h)
- [ ] Unit tests (2h)

Day 5:
- [ ] E2E tests security (2h)
- [ ] Benchmark queries (2h)
- [ ] Code review + fixes (2h)
```

**Weekly Goal**: 0 critical vulnerabilities, <100ms queries ✓

---

## ✅ Criterios de Aceptación

### Por Recomendación

#### Password Policy

- [ ] Regex valida 12+ chars, mayús, minús, número, símbolo
- [ ] DTO usa @IsStrongPassword()
- [ ] Tests cubren casos válidos e inválidos
- [ ] Documentado en README

#### Rate Limiting

- [ ] Login: max 5 intentos/minuto
- [ ] Register: max 3 intentos/hora
- [ ] Returns 429 cuando se excede límite
- [ ] Tests verifican límites

#### N+1 Queries

- [ ] Producto.findAll() hace max 3 queries
- [ ] Latencia <100ms para 1000 items
- [ ] Zero cartesian products
- [ ] Benchmark documentado

#### Caching

- [ ] Dashboard.getStats() cachea 5 min
- [ ] Cache invalidation en CRUD
- [ ] 10x mejora de latencia (500ms → 50ms)
- [ ] Tests verifican hit/miss

#### Testing

- [ ] Coverage ≥ 60%
- [ ] Todos los Services testeados
- [ ] Todos los Guards testeados
- [ ] E2E tests aislados y limpios

---

## 📞 Escalation Path

Si hay bloqueadores:

1. **Technical blockers**: Contact Senior Architect
2. **Resource blockers**: Escalate to Product Manager
3. **Urgent security issues**: Hotfix + document + prevent

---

**Última actualización**: 1 de Marzo de 2026  
**Próxima revisión**: 7 de Marzo de 2026 (después de S1)
