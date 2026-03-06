const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('installerAPI', {
  checkDependencies: () => ipcRenderer.invoke('check-dependencies'),
  loadEnvProd: () => ipcRenderer.invoke('load-env-prod'),
  runInstallation: (params) => ipcRenderer.invoke('run-installation', params),
  runUninstall: (composeCmd) => ipcRenderer.invoke('run-uninstall', composeCmd),
  onInstallProgress: (callback) => ipcRenderer.on('install-progress', (_event, value) => callback(value))
});
