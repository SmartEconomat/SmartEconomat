import type { InstallerStateSnapshot, InstallerStep } from "@shared/contracts";

const stageLabels: Record<InstallerStep, string> = {
  IDLE: "Listo para iniciar",
  PREFLIGHT: "Validando WSL2, Docker y sistema",
  CONFIG_VALIDATION: "Validando configuración de instalación",
  PRE_INSTALL_BACKUP: "Realizando backup de seguridad pre-instalación",
  ENV_RENDER: "Generando .env.prod y secretos",
  TLS_SETUP: "Configurando certificados TLS locales",
  DOCKER_DEPLOY: "Descomprimiendo recursos y levantando servicios",
  INITIALIZE_APP: "Iniciando backend y bootstrap de app",
  VERIFY: "Verificando salud y accesibilidad final",
  DONE: "Instalación finalizada",
  DONE_WITH_WARNINGS: "Instalación finalizada con advertencias",
  FAILED: "Error durante la instalación",
};

const progressByState: Record<InstallerStep, number> = {
  IDLE: 0,
  PREFLIGHT: 10,
  CONFIG_VALIDATION: 18,
  PRE_INSTALL_BACKUP: 28,
  ENV_RENDER: 38,
  TLS_SETUP: 48,
  DOCKER_DEPLOY: 72,
  INITIALIZE_APP: 88,
  VERIFY: 96,
  DONE: 100,
  DONE_WITH_WARNINGS: 100,
  FAILED: 100,
};

const transitions: Record<InstallerStep, InstallerStep[]> = {
  IDLE: ["PREFLIGHT", "FAILED"],
  PREFLIGHT: ["CONFIG_VALIDATION", "FAILED"],
  CONFIG_VALIDATION: ["PRE_INSTALL_BACKUP", "ENV_RENDER", "FAILED"],
  PRE_INSTALL_BACKUP: ["ENV_RENDER", "FAILED"],
  ENV_RENDER: ["TLS_SETUP", "FAILED"],
  TLS_SETUP: ["DOCKER_DEPLOY", "FAILED"],
  DOCKER_DEPLOY: ["INITIALIZE_APP", "FAILED"],
  INITIALIZE_APP: ["VERIFY", "FAILED"],
  VERIFY: ["DONE", "DONE_WITH_WARNINGS", "FAILED"],
  DONE: ["IDLE"],
  DONE_WITH_WARNINGS: ["IDLE"],
  FAILED: ["PREFLIGHT", "IDLE"],
};

export class InstallStateMachine {
  private currentState: InstallerStep = "IDLE";

  private lastSnapshot: InstallerStateSnapshot = {
    state: "IDLE",
    timestamp: new Date().toISOString(),
    message: "Installer idle",
    stageLabel: stageLabels.IDLE,
    progressPercent: progressByState.IDLE,
  };

  transition(
    nextState: InstallerStep,
    message: string,
    errorCode?: string,
  ): InstallerStateSnapshot {
    const allowed = transitions[this.currentState];

    if (!allowed.includes(nextState)) {
      throw new Error(
        `Invalid state transition from ${this.currentState} to ${nextState}`,
      );
    }

    this.currentState = nextState;
    this.lastSnapshot = {
      state: nextState,
      timestamp: new Date().toISOString(),
      message,
      stageLabel: stageLabels[nextState],
      progressPercent: progressByState[nextState],
      errorCode,
    };

    return this.lastSnapshot;
  }

  forceState(
    nextState: InstallerStep,
    message: string,
    errorCode?: string,
  ): InstallerStateSnapshot {
    this.currentState = nextState;
    this.lastSnapshot = {
      state: nextState,
      timestamp: new Date().toISOString(),
      message,
      stageLabel: stageLabels[nextState],
      progressPercent: progressByState[nextState],
      errorCode,
    };
    return this.lastSnapshot;
  }

  getSnapshot(): InstallerStateSnapshot {
    return this.lastSnapshot;
  }
}
