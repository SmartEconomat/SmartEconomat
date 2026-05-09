# Fix bucle infinito en Administración / Usuarios (2026-05-09)

- **Causa:** `useDataTable()` devuelve un **objeto nuevo en cada render** (incluye `paginationProps` anidado). `UsuariosView` usaba `adminTable` / `professorTable` / `studentTable` completos en dependencias de `useCallback` y `useEffect`.
- **Síntomas:** cientos de peticiones a la API, **React error #185** (maximum update depth), UI de usuarios inutilizable dentro del tab Administración.
- **Fix frontend:**
  - `loadUsersByRole` depende de `adminTable.queryParams`, `professorTable.queryParams`, `studentTable.queryParams` (memos estables de `useDataTable`) más `statusFilter`, `t`, `toast`.
  - El efecto que resetea página al cambiar el filtro de estado depende solo de `statusFilter` + los `onPageChange` (callbacks estables).
  - Eliminado `useEffect` duplicado de redirección por `canList`.
- **Tabs Administración:** `activeTab` ya no usa fallback `'slots'` cuando no aplica; valor MUI alineado con `?tab=` vía `replace: true` para URL obsoleta o permisos distintos.

**502 en `GET /usuarios/perfil`:** suele ser proxy/gateway si el proceso Nest cae (p. ej. error SQL). En despliegues previos se corrigió con migraciones `usuario_ubicacion` (ver memoria 2026-05-07 schema drift).
