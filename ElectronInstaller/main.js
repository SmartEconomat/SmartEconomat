const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const { exec, execFile } = require('child_process');
const fs = require('fs');
const os = require('os');

// Detect if running from the packaged ASAR or source
const isPackaged = app.isPackaged;
const assetsDir = isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, 'assets');
const appName = 'SmartEconomat';
const installDir = path.join(os.homedir(), appName);

const repoRootDir = isPackaged ? null : path.resolve(__dirname, '..');
const packagedProjectDir = isPackaged
  ? path.join(process.resourcesPath, 'project')
  : null;
const composeFileName = 'docker-compose.prod.yml';
const envProdFileName = '.env.prod';

const DOCKER_INSTALL_URLS = {
  win32: 'https://docs.docker.com/desktop/setup/install/windows-install/',
  darwin: 'https://docs.docker.com/desktop/setup/install/mac-install/',
  linux: 'https://docs.docker.com/engine/install/',
};

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(assetsDir, 'icon.png'),
    title: `Instalador - ${appName}`,
    autoHideMenuBar: true,
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function safeCwd(cwd) {
  try {
    if (!cwd) return os.homedir();
    const st = fs.statSync(cwd);
    if (st.isDirectory()) return cwd;
    return os.homedir();
  } catch {
    return os.homedir();
  }
}

function runCommandFile(command, args, cwd) {
  return new Promise((resolve) => {
    const cwdSafe = safeCwd(cwd);
    const joinedArgs = (args || []).map((a) => {
      const s = String(a);
      return s.includes(' ') || s.includes('"') || s.includes("'")
        ? `"${escapeForDoubleQuotes(s)}"`
        : s;
    });
    const cmdLine = [command, ...joinedArgs].join(' ');

    if (process.platform === 'win32') {
      execFile(
        process.env.ComSpec || 'cmd.exe',
        ['/d', '/s', '/c', cmdLine],
        {
          cwd: cwdSafe,
          windowsHide: true,
          maxBuffer: 10 * 1024 * 1024,
        },
        (error, stdout, stderr) => {
          if (error) {
            resolve({
              success: false,
              error: error.message,
              code: error.code,
              stack: error.stack,
              stdout,
              stderr,
            });
            return;
          }
          resolve({ success: true, stdout, stderr });
        }
      );
      return;
    }

    // Unix: usar /bin/sh -lc (más universal que /usr/bin/env en entornos AppImage)
    execFile(
      '/bin/sh',
      ['-lc', cmdLine],
      {
        cwd: cwdSafe,
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            error: error.message,
            code: error.code,
            stack: error.stack,
            stdout,
            stderr,
          });
          return;
        }
        resolve({ success: true, stdout, stderr });
      }
    );
  });
}

function runCommand(command, cwd) {
  return new Promise((resolve) => {
    exec(
      command,
      {
        cwd: safeCwd(cwd),
        shell: true,
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          resolve({ success: false, error: error.message, stdout, stderr });
          return;
        }
        resolve({ success: true, stdout, stderr });
      }
    );
  });
}

function escapeForDoubleQuotes(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyDirSync(srcDir, destDir) {
  ensureDirSync(destDir);
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function detectComposeCommand() {
  // Prefer Docker Compose v2: `docker compose`
  const composeV2 = await runCommandFile(
    'docker',
    ['compose', 'version'],
    os.homedir()
  );
  if (composeV2.success) return 'docker compose';

  // Fallback v1: `docker-compose`
  const composeV1 = await runCommandFile(
    'docker-compose',
    ['version'],
    os.homedir()
  );
  if (composeV1.success) return 'docker-compose';

  return null;
}

async function hasBackendScript(composeCmd, scriptName) {
  try {
    // Check the package.json from the host filesystem before containers are running
    const backendDir = path.join(
      installDir,
      'backend',
      'smart-economat-backend'
    );
    const packageJsonPath = path.join(backendDir, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      return false;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return !!(packageJson.scripts && packageJson.scripts[scriptName]);
  } catch (error) {
    console.error('Error checking backend script:', error);
    return false;
  }
}

async function checkPortInUse(port) {
  try {
    const { spawn } = require('child_process');
    return new Promise((resolve) => {
      let output = '';
      let errorOutput = '';

      let command, args;
      if (process.platform === 'win32') {
        command = 'netstat';
        args = ['-ano', '|', 'findstr', `:${port}`];
      } else {
        // Linux/Mac: use ss (preferred) or netstat
        command = 'ss';
        args = ['-tlnp', '|', 'grep', `:${port}`];
      }

      const child = spawn(command, args, {
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        const isInUse = output.trim().length > 0;
        resolve({
          inUse: isInUse,
          output: output.trim(),
          error: errorOutput.trim(),
          command: `${command} ${args.join(' ')}`,
        });
      });

      child.on('error', () => {
        resolve({
          inUse: false,
          output: '',
          error: 'Command failed',
          command: `${command} ${args.join(' ')}`,
        });
      });
    });
  } catch (error) {
    return {
      inUse: false,
      output: '',
      error: error.message,
      command: 'checkPortInUse',
    };
  }
}

async function getServiceUsingPort(port) {
  try {
    const { spawn } = require('child_process');
    return new Promise((resolve) => {
      let output = '';
      let errorOutput = '';

      let command, args;
      if (process.platform === 'win32') {
        command = 'netstat';
        args = ['-ano', '|', 'findstr', `:${port}`];
      } else if (process.platform === 'darwin') {
        // macOS
        command = 'lsof';
        args = ['-i', `:${port}`];
      } else {
        // Linux
        command = 'lsof';
        args = ['-i', `:${port}`];
      }

      const child = spawn(command, args, {
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          success: code === 0,
          output: output.trim(),
          error: errorOutput.trim(),
          command: `${command} ${args.join(' ')}`,
        });
      });

      child.on('error', (error) => {
        resolve({
          success: false,
          output: '',
          error: error.message,
          command: `${command} ${args.join(' ')}`,
        });
      });
    });
  } catch (error) {
    return {
      success: false,
      output: '',
      error: error.message,
      command: 'getServiceUsingPort',
    };
  }
}

async function stopServiceOnPort(port) {
  try {
    const { spawn } = require('child_process');
    return new Promise((resolve) => {
      let command, args;
      let manualCommand = '';

      if (process.platform === 'win32') {
        // Windows: use netstat to find PID, then taskkill
        command = 'cmd';
        args = [
          '/c',
          `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /PID %a /F 2>nul`,
        ];
        manualCommand = `Ejecuta como administrador: netstat -ano | findstr :${port} y luego taskkill /PID <PID> /F`;
      } else {
        // Linux/Mac: try fuser first, but it likely needs sudo
        command = 'fuser';
        args = ['-k', `${port}/tcp`];
        manualCommand = `Ejecuta: sudo fuser -k ${port}/tcp`;
      }

      const child = spawn(command, args, {
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            output: output.trim(),
            error: errorOutput.trim(),
            command: `${command} ${args.join(' ')}`,
          });
        } else {
          // Command failed, provide manual instructions
          resolve({
            success: false,
            output: output.trim(),
            error: `No se pudo detener automáticamente el servicio en el puerto ${port}. ${manualCommand}`,
            command: `${command} ${args.join(' ')}`,
          });
        }
      });

      child.on('error', (error) => {
        resolve({
          success: false,
          output: '',
          error: `Error ejecutando comando: ${error.message}. ${manualCommand}`,
          command: `${command} ${args.join(' ')}`,
        });
      });
    });
  } catch (error) {
    return {
      success: false,
      output: '',
      error: `Error en stopServiceOnPort: ${error.message}`,
      command: 'stopServiceOnPort',
    };
  }
}

// IPC Handlers

// Check Dependencies
ipcMain.handle('check-dependencies', async () => {
  try {
    const dockerInfo = await runCommandFile('docker', ['info'], os.homedir());
    if (!dockerInfo.success) {
      return {
        success: false,
        code: 'DOCKER_NOT_AVAILABLE',
        message: 'Docker no está instalado o no está corriendo.',
        details: {
          code: dockerInfo.code,
          error: dockerInfo.error,
          stack: dockerInfo.stack,
        },
        stdout: dockerInfo.stdout,
        stderr: dockerInfo.stderr,
        installUrl:
          DOCKER_INSTALL_URLS[process.platform] ||
          'https://www.docker.com/products/docker-desktop/',
      };
    }

    const composeFound = await detectComposeCommand();
    if (!composeFound) {
      return {
        success: false,
        code: 'COMPOSE_NOT_AVAILABLE',
        message:
          'Docker Compose no está disponible. Actualiza Docker Desktop / Docker Engine.',
        details: {
          error: 'No se encontró docker compose ni docker-compose',
        },
        stdout: dockerInfo.stdout,
        stderr: dockerInfo.stderr,
        installUrl:
          DOCKER_INSTALL_URLS[process.platform] ||
          'https://docs.docker.com/compose/install/',
      };
    }

    return { success: true, composeCmd: composeFound };
  } catch (error) {
    return {
      success: false,
      code: 'CHECK_DEPENDENCIES_ERROR',
      message: String(error && error.message ? error.message : error),
      details: {
        stack: error && error.stack ? String(error.stack) : undefined,
      },
    };
  }
});

// Load original .env.prod
ipcMain.handle('load-env-prod', () => {
  try {
    const envPath = path.join(assetsDir, envProdFileName);
    if (!fs.existsSync(envPath))
      return { success: false, message: 'No se encontró el archivo .env.prod' };

    const content = fs.readFileSync(envPath, 'utf8');
    const parser = content.split('\n');
    let variables = [];

    parser.forEach((line) => {
      if (line.trim() && !line.trim().startsWith('#')) {
        const [key, ...values] = line.split('=');
        variables.push({ key: key.trim(), value: values.join('=').trim() });
      }
    });

    return { success: true, variables };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Run Installation
ipcMain.handle('run-installation', async (event, params) => {
  try {
    const { composeCmd, envVars, adminEmail, adminPass } = params;

    // Check for occupied ports before starting installation
    event.sender.send('install-progress', {
      stage: 'Verificando puertos disponibles...',
    });

    const portsToCheck = [3000, 80, 5432]; // Backend, Frontend, Database
    const occupiedPorts = [];

    for (const port of portsToCheck) {
      const portCheck = await checkPortInUse(port);
      if (portCheck.inUse) {
        occupiedPorts.push(port);
      }
    }

    if (occupiedPorts.length > 0) {
      const portList = occupiedPorts.join(', ');
      const choice = await dialog.showMessageBox({
        type: 'warning',
        buttons: ['Cancelar instalación', 'Liberar puertos automáticamente'],
        title: 'Puertos ocupados',
        message: `Los siguientes puertos están siendo usados: ${portList}`,
        detail: `Para continuar con la instalación, puedo intentar detener los servicios que están usando estos puertos. ¿Deseas que lo haga automáticamente?\n\nNota: Esto puede afectar otros servicios que estén corriendo en el sistema.`,
      });

      if (choice.response === 1) {
        // User chose to free ports
        for (const port of occupiedPorts) {
          event.sender.send('install-progress', {
            stage: `Liberando puerto ${port}...`,
          });

          const stopResult = await stopServiceOnPort(port);
          if (!stopResult.success) {
            throw new Error(
              `No se pudo liberar el puerto ${port}. Error: ${stopResult.error || stopResult.output}`
            );
          }
        }

        event.sender.send('install-progress', {
          stage: 'Puertos liberados. Continuando instalación...',
        });
      } else {
        throw new Error(
          `Instalación cancelada: Los puertos ${portList} están ocupados. Libera los puertos manualmente o elige otros puertos en la configuración.`
        );
      }
    }

    // Create base folder
    ensureDirSync(installDir);

    // Copy compose file (prod)
    const projectSrcRoot = isPackaged ? packagedProjectDir : repoRootDir;
    if (!projectSrcRoot) {
      throw new Error('No se pudo localizar el proyecto para instalar.');
    }

    const composeSrc = path.join(projectSrcRoot, composeFileName);
    if (!fs.existsSync(composeSrc)) {
      throw new Error(`No se encontró ${composeFileName} en el repositorio.`);
    }
    fs.copyFileSync(composeSrc, path.join(installDir, composeFileName));

    // Copy project folders required for docker build
    event.sender.send('install-progress', {
      stage: 'Copiando archivos del proyecto (backend/frontend/database)...',
    });
    copyDirSync(
      path.join(projectSrcRoot, 'backend'),
      path.join(installDir, 'backend')
    );
    copyDirSync(
      path.join(projectSrcRoot, 'frontend'),
      path.join(installDir, 'frontend')
    );
    copyDirSync(
      path.join(projectSrcRoot, 'database'),
      path.join(installDir, 'database')
    );

    // Dockerfile.prod existe en backend/ y frontend/ (según compose)
    if (
      fs.existsSync(path.join(projectSrcRoot, 'backend', 'Dockerfile.prod'))
    ) {
      fs.copyFileSync(
        path.join(projectSrcRoot, 'backend', 'Dockerfile.prod'),
        path.join(installDir, 'backend', 'Dockerfile.prod')
      );
    }
    if (
      fs.existsSync(path.join(projectSrcRoot, 'frontend', 'Dockerfile.prod'))
    ) {
      fs.copyFileSync(
        path.join(projectSrcRoot, 'frontend', 'Dockerfile.prod'),
        path.join(installDir, 'frontend', 'Dockerfile.prod')
      );
    }

    // Generate .env.prod first so docker compose can use it
    let envContent = '';
    envVars.forEach((v) => {
      envContent += `${v.key}=${v.value}\n`;
    });
    fs.writeFileSync(
      path.join(installDir, envProdFileName),
      envContent,
      'utf8'
    );

    // Build containers with no cache to avoid corrupted layer issues
    event.sender.send('install-progress', {
      stage: 'Construyendo contenedores (sin caché)...',
    });
    const buildStatus = await runCommand(
      `${composeCmd} --env-file ${envProdFileName} -f ${composeFileName} build --no-cache`,
      installDir
    );
    if (!buildStatus.success)
      throw new Error(buildStatus.error || buildStatus.stderr);

    // Stop containers
    event.sender.send('install-progress', {
      stage: 'Deteniendo contenedores existentes...',
    });

    // First stop any existing containers
    await runCommand(
      `${composeCmd} --env-file ${envProdFileName} -f ${composeFileName} down`,
      installDir
    );

    event.sender.send('install-progress', {
      stage: 'Levantando contenedores...',
    });

    let upStatus = await runCommand(
      `${composeCmd} --env-file ${envProdFileName} -f ${composeFileName} up -d --remove-orphans`,
      installDir
    );

    // ... (rest of the code remains the same)
    if (
      !upStatus.success &&
      (upStatus.error || upStatus.stderr).includes('port is already allocated')
    ) {
      const portMatch = (upStatus.error || upStatus.stderr).match(
        /Bind for 0\.0\.0\.0:(\d+) failed/
      );
      if (portMatch) {
        const port = portMatch[1];

        // Ask user if they want to free the port
        const choice = await dialog.showMessageBox({
          type: 'warning',
          buttons: ['Cancelar instalación', 'Liberar puerto automáticamente'],
          title: 'Puerto ocupado',
          message: `El puerto ${port} está siendo usado por otro servicio.`,
          detail: `Para continuar con la instalación, puedo intentar detener el servicio que está usando el puerto ${port}. ¿Deseas que lo haga automáticamente?\n\nNota: Esto puede afectar otros servicios que estén corriendo en el sistema.`,
        });

        if (choice.response === 1) {
          // User chose to free port
          event.sender.send('install-progress', {
            stage: `Liberando puerto ${port}...`,
          });

          const stopResult = await stopServiceOnPort(port);
          if (stopResult.success) {
            event.sender.send('install-progress', {
              stage: `Puerto ${port} liberado. Reintentando instalación...`,
            });

            // Retry the docker compose up command
            upStatus = await runCommand(
              `${composeCmd} --env-file ${envProdFileName} -f ${composeFileName} up -d --remove-orphans`,
              installDir
            );
          } else {
            throw new Error(
              `No se pudo liberar el puerto ${port}. Error: ${stopResult.error || stopResult.output}`
            );
          }
        } else {
          throw new Error(
            `Instalación cancelada: Puerto ${port} está ocupado. Libera el puerto manualmente o elige otro puerto en la configuración.`
          );
        }
      }
    }

    if (!upStatus.success) throw new Error(upStatus.error || upStatus.stderr);

    event.sender.send('install-progress', {
      stage: 'Verificando contenedores...',
    });
    const psStatus = await runCommand(
      `${composeCmd} --env-file ${envProdFileName} -f ${composeFileName} ps`,
      installDir
    );
    if (!psStatus.success) throw new Error(psStatus.error || psStatus.stderr);

    event.sender.send('install-progress', {
      stage: 'Creando / verificando cuenta de administrador...',
    });
    const safeEmail = escapeForDoubleQuotes(adminEmail);
    const safePass = escapeForDoubleQuotes(adminPass);
    const adminEnv = `-e ADMIN_EMAIL="${safeEmail}" -e ADMIN_PASSWORD="${safePass}"`;
    let seedStatus = { success: false, stdout: '' };

    const hasSeedAdmin = await hasBackendScript(composeCmd, 'seed:admin');
    if (hasSeedAdmin) {
      const seedCmd = `${composeCmd} --env-file ${envProdFileName} -f ${composeFileName} exec -T ${adminEnv} backend npm run seed:admin`;
      seedStatus = await runCommand(seedCmd, installDir);
    } else {
      // In production, only admin seeder should exist
      throw new Error(
        'Script seed:admin no encontrado. Es requerido para instalación en producción.'
      );
    }

    if (!seedStatus.success) {
      throw new Error(
        seedStatus.error ||
          seedStatus.stderr ||
          'Fallo ejecutando seed para el administrador'
      );
    }

    event.sender.send('install-progress', {
      stage: 'Verificando que el administrador existe en la base de datos...',
    });
    const sqlEmail = escapeForDoubleQuotes(adminEmail).replace(/'/g, "''");
    const adminCheckCmd = `${composeCmd} --env-file ${envProdFileName} -f ${composeFileName} exec -T db sh -c "psql -U \\"\\$POSTGRES_USER\\" -d \\"\\$POSTGRES_DB\\" -tAc \\"SELECT COUNT(*) FROM usuario WHERE username = 'admin' OR email = '${sqlEmail}';\\""`;
    const adminCheckStatus = await runCommand(adminCheckCmd, installDir);
    if (!adminCheckStatus.success) {
      throw new Error(
        adminCheckStatus.error ||
          adminCheckStatus.stderr ||
          'No se pudo verificar el admin en la base de datos'
      );
    }
    const count = String(adminCheckStatus.stdout || '').trim();
    if (!count || Number(count) < 1) {
      throw new Error(
        'No se encontró el usuario administrador en la base de datos tras el seed.'
      );
    }

    return { success: true, installDir };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Uninstall
ipcMain.handle('run-uninstall', async (event, composeCmd) => {
  try {
    const choice = await dialog.showMessageBox({
      type: 'warning',
      buttons: ['Cancelar', 'Desinstalar y Borrar Todo'],
      title: 'Confirmar',
      message: `¿Estás completamente SEGURO de que deseas borrar los datos locales de ${appName}?`,
      detail: `Se eliminarán los contendores, bases de datos y la carpeta en ${installDir}`,
    });

    if (choice.response === 0) return { success: true, cancelled: true };

    if (fs.existsSync(installDir)) {
      await runCommand(
        `${composeCmd} -f ${composeFileName} down -v`,
        installDir
      );
      fs.rmSync(installDir, { recursive: true, force: true });
    }

    return { success: true, cancelled: false };
  } catch (error) {
    return { success: false, message: error.message };
  }
});
