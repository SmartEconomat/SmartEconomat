# 📊 TRACKER DE IMPLEMENTACIÓN
## Strings Hardcodeados - SmartEconomat

**Estado actual:** ⏳ No iniciado  
**Última actualización:** 1 de mayo de 2026  
**Responsable:** [Asignar]

---

## 🎯 PROGRESO GENERAL

```
████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0% (0/19)

CRÍTICOS:   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0% (0/3)
ALTOS:      ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0% (0/5)
MEDIOS:     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0% (0/11)
```

---

## 🔴 TAREAS CRÍTICAS (Implementar YA)

### CRÍTICA #1: usuarioService.ts - Enums de Estado
**Archivo:** `frontend/src/services/usuarioService.ts`  
**Líneas:** 30, 83-88  
**Severidad:** 🔴 CRÍTICA  
**Estimado:** 2 horas  

**Tareas:**
- [ ] Crear enum `UserStatusEnum` en `frontend/src/enums/user-status.enum.ts`
- [ ] Crear utils `usuario-status.utils.ts` con mapeos
- [ ] Actualizar i18n con keys `usuario.status.*`
- [ ] Refactorizar `mapBackendToFrontend()` 
- [ ] Refactorizar `mapFrontendToBackend()`
- [ ] Tests para utils
- [ ] Code review
- [ ] Merge a develop

**Checklist:**
```
PREPARACIÓN:
[ ] Crear rama: feature/user-status-enum
[ ] Crear enum UserStatusEnum
[ ] Crear utils para mapeo

IMPLEMENTACIÓN:
[ ] Actualizar i18n/es.json
[ ] Actualizar i18n/en.json
[ ] Refactorizar usuarioService.ts
[ ] Validar mapeos bidireccionales

TESTING:
[ ] Tests unitarios para utils
[ ] Tests de traducción
[ ] Validar cambio de idioma

MERGE:
[ ] Code review aprobado
[ ] Tests pasando
[ ] Merge a develop
```

**Nota de implementación:**
```typescript
// Ver detalles en: .github/audits/hardcoded-strings-code-examples.md
// Sección: "HALLAZGO #2: usuarioService.ts"
```

**Dependencias:** Ninguna  
**Bloqueado por:** Ninguno  
**Bloquea:** #CRÍTICA #2, #CRÍTICA #3

---

### CRÍTICA #2: UsuariosView.tsx - Comparaciones de Activo
**Archivo:** `frontend/src/pages/Usuarios/UsuariosView.tsx`  
**Líneas:** 437, 528, 542, 563, 568  
**Severidad:** 🔴 CRÍTICA  
**Estimado:** 1.5 horas  

**Tareas:**
- [ ] Importar `UserStatusEnum` (después de CRÍTICA #1)
- [ ] Importar utils de mapeo
- [ ] Refactorizar línea 437 (toggle de estado)
- [ ] Refactorizar línea 528 (chip status)
- [ ] Refactorizar línea 542 (icon button color)
- [ ] Refactorizar líneas 563, 568 (condicionales)
- [ ] Tests
- [ ] Code review

**Checklist:**
```
PREPARACIÓN:
[ ] Esperar a que CRÍTICA #1 se complete
[ ] Crear rama: feature/usuarios-view-enum-fix
[ ] Imports necesarios

IMPLEMENTACIÓN:
[ ] Línea 437: onToggleStatus function
[ ] Línea 528: Status chip
[ ] Línea 542: Icon button
[ ] Líneas 563, 568: Condicionales
[ ] Validar que todas comparaciones usan enum

TESTING:
[ ] Tests para toggle
[ ] Tests para render
[ ] Validar traducción

MERGE:
[ ] Code review
[ ] Tests pasando
[ ] Merge a develop
```

**Nota de implementación:**
```typescript
// Ver detalles en: .github/audits/hardcoded-strings-code-examples.md
// Sección: "HALLAZGO #3: UsuariosView.tsx"
```

**Dependencias:** CRÍTICA #1 ✅  
**Bloqueado por:** CRÍTICA #1  
**Bloquea:** Ninguno

---

### CRÍTICA #3: UserModal.tsx - Toggle y Comparaciones
**Archivo:** `frontend/src/pages/Usuarios/UserModal.tsx`  
**Líneas:** 282, 307, 356, 511, 513, 523  
**Severidad:** 🔴 CRÍTICA  
**Estimado:** 2 horas  

**Tareas:**
- [ ] Importar `UserStatusEnum` (después de CRÍTICA #1)
- [ ] Importar utils de mapeo
- [ ] Refactorizar línea 282 (filter de usuarios)
- [ ] Refactorizar línea 307 (validación de inactivo)
- [ ] Refactorizar línea 356 (toggle)
- [ ] Refactorizar líneas 511, 513 (button styling)
- [ ] Refactorizar línea 523 (condicional render)
- [ ] Tests
- [ ] Code review

**Checklist:**
```
PREPARACIÓN:
[ ] Esperar a que CRÍTICA #1 se complete
[ ] Crear rama: feature/user-modal-enum-fix
[ ] Imports necesarios

IMPLEMENTACIÓN:
[ ] Línea 282: Filter usuarios activos
[ ] Línea 307: Validación de estado
[ ] Línea 356: Toggle logic
[ ] Línea 511: Button variant logic
[ ] Línea 513: Button color logic
[ ] Línea 523: Conditional render
[ ] Validar toggle siempre invierte correctamente

TESTING:
[ ] Tests para toggle
[ ] Tests para validaciones
[ ] Tests para render
[ ] Validar traducción

MERGE:
[ ] Code review
[ ] Tests pasando
[ ] Merge a develop
```

**Dependencias:** CRÍTICA #1 ✅  
**Bloqueado por:** CRÍTICA #1  
**Bloquea:** Ninguno

---

## 🔴 TAREAS ALTAS (Esta Sprint)

### ALTA #1: Recepcion.tsx - Labels de Sincronización
**Archivo:** `frontend/src/pages/Recepcion.tsx`  
**Líneas:** 1321, 1332, 1343, 1354, 1535-1551  
**Severidad:** 🔴 ALTA  
**Estimado:** 1.5 horas  
**Dependencias:** Ninguna (pero después de CRÍTICA #1)

- [ ] Crear labels map con i18n
- [ ] Crear tooltips map con i18n
- [ ] Actualizar i18n con claves de sync
- [ ] Refactorizar chips de estado
- [ ] Refactorizar diálogos de confirmación
- [ ] Tests

---

### ALTA #2: NotificationCenter.tsx - Prioridades
**Archivo:** `frontend/src/components/common/Notification/NotificationCenter.tsx`  
**Línea:** 417  
**Severidad:** 🔴 ALTA  
**Estimado:** 1 hora  
**Dependencias:** Ninguna

- [ ] Crear enum `NotificationPriorityEnum`
- [ ] Crear mapping con `getEnumLabel()`
- [ ] Actualizar i18n
- [ ] Refactorizar componente
- [ ] Tests

---

### ALTA #3: ProductoFormModal.tsx - Botones
**Archivo:** `frontend/src/features/productos/ProductoFormModal.tsx`  
**Línea:** 220  
**Severidad:** 🔴 ALTA  
**Estimado:** 0.5 horas  
**Dependencias:** Ninguna

- [ ] Reemplazar strings con `t()` calls
- [ ] Actualizar i18n
- [ ] Tests

---

### ALTA #4: Administracion.tsx - Toggle
**Archivo:** `frontend/src/pages/Administracion.tsx`  
**Línea:** 481  
**Severidad:** 🔴 ALTA  
**Estimado:** 1 hora  
**Dependencias:** CRÍTICA #1

- [ ] Usar `UserStatusEnum` para toggle
- [ ] Tests

---

### ALTA #5: LoginForm + RegisterForm
**Archivos:** `LoginForm.tsx`, `RegisterForm.tsx`  
**Líneas:** 333, 389  
**Severidad:** 🔴 ALTA  
**Estimado:** 1 hora  
**Dependencias:** Ninguna

- [ ] Reemplazar labels con `t()` calls
- [ ] Actualizar i18n
- [ ] Tests

---

## 🟡 TAREAS MEDIAS (Próximo Sprint)

### MEDIA #1: DetailModal.tsx
- [ ] Reemplazar "Editar" con `t('comun.editar')`
- [ ] Tests

### MEDIA #2: StatusChip.tsx
- [ ] Consistencia en enum handling
- [ ] Usar `getEnumLabel()` en todos los cases
- [ ] Tests

### MEDIA #3: Productos.tsx
- [ ] Reemplazar 'active'/'deleted' con proper enums
- [ ] Tests

### MEDIA #4: ProfessorStudentList.tsx
- [ ] Crear enum para status de estudiante
- [ ] Usar comparación con enum
- [ ] Tests

### MEDIA #5-10: Backend Seeders
- [ ] Refactorizar create-product.usecase.ts:31
- [ ] Refactorizar SeedCatalogoProductos.ts:625,671
- [ ] Refactorizar string-to-date.transformer.ts
- [ ] Refactorizar string-to-boolean.transformer.ts
- [ ] Refactorizar PlantillasRolesController.ts:110

---

## 📈 GRÁFICO DE GANTT

```
SEMANA 1 (Mayo 6-10)
├─ CRÍTICA #1: usuarioService.ts    [████████░░] 80%
├─ ALTA #2: NotificationCenter.tsx  [████░░░░░░] 40%
└─ ALTA #1: Recepcion.tsx           [██░░░░░░░░] 20%

SEMANA 2 (Mayo 13-17)
├─ CRÍTICA #1: usuarioService.ts    [██████████] 100% ✅
├─ CRÍTICA #2: UsuariosView.tsx     [████████░░] 80%
├─ CRÍTICA #3: UserModal.tsx        [████████░░] 80%
└─ ALTA #3-5: Otros                 [████░░░░░░] 40%

SEMANA 3 (Mayo 20-24)
├─ Todos CRÍTICOS y ALTOS           [██████████] 100% ✅
├─ MEDIA #1-4: Iniciar              [██░░░░░░░░] 20%
└─ Testing + Validación             [████░░░░░░] 40%
```

---

## 🔄 ESTADO POR ARCHIVO

| Archivo | Estado | Progreso | Responsable | ETA |
|---------|--------|----------|------------|-----|
| usuarioService.ts | ⏳ No iniciado | 0% | - | - |
| UsuariosView.tsx | ⏳ Pendiente CRÍTICA #1 | 0% | - | - |
| UserModal.tsx | ⏳ Pendiente CRÍTICA #1 | 0% | - | - |
| Recepcion.tsx | ⏳ No iniciado | 0% | - | - |
| NotificationCenter.tsx | ⏳ No iniciado | 0% | - | - |
| ProductoFormModal.tsx | ⏳ No iniciado | 0% | - | - |
| Administracion.tsx | ⏳ No iniciado | 0% | - | - |
| LoginForm.tsx | ⏳ No iniciado | 0% | - | - |
| RegisterForm.tsx | ⏳ No iniciado | 0% | - | - |
| DetailModal.tsx | ⏳ No iniciado | 0% | - | - |
| StatusChip.tsx | ⏳ No iniciado | 0% | - | - |
| Productos.tsx | ⏳ No iniciado | 0% | - | - |
| ProfessorStudentList.tsx | ⏳ No iniciado | 0% | - | - |
| Backend Seeders (5) | ⏳ No iniciado | 0% | - | - |

---

## 🎓 CRITERIOS DE ACEPTACIÓN

Para cada tarea se requiere:

### ✅ Código
- [ ] Sin `===` con strings literales de enum
- [ ] Todo texto con `t()` calls
- [ ] Enums importados y usados correctamente
- [ ] Sin hardcoded strings en labels/values

### ✅ i18n
- [ ] Todas las keys añadidas a `es.json`
- [ ] Todas las keys añadidas a `en.json`
- [ ] Valores consistentes
- [ ] No omitir ningún idioma

### ✅ Testing
- [ ] Tests unitarios pasan
- [ ] Tests de traducción pasan
- [ ] Cambio de idioma verifica traducción correcta
- [ ] Enum changes en backend no rompen frontend

### ✅ Review
- [ ] Code review aprobado
- [ ] No comentarios pendientes
- [ ] Build success
- [ ] Linter sin errores

---

## 🚨 BLOQUEADORES CONOCIDOS

Ninguno en este momento.

---

## 📞 CONTACTO

**Audit realizado por:** Auditoría Automatizada  
**Documentación:** `.github/audits/`  
**Para más detalles:** Ver archivos en `audits/`

---

## 📝 NOTAS DE IMPLEMENTACIÓN

```
1. SIEMPRE crea rama feature/ basada en develop
2. SIEMPRE hace build antes de push
3. SIEMPRE corre tests antes de PR
4. SIEMPRE pide code review de 2 personas
5. SIEMPRE valida traducción en múltiples idiomas
```

---

**TRACKER ACTUALIZADO: 1 de mayo de 2026**

Para actualizar este archivo, editar la sección relevante y cambiar el estado.
