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
        const color = COLORS[level];

        let prefix = `%c[${this.tag}]`;

        const styles = [`color:${color}; font-weight:bold;`];

        if (this.withLevelPrefix) {
            prefix += ` %c[${level.toUpperCase()}]`;
            styles.push(`color:${color}; font-weight:normal;`);
        }

        if (this.withTimestamp) {
            prefix += ` %c${timestamp}`;
            styles.push(`color:#888; font-style:italic;`);
        }

        console[level](prefix, ...styles, ...args);

        for (const transport of this.transports) {
            try {
                transport(level, `[${this.tag}] ${args.join(" ")}`, args);
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
