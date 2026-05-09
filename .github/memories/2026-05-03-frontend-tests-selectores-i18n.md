# 2026-05-03 - Frontend tests: selectores resilientes i18n

## Contexto
En smart-economat-frontend fallaban tests por depender de labels exactas en espanol/ingles y por timeouts cortos en interacciones con debounce/modal.

## Reglas aplicadas
- En Playwright auth, priorizar selectores estables por atributo (input[name="email"], input[name="password"]) y regex multi-idioma para botones/enlaces.
- En tests RTL con autocomplete, evitar placeholder literal y seleccionar inputs por rol dentro de la fila activa.
- En tests con modal/acciones async, usar `waitFor` con timeout explicito cuando hay debounce o cascada de updates.
- Mantener mapeo de estado de usuario compatible con valores backend legacy: ACTIVO/INACTIVO ademas de ACTIVE/INACTIVE.

## Verificacion
- npm test frontend: 46 files, 135 tests en verde.
- npm run test:e2e frontend: 21/21 en verde.
