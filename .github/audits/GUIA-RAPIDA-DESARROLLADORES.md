# ⚡ GUÍA RÁPIDA PARA DESARROLLADORES
## Cómo Arreglar Strings Hardcodeados

**Versión:** 1.0  
**Última actualización:** 1 de mayo de 2026  

---

## 🎯 TL;DR (2 minutos)

### ❌ NUNCA HAGAS ESTO
```typescript
// ❌ Hardcodeado español
label="Guardar"

// ❌ Hardcodeado inglés
status="Save"

// ❌ Comparación con string
if (user.estado === 'Activo') { }

// ❌ Enum hardcodeado
label={status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
```

### ✅ SIEMPRE HAZ ESTO
```typescript
// ✅ Con i18n
label={t('comun.guardar')}

// ✅ Con enum
import { UserStatusEnum } from '@enums/user-status.enum';
if (user.estado === UserStatusEnum.ACTIVE) { }

// ✅ Con getEnumLabel
label={getEnumLabel(t, 'userStatus', user.estado)}
```

---

## 📋 CHECKLIST ANTES DE COMMIT

- [ ] Busqué todos los strings de usuario en mi código
- [ ] Todos los labels usan `t('key')`
- [ ] Todas las comparaciones de enum usan constantes, no strings
- [ ] Agregué las nuevas keys a `i18n/es.json` Y `i18n/en.json`
- [ ] Corrí `npm run build` sin errores
- [ ] Tests pasan
- [ ] Cambié idioma a inglés y verifiqué que se traduce

---

## 🔧 PROCESO PASO A PASO

### Paso 1: Identificar Strings
```typescript
// En tu componente, busca:
label="Guardar"           // ← Hardcodeado
submitLabel="Crear"       // ← Hardcodeado
return 'Pendiente'        // ← Hardcodeado
```

### Paso 2: Crear Enum (si es necesario)
```typescript
// frontend/src/enums/mi-enum.enum.ts
export enum MiEnum {
  OPCION_A = 'opcion_a',
  OPCION_B = 'opcion_b',
}
```

### Paso 3: Agregar Keys de i18n
```json
// i18n/es.json
{
  "miComponente": {
    "botonGuardar": "Guardar",
    "botonCancelar": "Cancelar"
  }
}

// i18n/en.json
{
  "miComponente": {
    "botonGuardar": "Save",
    "botonCancelar": "Cancel"
  }
}
```

### Paso 4: Refactorizar Código
```typescript
// ANTES
label="Guardar"

// DESPUÉS
const { t } = useTranslation();
label={t('miComponente.botonGuardar')}
```

### Paso 5: Validar
```bash
npm run build      # ✅ Sin errores
npm test          # ✅ Tests pasan
# Cambiar idioma en app y verificar que se traduce
```

---

## 🎨 PATRONES COMUNES

### Patrón 1: Labels en Componentes

```typescript
// ❌ ANTES
<TextField label="Nombre" />

// ✅ DESPUÉS
const { t } = useTranslation();
<TextField label={t('form.nombre')} />
```

### Patrón 2: Comparaciones de Enum

```typescript
// ❌ ANTES
if (status === 'ACTIVE') { }

// ✅ DESPUÉS
import { UserStatusEnum } from '@enums/user-status.enum';
if (status === UserStatusEnum.ACTIVE) { }
```

### Patrón 3: Mostrar Enum al Usuario

```typescript
// ❌ ANTES
<span>{user.estado}</span>  // Muestra "ACTIVE" o "Activo"

// ✅ DESPUÉS
import { getEnumLabel } from '@i18n/enumPresentation';
<span>{getEnumLabel(t, 'userStatus', user.estado)}</span>
// Muestra "Active" o "Activo" dependiendo del idioma
```

### Patrón 4: Ternario con Strings

```typescript
// ❌ ANTES
color={status === 'ACTIVE' ? 'success' : 'error'}
label={status === 'ACTIVE' ? 'Activo' : 'Inactivo'}

// ✅ DESPUÉS
color={status === UserStatusEnum.ACTIVE ? 'success' : 'error'}
label={getEnumLabel(t, 'userStatus', status)}
```

### Patrón 5: Toggle de Estado

```typescript
// ❌ ANTES
const newStatus = status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

// ✅ DESPUÉS
const newStatus = status === UserStatusEnum.ACTIVE 
  ? UserStatusEnum.INACTIVE 
  : UserStatusEnum.ACTIVE;
```

---

## 🔍 BÚSQUEDA Y REEMPLAZO EN IDE

### Buscar strings sin traducción
```regex
label\s*=\s*["'](?!.*t\()
value\s*=\s*["'](?!.*t\()
===\s*["'](Activo|ACTIVE|Pendiente)
```

### Buscar comparaciones hardcodeadas
```regex
===\s*["'](Activo|INACTIVE|Pendiente|ACTIVE)
===\s*['"][A-Z][a-zA-Z]*["']
```

---

## 📖 REFERENCIAS RÁPIDAS

### Ubicación de Archivos Clave
```
frontend/src/
├─ enums/                  ← Crear/editar enums aquí
├─ i18n/
│  ├─ es.json            ← Strings español
│  ├─ en.json            ← Strings inglés
│  └─ enumPresentation.ts ← getEnumLabel() helper
├─ components/
├─ pages/
└─ services/
```

### Imports Frecuentes
```typescript
// Traducción
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();

// Enums
import { UserStatusEnum } from '@enums/user-status.enum';
import { NotificationPriorityEnum } from '@enums/notification-priority.enum';

// Helpers
import { getEnumLabel } from '@i18n/enumPresentation';
```

---

## 🚨 ERRORES COMUNES

### ❌ Error 1: Olvidar i18n en ambos idiomas
```typescript
// Malo: Solo en español
// i18n/es.json
{ "form.nombre": "Nombre" }

// Mejor: En ambos idiomas
// i18n/es.json
{ "form.nombre": "Nombre" }
// i18n/en.json
{ "form.nombre": "Name" }
```

### ❌ Error 2: Crear enum pero no usarlo
```typescript
// Malo: Crear enum pero seguir comparando con string
export enum Status { ACTIVE = 'ACTIVE' }
// Luego en código:
if (status === 'ACTIVE') { }  // ← Sigue siendo string!

// Bien:
if (status === Status.ACTIVE) { }
```

### ❌ Error 3: Olvidar `const { t } = useTranslation()`
```typescript
// Malo: Usar t() sin importar
<label>{t('form.nombre')}</label>  // ❌ 't' is undefined

// Bien:
const { t } = useTranslation();
<label>{t('form.nombre')}</label>  // ✅
```

### ❌ Error 4: Keys inconsistentes entre idiomas
```typescript
// Malo: Keys diferentes
// i18n/es.json
{ "usuario": { "activo": "Activo" } }
// i18n/en.json
{ "usuario": { "active": "Active" } }  // ← Key diferente!

// Bien: Mismo path en ambos
// i18n/es.json
{ "usuario": { "status_activo": "Activo" } }
// i18n/en.json
{ "usuario": { "status_activo": "Active" } }
```

---

## 🎓 APRENDER MÁS

### Documentos Relacionados
```
.github/audits/
├─ README.md                           ← Punto de partida
├─ hardcoded-strings-summary.md        ← Resumen ejecutivo
├─ hardcoded-strings-audit.md          ← Análisis completo
├─ hardcoded-strings-code-examples.md  ← Ejemplos detallados
└─ TRACKER-IMPLEMENTACION.md           ← Estado del proyecto
```

### Archivo de Referencia del Proyecto
- Enums: `frontend/src/enums/`
- i18n helper: `frontend/src/i18n/enumPresentation.ts`
- Traducción: `frontend/public/locales/[lang]/`

---

## 💡 TIPS Y TRUCOS

### Tip 1: Usar snippets de VS Code
```json
// .vscode/smarteconomat.code-snippets
{
  "i18n string": {
    "prefix": "t18n",
    "body": "const { t } = useTranslation();\n$0"
  },
  "getEnumLabel": {
    "prefix": "genlabel",
    "body": "getEnumLabel(t, '${1:enumKey}', ${2:value})"
  }
}
```

### Tip 2: Validar i18n rápido
```typescript
// En consola del navegador:
// Verifica si una key existe
import i18n from './i18n/i18n-config';
i18n.t('usuario.status.activo')  // Verá "Activo" o [usuario.status.activo]
```

### Tip 3: Búsqueda de missing keys
```bash
# En terminal:
grep -r "t\(['\"]" src/ | grep -o "'[^']*'" | sort -u
# Te mostrará todas las keys que usas
```

---

## 📞 AYUDA RÁPIDA

**¿Qué archivo editar?**
```
├─ Quiero traducir un label
│  └─ Edita: i18n/es.json + i18n/en.json
│
├─ Quiero crear un enum
│  └─ Crea: frontend/src/enums/mi-enum.enum.ts
│
├─ Quiero comparar enum
│  └─ Importa el enum y usa MyEnum.VALUE
│
└─ Quiero mostrar enum al usuario
   └─ Usa: getEnumLabel(t, 'enumKey', value)
```

**¿Cómo valido que funciona?**
```bash
1. npm run build        # Verifica compilación
2. npm test            # Verifica tests
3. En app: cambiar idioma    # Verifica traducción
4. Revisar console (F12)     # Verifica errores
```

---

## ✅ CHECKLIST FINAL

Antes de hacer push, verifica:

- [ ] Sin strings hardcodeados en `label`, `value`, `title`
- [ ] Todas las comparaciones de enum usan constantes
- [ ] Todas las keys de i18n en AMBOS idiomas
- [ ] `npm run build` sin errores
- [ ] `npm test` pasa
- [ ] Probé cambio de idioma en la app
- [ ] Code review de 2 personas
- [ ] Commit message describe el cambio

---

## 🚀 LISTO PARA COMENZAR?

1. Elige un archivo de la lista en `TRACKER-IMPLEMENTACION.md`
2. Lee los detalles en `hardcoded-strings-code-examples.md`
3. Sigue los patrones de esta guía
4. Haz un PR cuando termines

**¡Gracias por mantener el código limpio y traducible!** 🙏

---

**v1.0 - Última actualización: 1 de mayo de 2026**
