import type { DebugLogEntry } from "@shared/contracts";

let rendererDebugInstalled = false;

function formatUnknown(input: unknown): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof Error) {
    return input.message;
  }

  try {
    return JSON.stringify(input);
  } catch {
    return String(input);
  }
}

function sanitizeContext(input: unknown): unknown {
  const seen = new WeakSet<object>();

  const walk = (value: unknown): unknown => {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === "bigint") {
      return value.toString();
    }

    if (typeof value === "function") {
      const maybeNamed = value as { name?: string };
      return `[Function ${maybeNamed.name || "anonymous"}]`;
    }

    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    }

    if (typeof value !== "object") {
      return value;
    }

    if (seen.has(value)) {
      return "[Circular]";
    }

    seen.add(value);

    if (Array.isArray(value)) {
      return value.map((entry) => walk(entry));
    }

    const record = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const [key, currentValue] of Object.entries(record)) {
      output[key] = walk(currentValue);
    }
    return output;
  };

  try {
    return walk(input);
  } catch {
    return formatUnknown(input);
  }
}

function emitRendererLog(
  type: DebugLogEntry["type"],
  message: string,
  context?: unknown,
): void {
  const bridge = window.smartEconomat;
  if (!bridge) {
    return;
  }

  bridge.sendDebugLog({
    type,
    source: "renderer",
    message,
    timestamp: Date.now(),
    context: sanitizeContext(context),
  });
}

function createConsoleMessage(args: unknown[]): string {
  if (args.length === 0) {
    return "(empty)";
  }

  return args.map((arg) => formatUnknown(arg)).join(" ");
}

export async function installRendererDebugCapture(): Promise<void> {
  if (rendererDebugInstalled) {
    return;
  }

  const bridge = window.smartEconomat;
  if (!bridge) {
    return;
  }

  try {
    const status = await bridge.isDebugModeEnabled();
    if (!status.ok || !status.data) {
      return;
    }
  } catch {
    return;
  }

  rendererDebugInstalled = true;

  const originalLog = console.log.bind(console);
  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);

  console.log = (...args: unknown[]) => {
    originalLog(...args);
    emitRendererLog("log", createConsoleMessage(args), { args });
  };

  console.warn = (...args: unknown[]) => {
    originalWarn(...args);
    emitRendererLog("warn", createConsoleMessage(args), { args });
  };

  console.error = (...args: unknown[]) => {
    originalError(...args);
    emitRendererLog("error", createConsoleMessage(args), { args });
  };

  const previousOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    emitRendererLog("error", `window.onerror: ${formatUnknown(message)}`, {
      source,
      lineno,
      colno,
      error,
    });

    if (typeof previousOnError === "function") {
      return previousOnError.call(
        window,
        message,
        source,
        lineno,
        colno,
        error,
      );
    }

    return false;
  };

  const previousUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = (event) => {
    emitRendererLog(
      "error",
      `window.onunhandledrejection: ${formatUnknown(event.reason)}`,
      {
        reason: event.reason,
      },
    );

    if (typeof previousUnhandledRejection === "function") {
      return previousUnhandledRejection.call(window, event);
    }

    return undefined;
  };

  emitRendererLog("system", "Renderer debug capture enabled.", {
    route: `${window.location.pathname}${window.location.hash}`,
  });
}
