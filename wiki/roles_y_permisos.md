# 🔐 Sistema de Roles y Permisos - SmartEconomat

Este documento detalla la jerarquía de accesos y las capacidades específicas de cada rol dentro del sistema SmartEconomat. La seguridad se basa en una estructura de **RBAC (Role-Based Access Control)** con permisos granulares por módulo y acción.

---

## 🎭 Resumen de Roles

| Rol | Nivel de Acceso | Descripción |
| :--- | :--- | :--- |
| **SUPER_ADMIN** | 🔴 Total | Acceso absoluto a todas las funciones y configuraciones del sistema. |
| **ADMINISTRADOR** | 🟠 Alto | Gestión completa del economato y de los usuarios. |
| **PROFESOR** | 🔵 Operativo | Gestión del día a día, recetas y supervisión de alumnos. |
| **ALUMNO** | 🟢 Consulta | Acceso limitado para visualización de catálogo y stock. |

---

## 📝 Detalle por Rol

### 👑 SUPER_ADMIN
Es el perfil técnico y de máximo nivel. Generalmente reservado para mantenimiento del sistema.
- **Acciones permitidas:**
  - ✅ **TODO:** Sin restricciones.
  - ✅ Gestión de la arquitectura de seguridad (Crear/Eliminar Permisos).
  - ✅ Gestión de plantillas de roles.
  - ✅ Eliminación física/permanente de registros críticos.

---

### 👔 ADMINISTRADOR
Responsable principal del centro y de la gestión humana del sistema.
- **Acciones permitidas:**
  - ✅ **Gestión de Usuarios:** Crear, editar, activar/desactivar y resetear contraseñas de cualquier usuario.
  - ✅ **Operaciones Totales:** Control total sobre Productos, Pedidos, Albaranes, Recepciones e Incidencias.
  - ✅ **Inventario:** Ajustes de stock manuales y gestión de ubicaciones.
  - ✅ **Seguridad:** Puede ver y gestionar permisos, pero tiene restricciones en la alteración de plantillas raíz que afecten al Super Admin.
- **Lo que NO puede hacer:**
  - ❌ Eliminar el rol de SUPER_ADMIN o modificar sus propios permisos base si están bloqueados por sistema.

---

### 👨‍🏫 PROFESOR
Perfil orientado a la docencia y la operatividad del economato.
- **Acciones permitidas:**
  - ✅ **Catálogo:** Crear y editar Productos (sin eliminar).
  - ✅ **Operativa:** Crear Pedidos, Recepciones y registrar Movimientos.
  - ✅ **Recetas:** Crear, editar, duplicar y ejecutar producciones (cocinado).
  - ✅ **Alumnos:** Gestionar "Slots" de alumnos, activarlos y ver sus estadísticas.
  - ✅ **Dashboard:** Ver estadísticas de consumo y exportar reportes.
- **Restricciones Críticas:**
  - ❌ **SIN ELIMINACIÓN:** Por seguridad, este rol no puede eliminar registros de productos, pedidos o movimientos realizados.
  - ❌ **SIN GESTIÓN DE USUARIOS:** No puede ver ni editar otros profesores o administradores.

---

### 🎓 ALUMNO
Perfil de consulta enfocado en el aprendizaje y la visualización de recursos.
- **Acciones permitidas:**
  - ✅ **Lectura:** Ver el catálogo de productos y sus detalles (alérgenos, proveedores).
  - ✅ **Consulta:** Ver el stock actual en inventario y ubicaciones de almacén.
  - ✅ **Estadísticas:** Ver el dashboard de estadísticas generales.
  - ✅ **Albaranes:** Visualizar albaranes existentes.
- **Restricciones Críticas:**
  - ❌ **SÓLO LECTURA:** No puede crear, editar ni eliminar absolutamente nada.
  - ❌ **SIN GESTIÓN:** No tiene acceso a módulos de usuarios, proveedores, incidencias ni configuración.

---

## 📂 Matriz de Módulos y Permisos

| Módulo | SUPER_ADMIN | ADMIN | PROFESOR | ALUMNO |
| :--- | :---: | :---: | :---: | :---: |
| **Usuarios** | Full | Full | ❌ | ❌ |
| **Productos** | Full | Full | Crear/Editar | Ver |
| **Pedidos** | Full | Full | Crear/Editar | ❌ |
| **Recepciones** | Full | Full | Crear/Editar | ❌ |
| **Incidencias** | Full | Full | Crear/Editar/Res. | ❌ |
| **Inventario** | Full | Full | Ajustar Stock | Ver |
| **Recetas** | Full | Full | Full (sin elim.) | ❌ |
| **Roles/Permisos** | Full | Ver/Gest. | ❌ | ❌ |
| **Dashboard** | Full | Full | Ver | Ver |

---

## 💡 Notas Técnicas
- **Soft Delete:** La mayoría de las eliminaciones son "lógicas". Los administradores pueden ver registros eliminados, pero los profesores no.
- **Trazabilidad:** Cada vez que el PROFESOR o ALUMNO realiza una acción (reducida al login/lectura), el sistema registra el `userId` en los movimientos y logs de auditoría para asegurar un entorno educativo responsable.
