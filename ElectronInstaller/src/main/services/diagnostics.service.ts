import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { OperationResult, RuntimePaths } from "@shared/contracts";

import { DockerOrchestratorService } from "./docker-orchestrator.service";
import { PathResolverService } from "./path-resolver.service";
import { ProcessRunnerService } from "./process-runner.service";

interface DiagnosticsBundle {
  generatedAt: string;
  platform: NodeJS.Platform;
  release: string;
  arch: string;
  memoryGb: number;
  dockerPs: string;
  dockerLogs: string;
  serviceHealth: unknown;
}

/** Servicio del proceso principal: DiagnosticsService. */
export class DiagnosticsService {
  /**
   * Construye la instancia del servicio.
   * @param {PathResolverService} pathResolver - Entrada esperada por la función.
   * @param {ProcessRunnerService} processRunner - Entrada esperada por la función.
   * @param {DockerOrchestratorService} dockerOrchestrator - Entrada esperada por la función.
   */
  constructor(
    private readonly pathResolver = new PathResolverService(),
    private readonly processRunner = new ProcessRunnerService(),
    private readonly dockerOrchestrator = new DockerOrchestratorService(),
  ) {}

  /**
   * Genera artefactos o informes solicitados.
   * @param {RuntimePaths} payload - Entrada esperada por la función.
   * @returns {Promise<OperationResult<string>>} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
  async generate(payload: RuntimePaths): Promise<OperationResult<string>> {
    const runtimePath = payload.runtimePath;
    const diagnosticsDir = path.join(runtimePath, "diagnostics");
    await fs.mkdir(diagnosticsDir, { recursive: true });

    const projectRoot = this.pathResolver.getProjectRoot();
    const composeFile = path.join(projectRoot, "docker-compose.prod.yml");
    const envFile = path.join(runtimePath, ".env.prod");

    const [psResult, logsResult, healthResult] = await Promise.all([
      this.processRunner.run({
        command: "docker",
        args: ["compose", "-f", composeFile, "--env-file", envFile, "ps"],
        cwd: projectRoot,
        timeoutMs: 20_000,
      }),
      this.processRunner.run({
        command: "docker",
        args: [
          "compose",
          "-f",
          composeFile,
          "--env-file",
          envFile,
          "logs",
          "--tail",
          "150",
        ],
        cwd: projectRoot,
        timeoutMs: 30_000,
      }),
      this.dockerOrchestrator.getHealth(runtimePath),
    ]);

    const bundle: DiagnosticsBundle = {
      generatedAt: new Date().toISOString(),
      platform: process.platform,
      release: os.release(),
      arch: process.arch,
      memoryGb: Number((os.totalmem() / 1024 ** 3).toFixed(2)),
      dockerPs: psResult.ok ? psResult.stdout : psResult.stderr,
      dockerLogs: logsResult.ok ? logsResult.stdout : logsResult.stderr,
      serviceHealth: healthResult.data ?? [],
    };

    const bundlePath = path.join(
      diagnosticsDir,
      `diagnostics-${Date.now()}.json`,
    );
    await fs.writeFile(bundlePath, JSON.stringify(bundle, null, 2), "utf8");

    return {
      ok: true,
      message: "Diagnóstico generado.",
      data: bundlePath,
    };
  }
}
