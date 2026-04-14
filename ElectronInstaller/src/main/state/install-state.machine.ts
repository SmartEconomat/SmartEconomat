import type { InstallerStateSnapshot, InstallerStep } from "@shared/contracts";

const stageLabels: Record<InstallerStep, string> = {
  IDLE: "Listo para iniciar",
  PREFLIGHT: "Validando requisitos del sistema",
  CONFIG_VALIDATION: "Validando configuración",
  ENV_RENDER: "Generando entorno",
  TLS_SETUP: "Configurando certificados",
  DOCKER_DEPLOY: "Instalando dependencias y desplegando servicios",
  INITIALIZE_APP: "Inicializando aplicación",
  VERIFY: "Verificando estado final",
  DONE: "Instalación finalizada",
  FAILED: "Error durante la instalación",
};

const progressByState: Record<InstallerStep, number> = {
  IDLE: 0,
  PREFLIGHT: 10,
  CONFIG_VALIDATION: 20,
  ENV_RENDER: 35,
  TLS_SETUP: 50,
  DOCKER_DEPLOY: 75,
  INITIALIZE_APP: 88,
  VERIFY: 96,
  DONE: 100,
  FAILED: 100,
};

const transitions: Record<InstallerStep, InstallerStep[]> = {
  IDLE: ["PREFLIGHT", "FAILED"],
  PREFLIGHT: ["CONFIG_VALIDATION", "FAILED"],
  CONFIG_VALIDATION: ["ENV_RENDER", "FAILED"],
  ENV_RENDER: ["TLS_SETUP", "FAILED"],
  TLS_SETUP: ["DOCKER_DEPLOY", "FAILED"],
  DOCKER_DEPLOY: ["INITIALIZE_APP", "FAILED"],
  INITIALIZE_APP: ["VERIFY", "FAILED"],
  VERIFY: ["DONE", "FAILED"],
  DONE: ["IDLE"],
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
