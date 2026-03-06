let originalEnvVars = [];
let composeCmd = null;

// UI Elements
const els = {
  stepLoading: document.getElementById('step-loading'),
  stepAction: document.getElementById('step-action'),
  stepEnv: document.getElementById('step-env'),
  stepProgress: document.getElementById('step-progress'),
  stepSuccess: document.getElementById('step-success'),
  loadingMsg: document.getElementById('loading-msg'),
  progressMsg: document.getElementById('progress-msg'),
  btnInstall: document.getElementById('btn-install'),
  btnUninstall: document.getElementById('btn-uninstall'),
  btnBack: document.getElementById('btn-back'),
  envForm: document.getElementById('env-form'),
  dynamicFields: document.getElementById('dynamic-fields'),
  appLink: document.getElementById('app-link'),
  btnFinish: document.getElementById('btn-finish'),
};

function showStep(stepEl) {
  Object.values(els).forEach((el) => {
    if (el && el.classList && el.classList.contains('step')) {
      el.classList.remove('active');
    }
  });
  stepEl.classList.add('active');
}

// 1. Initial Check
window.addEventListener('DOMContentLoaded', async () => {
  const result = await window.installerAPI.checkDependencies();
  if (!result.success) {
    const urlPart = result.installUrl
      ? `<br><br><a href="#" id="docker-install-link" class="bold-link">Abrir guía de instalación</a>`
      : '';
    const details = [
      result.code && `Código: ${result.code}`,
      result.message && `Mensaje: ${result.message}`,
      result.details &&
        result.details.code &&
        `Error code: ${result.details.code}`,
      result.details &&
        result.details.error &&
        `Error: ${result.details.error}`,
      result.details &&
        result.details.stack &&
        `Stack:\n${result.details.stack}`,
      result.stdout && `STDOUT:\n${result.stdout}`,
      result.stderr && `STDERR:\n${result.stderr}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    const detailsPart = details
      ? `<details style="margin-top:16px; text-align:left;"><summary>Detalles técnicos</summary><pre style="white-space:pre-wrap; font-size:12px; background:#f7f7f7; border:1px solid #eee; padding:10px; border-radius:8px;">${details}</pre></details>`
      : '';

    els.loadingMsg.innerHTML = `<span style="color:var(--danger)">Error:</span> ${result.message}<br><br><small>Este instalador requiere Docker para ejecutar SmartEconomat.</small>${urlPart}${detailsPart}`;
    const linkEl = document.getElementById('docker-install-link');
    if (linkEl && result.installUrl) {
      linkEl.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(result.installUrl);
      });
    }
    document.querySelector('.loader').style.display = 'none';
    return;
  }

  composeCmd = result.composeCmd;
  showStep(els.stepAction);
});

// 2. Action Handlers
els.btnInstall.addEventListener('click', async () => {
  showStep(els.stepEnv);
  // No dependemos de un formulario dinámico. La GUI está pensada como guía absoluta.
});

els.btnUninstall.addEventListener('click', async () => {
  const res = await window.installerAPI.runUninstall(composeCmd);
  if (res.success && !res.cancelled) {
    alert(
      'SmartEconomat ha sido desinstalado correctamente de tu sistema local.'
    );
    window.close();
  } else if (!res.success) {
    alert('Error durante la desinstalación: ' + res.message);
  }
});

els.btnBack.addEventListener('click', () => {
  showStep(els.stepAction);
});

function readInputValue(id) {
  const el = document.getElementById(id);
  return el ? String(el.value ?? '').trim() : '';
}

function readNumberValue(id) {
  const raw = readInputValue(id);
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}

function validatePort(name, port) {
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    return `El campo ${name} debe ser un puerto válido (1-65535).`;
  }
  return null;
}

function toEnvVarsGuided() {
  const BACKEND_PORT = readNumberValue('env-BACKEND_PORT');
  const FRONTEND_PORT = readNumberValue('env-FRONTEND_PORT');

  const POSTGRES_USER = readInputValue('env-POSTGRES_USER');
  const POSTGRES_PASSWORD = readInputValue('env-POSTGRES_PASSWORD');
  const POSTGRES_DB = readInputValue('env-POSTGRES_DB');
  const POSTGRES_PORT = readNumberValue('env-POSTGRES_PORT');

  const DB_HOST = readInputValue('env-DB_HOST');
  const DB_PORT = readNumberValue('env-DB_PORT');
  const DB_USERNAME = readInputValue('env-DB_USERNAME');
  const DB_PASSWORD = readInputValue('env-DB_PASSWORD');
  const DB_DATABASE = readInputValue('env-DB_DATABASE');

  const JWT_SECRET = readInputValue('env-JWT_SECRET');
  const JWT_EXPIRATION = readInputValue('env-JWT_EXPIRATION');

  const errors = [];
  const e1 = validatePort('BACKEND_PORT', BACKEND_PORT);
  if (e1) errors.push(e1);
  const e2 = validatePort('FRONTEND_PORT', FRONTEND_PORT);
  if (e2) errors.push(e2);
  const e3 = validatePort('POSTGRES_PORT', POSTGRES_PORT);
  if (e3) errors.push(e3);
  const e4 = validatePort('DB_PORT', DB_PORT);
  if (e4) errors.push(e4);

  if (!POSTGRES_USER) errors.push('POSTGRES_USER no puede estar vacío.');
  if (!POSTGRES_PASSWORD)
    errors.push('POSTGRES_PASSWORD no puede estar vacío.');
  if (!POSTGRES_DB) errors.push('POSTGRES_DB no puede estar vacío.');

  if (!DB_HOST) errors.push('DB_HOST no puede estar vacío.');
  if (!DB_USERNAME) errors.push('DB_USERNAME no puede estar vacío.');
  if (!DB_PASSWORD) errors.push('DB_PASSWORD no puede estar vacío.');
  if (!DB_DATABASE) errors.push('DB_DATABASE no puede estar vacío.');

  if (!JWT_SECRET || JWT_SECRET.length < 16)
    errors.push(
      'JWT_SECRET debe tener al menos 16 caracteres (recomendado: mucho más).'
    );
  if (!JWT_EXPIRATION) errors.push('JWT_EXPIRATION no puede estar vacío.');

  // Coherencia mínima
  if (POSTGRES_USER && DB_USERNAME && POSTGRES_USER !== DB_USERNAME) {
    errors.push('DB_USERNAME debería coincidir con POSTGRES_USER.');
  }
  if (POSTGRES_DB && DB_DATABASE && POSTGRES_DB !== DB_DATABASE) {
    errors.push('DB_DATABASE debería coincidir con POSTGRES_DB.');
  }
  if (POSTGRES_PASSWORD && DB_PASSWORD && POSTGRES_PASSWORD !== DB_PASSWORD) {
    errors.push('DB_PASSWORD debería coincidir con POSTGRES_PASSWORD.');
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Orden explícito para que el .env.prod sea legible
  const envVars = [
    { key: 'POSTGRES_USER', value: POSTGRES_USER },
    { key: 'POSTGRES_PASSWORD', value: POSTGRES_PASSWORD },
    { key: 'POSTGRES_DB', value: POSTGRES_DB },
    { key: 'POSTGRES_PORT', value: String(POSTGRES_PORT) },
    { key: 'BACKEND_PORT', value: String(BACKEND_PORT) },
    { key: 'FRONTEND_PORT', value: String(FRONTEND_PORT) },
    { key: 'DB_HOST', value: DB_HOST },
    { key: 'DB_PORT', value: String(DB_PORT) },
    { key: 'DB_USERNAME', value: DB_USERNAME },
    { key: 'DB_PASSWORD', value: DB_PASSWORD },
    { key: 'DB_DATABASE', value: DB_DATABASE },
    { key: 'JWT_SECRET', value: JWT_SECRET },
    { key: 'JWT_EXPIRATION', value: JWT_EXPIRATION },
  ];

  return { success: true, envVars, FRONTEND_PORT };
}

// 4. Submit & Install
els.envForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const adminEmail = document.getElementById('admin-email').value;
  const adminPass = document.getElementById('admin-pass').value;
  const adminPassConfirm = document.getElementById('admin-pass-confirm').value;

  if (!adminEmail.trim() || !adminPass.trim()) {
    alert('Debes indicar ADMIN_EMAIL y ADMIN_PASSWORD.');
    return;
  }

  if (adminPass !== adminPassConfirm) {
    alert('Las contraseñas de administrador no coinciden.');
    return;
  }

  const guided = toEnvVarsGuided();
  if (!guided.success) {
    alert('Revisa los campos:\n\n' + guided.errors.join('\n'));
    return;
  }

  const finalEnvVars = guided.envVars;
  const appPort = String(guided.FRONTEND_PORT);

  // Start Install
  showStep(els.stepProgress);

  const res = await window.installerAPI.runInstallation({
    composeCmd,
    envVars: finalEnvVars,
    adminEmail,
    adminPass,
  });

  if (res.success) {
    els.appLink.href = `http://localhost:${appPort}`;
    els.appLink.innerText = `http://localhost:${appPort}`;
    showStep(els.stepSuccess);
  } else {
    alert('Error crítico durante la instalación:\n\n' + res.message);
    showStep(els.stepAction);
  }
});

// Update Progress Stream
window.installerAPI.onInstallProgress((event) => {
  els.progressMsg.innerText = event.stage;
});

// Finish
els.btnFinish.addEventListener('click', () => {
  window.close();
});
