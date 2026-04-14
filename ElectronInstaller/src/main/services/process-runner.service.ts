import { spawn } from "node:child_process";

import type { CommandResult } from "@shared/contracts";

export interface ProcessRunOptions {
  command: string;
  args: string[];
  cwd?: string;
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
  onStdoutLine?: (line: string) => void;
  onStderrLine?: (line: string) => void;
}

function emitChunkLines(
  chunk: string,
  carry: string,
  onLine: (line: string) => void,
): string {
  const merged = `${carry}${chunk}`;
  const segments = merged.split(/\r?\n/);
  const nextCarry = segments.pop() ?? "";

  for (const rawLine of segments) {
    const line = rawLine.trimEnd();
    if (line.length > 0) {
      onLine(line);
    }
  }

  return nextCarry;
}

function flushCarryLine(carry: string, onLine: (line: string) => void): void {
  const line = carry.trim();
  if (line.length > 0) {
    onLine(line);
  }
}

export class ProcessRunnerService {
  async run(options: ProcessRunOptions): Promise<CommandResult> {
    const timeoutMs = options.timeoutMs ?? 30_000;

    return new Promise<CommandResult>((resolve) => {
      const child = spawn(options.command, options.args, {
        cwd: options.cwd,
        env: options.env,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let timedOut = false;
      let stdoutCarry = "";
      let stderrCarry = "";

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
      }, timeoutMs);

      child.stdout.on("data", (chunk: Buffer) => {
        const text = chunk.toString("utf8");
        stdout += text;

        if (options.onStdoutLine) {
          stdoutCarry = emitChunkLines(text, stdoutCarry, options.onStdoutLine);
        }
      });

      child.stderr.on("data", (chunk: Buffer) => {
        const text = chunk.toString("utf8");
        stderr += text;

        if (options.onStderrLine) {
          stderrCarry = emitChunkLines(text, stderrCarry, options.onStderrLine);
        }
      });

      child.on("close", (code) => {
        clearTimeout(timer);
        const success = !timedOut && code === 0;

        if (options.onStdoutLine) {
          flushCarryLine(stdoutCarry, options.onStdoutLine);
        }

        if (options.onStderrLine) {
          flushCarryLine(stderrCarry, options.onStderrLine);
        }

        resolve({
          ok: success,
          code: code ?? -1,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          message: timedOut
            ? "Command timed out"
            : success
              ? "Command executed successfully"
              : "Command failed",
        });
      });

      child.on("error", (error) => {
        clearTimeout(timer);
        resolve({
          ok: false,
          code: -1,
          stdout: stdout.trim(),
          stderr: `${stderr}\n${error.message}`.trim(),
          message: "Failed to spawn process",
        });
      });
    });
  }
}
