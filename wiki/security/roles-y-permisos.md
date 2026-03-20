# 🔐 Sistema de Roles y Permisos - SmartEconomat

Este documento detalla la jerarquía de accesos y las capacidades específicas de cada rol dentro del sistema SmartEconomat. La seguridad se basa en una estructura de **RBAC (Role-Based Access Control)** dinámica con 153 permisos granulares gestionados desde base de datos.

---

## 🎭 Resumen de Roles

| Rol | Nivel de Acceso | Descripción |
| :--- | :--- | :--- |
| **SUPER_ADMIN** | 🔴 Total | Acceso absoluto a configuraciones raíz, plantillas de roles y borrado físico. |
| **ADMINISTRADOR** | 🟠 Alto | Gestión completa del centro, usuarios y validación de profesores. |
| **PROFESOR** | 🔵 Operativo | Gestión del día a día, recetas, inventario y supervisión de alumnos. |
| **ALUMNO** | 🟢 Consulta | Acceso limitado para visualización de catálogo, stock y dashboard. |

---

## 📝 Detalle por Rol

### 👑 SUPER_ADMIN
Es el perfil técnico de mantenimiento. 
- **Acciones permitidas:**
  - ✅ **Control Total:** Puede realizar cualquier acción en cualquier módulo.
  - ✅ **Meta-Seguridad:** Es el único que puede alterar la definición de permisos base y las plantillas protegidas.
  - ✅ **Visibilidad Total:** Ve todos los registros, incluidos aquellos con Soft Delete, y puede realizar borrados físicos.

---

### 👔 ADMINISTRADOR
Responsable de la gestión administrativa y humana del economato.
- **Acciones permitidas:**
  - ✅ **Gestión de Usuarios:** Crear, editar y activar usuarios. Validación obligatoria de nuevas cuentas de Profesores.
  - ✅ **Control de Inventario:** Gestión de ubicaciones y ajustes de stock manuales.
  - ✅ **Auditoría:** Acceso a historial de movimientos y visualización de registros eliminados (Soft Delete).
  - ✅ **Seguridad Granular:** Puede otorgar o denegar permisos específicos a usuarios individuales mediante checklists en el perfil de usuario.

---

### 👨‍🏫 PROFESOR
Perfil centrado en la operativa docente y la gestión de sus alumnos vinculados.
- **Acciones permitidas:**
  - ✅ **Operativa de Stock:** Crear productos, pedidos, recepciones y registrar mermas.
  - ✅ **Gestión de Recetas:** Ciclo completo de recetas: creación, edición, duplicado y ejecución de producción.
  - ✅ **Sistema Educativo:** Generación de **Slots** (códigos de clase) y activación de sus propios alumnos.
  - ✅ **Incidencias:** Registro y resolución de incidencias operativas.
- **Restricciones:**
  - ❌ **Sin Borrado:** No puede eliminar productos, pedidos ni registros críticos (solo lectura de lo existente).
  - ❌ **Aislamiento:** Solo gestiona a los alumnos vinculados a sus propios códigos de clase.

---

### 🎓 ALUMNO
Perfil de consulta académica.
- **Acciones permitidas:**
  - ✅ **Aprendizaje:** Visualización detallada del catálogo de productos, alérgenos y proveedores vincualdos.
  - ✅ **Stock:** Consulta de existencias por ubicación en tiempo real.
  - ✅ **Dashboard:** Acceso a estadísticas de consumo y tendencias del economato.
- **Restricciones:**
  - ❌ **Solo Lectura:** No posee permisos de creación, edición ni eliminación en ningún módulo operativo.

---

## 📂 Matriz de Capacidades

| Módulo | SUPER_ADMIN | ADMIN | PROFESOR | ALUMNO |
| :--- | :---: | :---: | :---: | :---: |
| **Gestión Usuarios** | Full | Full | Solo propios Alumnos | ❌ |
| **Productos** | Full | Full | Crear / Editar | Solo Ver |
| **Inventario** | Full | Full | Ajustar Stock | Solo Ver |
| **Pedidos / Recepción** | Full | Full | Operar (Sin Eliminar) | ❌ |
| **Recetas / Producción**| Full | Full | Operar (Sin Eliminar) | ❌ |
| **Incidencias / Merma**  | Full | Full | Crear / Resolver | ❌ |
| **Roles / Permisos** | Config. | Asignar | ❌ | ❌ |
| **Dashboard / Stats** | Full | Full | Ver / Exportar | Solo Ver |

---

## 💡 Notas de Implementación
1.  **Transversalidad**: El sistema comprueba permisos tanto en el frontend (para ocultar botones) como en el backend (Guards) para asegurar la integridad.
2.  **Soft Delete**: Los registros "eliminados" por un Administrador desaparecen para el Profesor y Alumno, pero permanecen accesibles para auditoría en el panel de Administración.
3.  **Herencia**: Si un usuario tiene varios roles, sus permisos se suman. Si se le asigna un permiso individual extracurricular, este se añade a su lista final.

---
## 🔗 Relacionado
- [Permisos Dinámicos (Técnico)](./security/permisos-dinamicos.md)
- [Soft Delete (Arquitectura)](./architecture/soft-delete.md)
