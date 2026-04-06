# Wiki Audit Progress

## Task
Auditoría THOROUGH READ-ONLY de /home/psych/projects/SmartEconomat/wiki
Detectar: duplicados, inconsistencias, enlaces rotos, problemas de estructura

## Findings Summary
- Wiki tiene ~150+ archivos distribuidos en 20+ carpetas
- Arquitectura por Diátaxis (Tutorials, How-to, Explanation, Reference)
- Stack: NestJS 11 · TypeORM 0.3.27 · React 19 · Node >= 22.2

## Key Issues Found

### 1. DUPLICADOS EN SEGURIDAD (3 docs sobre permisos)
- roles-y-permisos.md: descripción de roles/matriz  
- rbac.md: técnico de implementación con referencias de código
- permisos-dinamicos.md: arquitectura del sistema dinámicos
- OVERLAPS: mismo contenido en diferentes versiones, no referencias cruzadas

### 2. DUPLICADOS EN SISTEMA EDUCATIVO/AUTH
- security/auth-sistema-educativo.md (más viejo?)
- sistema-educativo-auth.md (top-level, más reciente?)
- Contenido muy similar, ambos sobre registro/slots/activación

### 3. ENLACES ROTOS EN architecture/index.md
- Apunta a ./reference/frontend.md → NO EXISTE (solo backend.md)
- Apunta a ./reference/data-model.md → INCORRECTO (está en ../data-model.md)
- Apunta a ./explanation/decisiones-arquitectonicas.md → NO EXISTE 
- Apunta a ./explanation/uuid-v7.md → INCORRECTO (está en ../uuid-v7.md)
- Apunta a ./explanation/soft-delete.md → INCORRECTO (está en ../soft-delete.md)

### 4. DUPLICADOS EN DEPLOYMENT (3 docs)
- DEPLOYMENT.md: genérico Linux/Windows auto
- PRODUCTION.md: específico Azure VM con IP nip.io
- Windows-Deployment.md: específico Windows Server 2025 Azure
- Overlap: configuración variables, setup docker-compose, SSL

### 5. ENLACES ROTOS EN README.md (raíz)
- Menciona: frontend/hooks-permisos.md ✓ EXISTE
- Menciona: reference/postman/... ✓ EXISTE
- Menciona: architecture/backend-nestjs-typeorm.md ✓ EXISTE

### 6. INCONSISTENCIAS DE PATHS
- Wiki menciona archivos como: "backend/smart-economat-backend/src/modules/auth/decorators/roles.decorator.ts"
- Archivos existen pero estructura no siempre lineal

### 7. NO HAY DOCUMENTACIÓN DE ALGUNOS MÓDULOS
- Falta doc clara de módulos educativo (profesor, alumno)
- Falta doc de algunos DTOs y validadores


## Editorial Pass 2
- Segunda pasada editorial fina completada sobre docs de alto uso (`getting-started`, `development`, `modules/recepcion`, `architecture/ui-inventario`, `planning/use-cases`, `operations/troubleshooting`).
- Cambios: títulos sobrios, retirada de iconografía heredada, tono más homogéneo, limpieza de cierres legacy y corrección de Swagger local a `/docs` en la guía rápida backend.
- Verificación realizada: búsqueda dirigida de restos (`api/v1/docs`, `PARCHE INYECTADO`, cierres `SmartEconomat Wiki -` y emojis en headings) sin resultados; sin marcadores de conflicto en `wiki/`; sin errores del editor en los archivos tocados.
