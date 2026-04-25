# SmartEconomat Installer E2E Testing Guide

## Setup

The E2E test suite uses **Playwright** to test all 29 buttons and actions across the installer UI.

### Installation

Playwright and browsers are already installed. If needed, reinstall:

```bash
npm install --save-dev @playwright/test playwright-core
npx playwright install chromium
```

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run tests in UI mode (interactive)
```bash
npm run test:e2e:ui
```

### View test report
```bash
npm run test:e2e:report
```

### Run specific test file
```bash
npx playwright test test/e2e/installer.spec.ts
```

### Run with debugging
```bash
npx playwright test --debug
```

### Run in headed mode (see browser)
```bash
npx playwright test --headed
```

## Test Coverage

This suite covers **29 buttons/actions** across all installer screens:

- **WelcomePage** — 1 button (Comenzar Instalación)
- **PreflightPage** — 3 buttons (Volver, Ejecutar Verificación, Continuar)
- **ConfigPage** — 3 buttons (Volver, Seleccionar certificado/clave, IR A DESPLIEGUE)
- **DeployPage** — 3 buttons (VOLVER, Iniciar Instalación, logs display)
- **FinishPage** — 2 buttons (Volver al Panel de Control, Salir del Instalador)
- **ControlPanelPage** — 9 buttons (Parar/Iniciar/Reiniciar Stack, Ver Logs, Ejecutar Diagnóstico, LIMPIAR AGRESIVO)
- **LogsViewer** — 2 buttons (Limpiar Logs, Exportar Logs)
- **BackupRestorePanel** — 4 buttons (Crear Backup, Elegir Archivo, RESTAURAR BACKUP)
- **Modals** — Cancelar button, Confirmation modals

## Test Results

After running tests, artifacts are saved to `test-results/reports/`:

- `html/` — HTML test report (open in browser)
- `results.json` — JSON report for CI/CD parsing
- `junit.xml` — JUnit XML format for integration
- Playwright captures: traces, screenshots, videos (in test-results/)

## Development Workflow

### While developing features:

1. Start the installer in dev mode:
   ```bash
   npm run dev
   ```

2. Run E2E tests in UI mode in another terminal:
   ```bash
   npm run test:e2e:ui
   ```

3. Make changes and tests will re-run automatically

### Before committing:

```bash
npm run lint
npm run type-check
npm run test
npm run test:e2e
```

## Debugging Failed Tests

### Enable trace mode
Tests automatically capture traces on first retry. To view:

```bash
npx playwright show-trace test-results/traces/installer-spec-WelcomePage-Button-Comenzar-Instalación-1.zip
```

### Run single test with debug
```bash
npx playwright test installer.spec.ts -g "WelcomePage" --debug
```

### Take screenshots manually
Edit test to add:
```typescript
await page.screenshot({ path: 'test.png' });
```

## CI/CD Integration

These tests are designed to run in CI pipelines. Key environment variables:

- `CI=true` — Enables stricter error handling and retries
- `HEADLESS=true` — Runs without browser UI (default in CI)

Example GitHub Actions workflow is provided in the project CI configuration.

## Limitations & Known Issues

1. **File Pickers** — Cannot interact with OS file dialogs directly in Playwright. Tests verify button clickability only.
2. **Electron IPC** — Tests run against web preview, not native Electron. For full Electron testing, use `@playwright/test` with Electron launcher (future enhancement).
3. **Docker Operations** — CLEAN AGRESIVO and RESTAURAR BACKUP require running Docker. Tests verify UI state, not actual system operations.
4. **macOS/Windows** — Tests run on Linux. Windows/macOS custom dialog behavior may differ (see audit report for manual validation requirements).

## Future Enhancements

- [ ] Full Electron app testing (use Playwright Electron launcher)
- [ ] Multi-OS CI matrix (Windows, macOS, Linux)
- [ ] Performance profiling tests
- [ ] Accessibility audit (WCAG compliance)
- [ ] Visual regression testing (Percy or Chromatic)

## References

- [Playwright Documentation](https://playwright.dev)
- [SmartEconomat Installer Audit Report](../../docs/audits)
- Test file: `test/e2e/installer.spec.ts`
- Config file: `playwright.config.ts`
