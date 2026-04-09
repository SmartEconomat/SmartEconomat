# Explicación: Seguridad, performance y escalabilidad

## Seguridad

### Autenticación
- JWT con `passport-jwt`.
- Extracción desde header Bearer y/o cookie.

### Autorización
- Guards de roles y permisos por endpoint.
- Convención de permisos `modulo:accion`.

### Rate limiting
- Guard global de throttling con perfiles de lectura/escritura/auth.

### Validación y saneamiento
- DTOs con class-validator.
- `whitelist` y `forbidNonWhitelisted` activos.

### Protección de errores
- Filtro global que evita exponer información interna de forma accidental.

## Performance

### Medidas aplicadas
- Índices en columnas de búsqueda y FKs.
- Separación por módulos para reducir acoplamiento.
- Cache global (`CacheModule`) para lecturas repetidas.
- Interceptores que estandarizan y simplifican salida.

### Cuellos potenciales
- Endpoints con joins amplios y filtros complejos.
- Operaciones de lote con múltiples validaciones por ítem.

### Recomendaciones
- Añadir métricas de latencia por endpoint.
- Revisar consultas con `EXPLAIN ANALYZE` en tablas críticas.

## Escalabilidad

### Escalabilidad funcional
- Nuevos dominios pueden agregarse como módulos independientes.

### Escalabilidad operativa
- Docker dev/prod habilita despliegues consistentes.
- Configuración por entorno desacopla código de infraestructura.

### Escalabilidad de equipo
- Convenciones homogéneas de DTO, guardias y servicios.
- Documentación Diátaxis para onboarding acelerado.

## OWASP y hardening (líneas de mejora)
- Endurecer política CORS por entorno.
- Reforzar política de cabeceras de seguridad si se requiere.
- Auditoría periódica de dependencias y librerías.
