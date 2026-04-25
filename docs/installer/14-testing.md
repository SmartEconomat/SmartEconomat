# 14. Testing

La estrategia de pruebas es completa, cubriendo desde la lógica individual hasta el flujo de usuario final.

## Niveles de Testing

### 1. Tests Unitarios (Vitest)
Ubicados en `test/` y junto a los archivos de código (`*.test.ts`).
- **Alcance**: Validación de esquemas Zod, utilidades de red, generadores de configuración `.env` y lógica de la máquina de estados.
- **Mocking**: Se utiliza intensivamente el mocking de módulos nativos (fs, path, child_process) para probar la lógica sin afectar al sistema operativo real.

### 2. Tests End-to-End (Playwright)
Ubicados en la carpeta raíz de tests y configurados en `playwright.config.ts`.
- **Escenarios**:
    - Flujo completo de bienvenida y preflight.
    - Validación de formularios de configuración.
    - Simulación de una instalación exitosa.
    - Comprobación de que el panel de control muestra los servicios correctamente.
- **Valor**: Estos tests garantizan que el empaquetado de Electron no rompa la funcionalidad de la aplicación en las diferentes plataformas.

## Cobertura (Estrategia Recomendada)

Aunque el proyecto ya tiene una base de tests sólida, para escalar a nivel empresarial se recomienda:
- **Pruebas de Integración con Docker**: Tests que realmente lancen un stack de Docker efímero para validar que `DockerOrchestratorService` puede comunicarse con el demonio de Docker.
- **Visual Regression Testing**: Capturar screenshots automáticos de los pasos del asistente para detectar cambios inesperados en la UI.

## Comandos de Testing

| Comando | Acción |
|---------|--------|
| `npm run test` | Ejecuta los tests unitarios con Vitest. |
| `npm run test:coverage` | Genera un reporte de cobertura (V8). |
| `npm run test:e2e` | Ejecuta los tests de Playwright (requiere build previo). |
| `npm run test:e2e:ui` | Abre la interfaz de usuario de Playwright para depurar tests. |

## Reportes
Los resultados de los tests E2E se guardan en `e2e-report/`, proporcionando trazas visuales y logs detallados de cada fallo detectado en el pipeline de CI/CD.
