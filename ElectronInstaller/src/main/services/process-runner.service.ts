import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";

import type { CommandResult } from "@shared/contracts";

import {
  formatChildProcessSpawnError,
  mergeWindowsEssentialPathEntries,
  normalizeWindowsSpawnCommand,
} from "./windows-spawn-support";

function hasLikelyMojibake(text: string): boolean {
  return /Ã|Â|�|□/.test(text);
}

function countOccurrences(input: string, pattern: RegExp): number {
  const matches = input.match(pattern);
  return matches ? matches.length : 0;
}

function scoreDecodedText(text: string): number {
  const replacementPenalty = countOccurrences(text, /�/g) * 8;
  const mojibakePenalty = countOccurrences(text, /Ã|Â|□/g) * 3;
  const printableBonus = countOccurrences(
    text,
    /[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ.,;:()\-_/\\\s]/g,
  );

  return printableBonus - replacementPenalty - mojibakePenalty;
}

function looksLikeUtf16Le(chunk: Buffer): boolean {
  if (chunk.length < 4) {
    return false;
  }

  if (chunk.length >= 2 && chunk[0] === 0xff && chunk[1] === 0xfe) {
    return true;
  }

  let zeroBytes = 0;
  for (let index = 1; index < chunk.length; index += 2) {
    if (chunk[index] === 0x00) {
      zeroBytes += 1;
    }
  }

  const sampledPairs = Math.floor(chunk.length / 2);
  return sampledPairs > 0 && zeroBytes / sampledPairs > 0.25;
}

function decodeWindowsChunk(chunk: Buffer): string {
  if (looksLikeUtf16Le(chunk)) {
    return chunk.toString("utf16le");
  }

  const utf8Text = chunk.toString("utf8");
  if (!hasLikelyMojibake(utf8Text)) {
    return utf8Text;
  }

  try {
    const windows1252Text = new TextDecoder("windows-1252").decode(chunk);
    return scoreDecodedText(windows1252Text) >= scoreDecodedText(utf8Text)
      ? windows1252Text
      : utf8Text;
  } catch {
    return utf8Text;
  }
}

function decodeChunk(chunk: Buffer): string {
  if (process.platform === "win32") {
    return decodeWindowsChunk(chunk);
  }

  return chunk.toString("utf8");
}

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

    const command = normalizeWindowsSpawnCommand(options.command.trim());
    if (command.length === 0) {
      return {
        ok: false,
        code: -1,
        stdout: "",
        stderr: "Comando vacío: no se puede ejecutar spawn.",
        message: "Failed to spawn process",
      };
    }

    if (options.cwd && !fs.existsSync(options.cwd)) {
      return {
        ok: false,
        code: -1,
        stdout: "",
        stderr: `cwd inválido o inaccesible: ${options.cwd}`,
        message: "Failed to spawn process",
      };
    }

    const mergedEnv =
      process.platform === "win32"
        ? mergeWindowsEssentialPathEntries({
            ...process.env,
            ...options.env,
          })
        : { ...process.env, ...options.env };

    return new Promise<CommandResult>((resolve) => {
      let settled = false;
      const finish = (result: CommandResult): void => {
        if (settled) {
          return;
        }
        settled = true;
        resolve(result);
      };

      let child: ChildProcess;
      try {
        child = spawn(command, options.args, {
          cwd: options.cwd,
          env: mergedEnv,
          shell: false,
          windowsHide: true,
          stdio: ["ignore", "pipe", "pipe"],
        });
      } catch (error) {
        finish({
          ok: false,
          code: -1,
          stdout: "",
          stderr: formatChildProcessSpawnError(error),
          message: "Failed to spawn process",
        });
        return;
      }

      if (!child.stdout || !child.stderr) {
        finish({
          ok: false,
          code: -1,
          stdout: "",
          stderr:
            "El proceso hijo no expuso pipes de stdout/stderr (stdio inesperado).",
          message: "Failed to spawn process",
        });
        return;
      }

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
        const text = decodeChunk(chunk);
        stdout += text;

        if (options.onStdoutLine) {
          stdoutCarry = emitChunkLines(text, stdoutCarry, options.onStdoutLine);
        }
      });

      child.stderr.on("data", (chunk: Buffer) => {
        const text = decodeChunk(chunk);
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

        finish({
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
        const detail = formatChildProcessSpawnError(error);
        finish({
          ok: false,
          code: -1,
          stdout: stdout.trim(),
          stderr:
            `${stderr}\nspawn error: ${detail}\nexecutable=${command}`.trim(),
          message: "Failed to spawn process",
        });
      });
    });
  }
}
