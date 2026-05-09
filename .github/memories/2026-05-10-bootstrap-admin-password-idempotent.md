# Bootstrap admin: contraseña estable entre arranques

- Las migraciones TypeORM **no** actualizan `usuario.password`; si la contraseña «cambia al correr migraciones», suele ser porque en el mismo flujo se ejecuta **seed/bootstrap** (`RUN_BOOTSTRAP_SEEDER`, `npm run seed`, `seed:bootstrap-admin-users`, etc.).
- `npm run migration:run` en Docker dev solo aplica migraciones pendientes (idempotente sobre contraseñas).
- **`SEED_BOOTSTRAP_OVERWRITE_EXISTING_ADMIN_PASSWORD`**: solo con valor explícito `true`/`1`/`yes` se **vuelve a hashear y guardar** contraseña de admin/superadmin ya existentes (bootstrap CLI, seed masivo vía `upsertSeedUserViaRepository`, y `SeedContext.ensureBootstrapAdminCredentials`).
- Por defecto (variable ausente): **no** se pisan contraseñas de admin existentes en ningún `NODE_ENV`.
- Contraseña en texto plano del seed masivo canon (admin/superadmin fijos) viene de **`resolveBootstrapAdminUsersFromEnv`**: cadena única por proceso; sirve `SEED_DEFAULT_ADMIN_TEMP_PASSWORD`, luego **`SEED_BOOTSTRAP_ADMIN_PASSWORD`**, y si no hay nada en dev aleatorio.
- Para **forzar** reset de admins a lo definido en env: `SEED_BOOTSTRAP_OVERWRITE_EXISTING_ADMIN_PASSWORD=true` y ejecutar el bootstrap o seed que corresponda.
