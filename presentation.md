---
marp: true
theme: default
paginate: true
backgroundColor: #f8fafc
color: #1e293b
style: |
  section {
    font-family: 'Inter', sans-serif;
    justify-content: start;
    padding: 60px 90px;
  }
  h1, h2 {
    color: #dc004e;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .label {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    color: #dc004e;
    margin-bottom: 10px;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .card {
    background: #ffffff;
    border: 1px solid rgba(30,41,59,.1);
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 8px 30px rgba(0,0,0,.04);
  }
  .badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 700;
    background: rgba(220,0,78,.1);
    color: #dc004e;
    margin-right: 5px;
  }
---

# SmartEconomat
## Sistema de Gestión de Economato Escolar

**TFG · Desarrollo de Aplicaciones Web · 2025/2026**

Aplicación full-stack para la gestión integral de inventario, pedidos, recetas y distribución en escuelas de hostelería.

- React 19 + TypeScript
- NestJS 11
- PostgreSQL 16
- Docker + CI/CD

---

<!-- _class: lead -->
<div class="label">Contexto</div>

# El desafío del economato escolar

Las escuelas de hostelería gestionan cientos de ingredientes y pedidos semanales con métodos manuales propensos a errores.

<div class="grid">
<div class="card">
<h3>Tradicional (Antes)</h3>
- Hojas de cálculo desconectadas
- Pedidos por email o teléfono
- Sin trazabilidad de caducidades
- Mermas no registradas
</div>
<div class="card">
<h3>SmartEconomat (Solución)</h3>
- Inventario en tiempo real (FEFO)
- Flujo de pedidos digitalizado
- Alertas de caducidad automáticas
- PMP y escandallo por receta
</div>
</div>

---

<div class="label">Tecnología</div>

# Stack de desarrollo

Selección basada en rendimiento, ecosistema y mantenibilidad.

- **Frontend**: React 19, TypeScript, Vite 6, Material UI v6, i18next.
- **Backend**: NestJS 11, PostgreSQL 16, TypeORM, Passport JWT, Swagger.
- **DevOps**: Docker Compose, GitHub Actions, Nginx HTTPS, Electron Installer.

---

<div class="label">Sistema</div>

# Arquitectura del sistema

Diseño en capas con separación de responsabilidades clara.

1. **📡 Controller**: HTTP / Guardias / Validación
2. **⚙️ Service**: Lógica de negocio
3. **🗄 Repository**: TypeORM + QueryRunner
4. **🐘 Entity / PostgreSQL**: Persistencia

**Pipeline de Request**: Request → Throttle → JWT Guard → Roles/Permisos → Validation → Controller → Service → DB → Response.

---

<div class="label">Backend</div>

# 27 módulos en 4 dominios

Arquitectura modular organizada por dominio de negocio.

- **🔐 Seguridad**: Auth, Usuarios, Roles & Permisos.
- **📦 Catálogo & Stock**: Productos, Proveedores, Inventario (FEFO), Movimientos, Mermas.
- **🛒 Compras**: Pedidos, Recepción, Incidencias, Albaranes.
- **🍳 Producción**: Recetas, Ingredientes, Lotes, Distribución.

---

<div class="label">Base de Datos</div>

# Diagrama entidad-relación

PostgreSQL 16 · 25+ tablas · UUID v7 · Soft Delete · TypeORM

- **Usuario**: 1:N pedidos, 1:N recepciones.
- **Producto**: 1:N proveedores, 1:N alérgenos.
- **Inventario**: Estrategia FEFO (lotes por caducidad).
- **Incidencias**: Trazabilidad completa de errores en recepción.

---

<div class="label">Control de Versiones</div>

# Git Flow adaptado

Estrategia de ramas profesional con integración continua.

- **main**: Código en producción (protegida).
- **develop**: Base de integración.
- **feature/* / fix/***: Ramas de desarrollo.

**Calidad**: Husky hooks, Commitlint, ESLint + Prettier, GitHub Actions (CI/CD).
**Estadísticas**: 1153 commits, 163 pull requests, 100% PR revisados.

---

<div class="label">Identidad Visual</div>

# Slate Modern Design System

Basado en Material UI v6 con tema personalizado y 4 variantes.

- **Primary**: #DC004E (Acciones y Foco)
- **Secondary**: #0A6151 (Auth y Secundarias)
- **Tipografía**: Plus Jakarta Sans (Headings) e Inter (Body).
- **Temas**: Light, Dark (Slate Modern), High Contrast (Light & Dark).

---

<div class="label">UI Kit</div>

# Componentes reales

Reconstrucción de componentes clave para consistencia.

- **DashboardMetricCard**: Title, value, icon, trend.
- **DashboardQuickAction**: Acciones rápidas con hover animado.
- **ProductCard**: Imagen, alérgenos, PMP, soft-delete.
- **StatusChip**: Estados semánticos (Pedido, Pendiente, Recibido, etc.).

---

<div class="label">Inclusión</div>

# Accesibilidad Universal — WCAG 2.1 AA

Auditoría completa con WAVE y Lighthouse.

- **Gestión de Foco**: Focus ring centralizado en CSS.
- **Screen Readers**: aria-label dinámico, roles semánticos.
- **Navegación Teclado**: Shortcuts F1-F4, Escape en modales.
- **Contraste**: Ratio mín. 4.5:1 (AA).

**Resultados**: 95+ Best Practices, 90+ SEO, 75+ Accessibility.

---

<div class="label">Módulos de la aplicación</div>

# Funcionalidades principales

1. **Catálogo**: Gestión de productos y alérgenos.
2. **Inventario**: Stock FEFO por lotes.
3. **Pedidos**: Flujo borrador → aprobación → recepción.
4. **Recepción**: Wizard de pesaje y verificación.
5. **Recetas**: Escandallos y costes unitarios.
6. **Mermas**: Registro de pérdidas y auditoría.

---

<div class="label">Ingeniería</div>

# Decisiones técnicas clave

- **UUID v7**: IDs temporalmente ordenados para mejor rendimiento en BD.
- **FEFO Inventory**: Prioriza automáticamente lotes próximos a caducar.
- **httpOnly JWT**: Seguridad contra ataques XSS.
- **Soft Delete**: Preservación de datos eliminados para auditoría.
- **SWC Compiler**: Compilación Rust para desarrollo ultrarrápido.

---

<div class="label">Seguridad</div>

# Arquitectura multicapa

- **RBAC granular**: Roles + Permisos adicionales + Permisos excluidos.
- **Protección**: Throttling, JWT, Pipes de validación.
- **Bcrypt**: Hashing de contraseñas (10 rounds).
- **Audit**: ClassSerializer para ocultar campos sensibles.
- **OTP**: Recuperación de contraseña segura.

---

<div class="label">Despliegue</div>

# Instalador automático Electron

Solución con un click para despliegue local.

- **Electron Installer**: Verifica dependencias, descarga Docker, configura DB.
- **Docker Compose**: Entornos separados para Dev, Prod y CI.
- **Multi-plataforma**: Imágenes ARM64 + AMD64 con BuildKit.

---

<div class="label">TFG DAW 2025/2026</div>

# SmartEconomat — Logros

- **Arquitectura profesional**: 27 módulos NestJS, Docker multi-entorno.
- **Design System**: 4 temas, WCAG AA, auditoría real.
- **Flujo real**: 1153 commits, 163 PRs, CI/CD completo.
- **Resultados**: 9 módulos funcionales, 100% TypeScript.

---

<!-- _class: lead -->

# ¿Preguntas?

**Alexis Ruiz · DAW 2025/2026 · SmartEconomat**

Código fuente y documentación disponibles en el repositorio.
🔍 GitHub | 📖 Swagger | 🐳 Docker
