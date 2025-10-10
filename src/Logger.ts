/**
 * NOTE: We have a custom logger implementation that is used across the app.
 * You can use console.log, console.warn, etc, but it will throw a warning since we used them during development. (Please do not leave console logs in production code.)
 * While we use this logger for production, it's recommended to use the provided logging methods.
 */
/* eslint-disable no-console */
type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const COLORS: Record<LogLevel, string> = {
    debug: "#9E9E9E",
    info: "#2196F3",
    warn: "#FF9800",
    error: "#F44336",
};

type Transport = (level: LogLevel, message: string, meta?: any) => void;

interface LoggerOptions {
    tag: string;
    level?: LogLevel;
    transports?: Transport[];
    withTimestamp?: boolean;
    withLevelPrefix?: boolean;
}

const ANSI = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    gray: "\x1b[90m",
    blue: "\x1b[34m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
};

function getAnsiColorForLevel(level: LogLevel) {
    switch (level) {
        case "debug":
            return ANSI.gray;
        case "info":
            return ANSI.blue;
        case "warn":
            return ANSI.yellow;
        case "error":
            return ANSI.red;
        default:
            return ANSI.reset;
    }
}

function formatArgForMessage(arg: any) {
    if (typeof arg === "string") return arg;
    try {
        return JSON.stringify(arg);
    } catch {
        try {
            return String(arg);
        } catch {
            return "[unserializable]";
        }
    }
}

export class Logger {
    private tag: string;
    private level: LogLevel;
    private transports: Transport[];
    private withTimestamp: boolean;
    private withLevelPrefix: boolean;

    constructor({
        tag,
        level = "debug",
        transports = [],
        withTimestamp = false,
        withLevelPrefix = false,
    }: LoggerOptions) {
        this.tag = tag;
        this.level = level;
        this.transports = transports;
        this.withTimestamp = withTimestamp;
        this.withLevelPrefix = withLevelPrefix;
    }

    setLevel(level: LogLevel) {
        this.level = level;
    }

    addTransport(transport: Transport) {
        this.transports.push(transport);
    }

    private shouldLog(level: LogLevel): boolean {
        return LEVELS[level] >= LEVELS[this.level];
    }

    private log(level: LogLevel, ...args: any[]) {
        if (!this.shouldLog(level)) return;

        const timestamp = new Date().toISOString();
        const colorCode = getAnsiColorForLevel(level);
        const reset = ANSI.reset;
        const bold = ANSI.bold;
        const dim = ANSI.dim;

        const prefixParts: string[] = [];
        prefixParts.push(`${colorCode}${bold}[${this.tag}]${reset}`);

        if (this.withLevelPrefix) {
            prefixParts.push(`${colorCode}[${level.toUpperCase()}]${reset}`);
        }

        if (this.withTimestamp) {
            prefixParts.push(`${dim}${timestamp}${reset}`);
        }

        const coloredPrefix = prefixParts.join(" ");

        const plainMessage = [
            `[${this.tag}]`,
            this.withLevelPrefix ? `[${level.toUpperCase()}]` : null,
            this.withTimestamp ? timestamp : null,
            ...args.map(formatArgForMessage),
        ]
            .filter(Boolean)
            .join(" ");

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (console as any)[level](coloredPrefix, ...args);
        } catch {
            // fallback if console[level] doesn't exist
            console.log(coloredPrefix, ...args);
        }

        for (const transport of this.transports) {
            try {
                transport(level, plainMessage, args);
            } catch (error) {
                console.warn(`[Logger] Failed to execute transport:`, error);
            }
        }
    }

    debug(...args: any[]) {
        this.log("debug", ...args);
    }
    info(...args: any[]) {
        this.log("info", ...args);
    }
    warn(...args: any[]) {
        this.log("warn", ...args);
    }
    error(...args: any[]) {
        this.log("error", ...args);
    }
}
