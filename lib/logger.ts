import fs from "fs";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "logs", "app.log");

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), "logs");
if (typeof window === "undefined" && !fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  source?: string;
}

function writeLog(entry: LogEntry) {
  if (typeof window !== "undefined") {
    // Client-side: send to API
    fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    }).catch(() => {});
    return;
  }

  // Server-side: write to file
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n");
  } catch (error) {
    console.error("Failed to write log:", error);
  }
}

export const logger = {
  info: (message: string, data?: any, source?: string) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "INFO",
      message,
      data,
      source,
    };
    writeLog(entry);
    console.log(`[INFO] ${message}`, data || "");
  },

  warn: (message: string, data?: any, source?: string) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "WARN",
      message,
      data,
      source,
    };
    writeLog(entry);
    console.warn(`[WARN] ${message}`, data || "");
  },

  error: (message: string, error?: any, source?: string) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "ERROR",
      message,
      data: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      source,
    };
    writeLog(entry);
    console.error(`[ERROR] ${message}`, error || "");
  },

  debug: (message: string, data?: any, source?: string) => {
    if (process.env.NODE_ENV !== "production") {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: "DEBUG",
        message,
        data,
        source,
      };
      writeLog(entry);
      console.debug(`[DEBUG] ${message}`, data || "");
    }
  },
};

export default logger;
