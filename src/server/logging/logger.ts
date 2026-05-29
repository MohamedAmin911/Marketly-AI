type LogLevel = "debug" | "info" | "warn" | "error";

type LogPayload = Record<string, unknown>;

function write(level: LogLevel, message: string, payload: LogPayload = {}) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  if (level === "error") {
    console.error(JSON.stringify(entry));
    return;
  }

  if (level === "warn") {
    console.warn(JSON.stringify(entry));
    return;
  }

  console.log(JSON.stringify(entry));
}

export const logger = {
  debug: (message: string, payload?: LogPayload) => write("debug", message, payload),
  error: (message: string, payload?: LogPayload) => write("error", message, payload),
  info: (message: string, payload?: LogPayload) => write("info", message, payload),
  warn: (message: string, payload?: LogPayload) => write("warn", message, payload),
};
