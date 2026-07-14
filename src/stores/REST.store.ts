import { Logger } from "@mutualzz/logger";
import { HttpStatusCode } from "@mutualzz/types";
import { formatRestError, parseXhrJson } from "@utils/restError";
import { fixConnectionUrl } from "@utils/urls";
import { EventEmitter } from "events";
import { Platform } from "react-native";

const os = Platform.OS;
const client = "Mutualzz Mobile";

const clientMeta = {
    type: "Mobile",
    os,
    client,
};

const DEFAULT_HEADERS = {
    "User-Agent": "Mutualzz-Client/1.0",
    accept: "application/json",
    ...clientMeta,
};

const XHR_TIMEOUT_MS = 120_000;
const AUTH_EXEMPT_PATHS = ["/auth/login", "/auth/register", "auth/login", "auth/register"];

async function parseResponse<Data>(res: Response): Promise<Data> {
    const text = await res.text();
    if (!text) return null as Data;
    try {
        return JSON.parse(text) as Data;
    } catch {
        return { message: text.slice(0, 200) } as Data;
    }
}

function toError(data: unknown, status?: number): Error {
    const message = formatRestError(
        data,
        status ? `Request failed (${status})` : "Request failed",
    );
    return new Error(message);
}

export class REST extends EventEmitter {
    private readonly logger = new Logger({
        tag: "REST",
    });
    private headers: Record<string, string>;

    constructor() {
        super();
        this.headers = DEFAULT_HEADERS;
    }

    public static makeAPIUrl(
        path: string,
        queryParams: Record<string, any> = {},
    ) {
        let envUrl = process.env.EXPO_PUBLIC_API_URL;
        if (!envUrl)
            throw new Error("API URL is not defined in environment variables");

        envUrl = fixConnectionUrl(envUrl);
        const normalizedPath = path.replace(/\/{2,}/g, "/").replace(/^\/+/, "");
        const url = new URL(`${envUrl}/${normalizedPath}`);
        Object.entries(queryParams).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
        return url.toString();
    }

    public static makeCDNUrl(
        path: string,
        queryParams: Record<string, any> = {},
    ) {
        let envUrl = process.env.EXPO_PUBLIC_CDN_URL;
        if (!envUrl)
            throw new Error("CDN URL is not defined in environment variables");

        envUrl = fixConnectionUrl(envUrl);
        const normalizedPath = path.replace(/\/{2,}/g, "/").replace(/^\/+/, "");
        const url = new URL(`${envUrl}/${normalizedPath}`);
        Object.entries(queryParams).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
        return url.toString();
    }

    public setToken(token: string | null) {
        if (token) {
            this.headers.Authorization = `Bearer ${token}`;
        } else {
            delete this.headers.Authorization;
        }
    }

    private handleUnauthorized(path: string, status: number) {
        if (status !== HttpStatusCode.Unauthorized) return;
        if (AUTH_EXEMPT_PATHS.some((exempt) => path.includes(exempt))) return;
        this.emit("unauthorized");
    }

    private async handleFetchResponse<Data>(
        path: string,
        res: Response,
    ): Promise<Data> {
        if (res.status === HttpStatusCode.RateLimit) {
            this.emit("rateLimited");
        }

        this.handleUnauthorized(path, res.status);
        const data = await parseResponse<Data>(res);
        if (!res.ok) throw toError(data, res.status);
        return data;
    }

    private runFormData<Data>(
        method: string,
        path: string,
        body: FormData,
        queryParams: Record<string, any>,
        headers: Record<string, string>,
        msg?: any,
    ): Promise<Data> {
        return new Promise((resolve, reject) => {
            const url = REST.makeAPIUrl(path, queryParams);
            this.logger.debug(`${method} ${url}; payload:`, body);
            const xhr = new XMLHttpRequest();
            xhr.timeout = XHR_TIMEOUT_MS;

            if (msg) {
                msg.setAbortCallback(() => {
                    this.logger.debug(`[${method}FormData]: Message called abort`);
                    xhr.abort();
                    reject(new Error("aborted"));
                });
                xhr.upload.addEventListener("progress", (e: ProgressEvent) =>
                    msg.updateProgress(e),
                );
            }

            xhr.addEventListener("timeout", () => {
                reject(new Error("Request timed out"));
            });

            xhr.addEventListener("error", () => {
                reject(new Error("Network request failed"));
            });

            xhr.addEventListener("loadend", () => {
                if (xhr.status === HttpStatusCode.RateLimit) {
                    this.logger.warn(`Rate limited on ${method}`, url);
                    this.emit("rateLimited");
                }

                this.handleUnauthorized(path, xhr.status);

                const data = parseXhrJson(xhr.responseText || "");

                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(data as Data);
                    return;
                }

                reject(toError(data, xhr.status));
            });

            xhr.open(method, url);
            Object.entries({ ...headers, ...this.headers }).forEach(
                ([key, value]) => {
                    xhr.setRequestHeader(key, value);
                },
            );
            xhr.send(body);
        });
    }

    public async get<Data>(
        path: string,
        queryParams: Record<string, any> = {},
    ): Promise<Data> {
        const url = REST.makeAPIUrl(path, queryParams);
        this.logger.debug(`GET ${url}`);

        const res = await fetch(url, {
            method: "GET",
            headers: this.headers,
            mode: "cors",
        });
        return this.handleFetchResponse<Data>(path, res);
    }

    public async post<Data = unknown, Body = unknown>(
        path: string,
        body?: Body,
        queryParams: Record<string, any> = {},
        headers: Record<string, string> = {},
    ): Promise<Data> {
        const url = REST.makeAPIUrl(path, queryParams);
        this.logger.debug(`POST ${url}; payload:`, body);
        const res = await fetch(url, {
            method: "POST",
            headers: {
                ...headers,
                ...this.headers,
                "Content-Type": "application/json",
            },
            body: body ? JSON.stringify(body) : undefined,
            mode: "cors",
        });
        return this.handleFetchResponse<Data>(path, res);
    }

    public async put<Data = unknown, Body = unknown>(
        path: string,
        body?: Body,
        queryParams: Record<string, any> = {},
        headers: Record<string, string> = {},
    ): Promise<Data> {
        const url = REST.makeAPIUrl(path, queryParams);
        this.logger.debug(`PUT ${url}; payload:`, body);
        const res = await fetch(url, {
            method: "PUT",
            headers: {
                ...headers,
                ...this.headers,
                "Content-Type": "application/json",
            },
            body: body ? JSON.stringify(body) : undefined,
            mode: "cors",
        });
        return this.handleFetchResponse<Data>(path, res);
    }

    public async putFormData<Data>(
        path: string,
        body: FormData,
        queryParams: Record<string, any> = {},
        headers: Record<string, string> = {},
        msg?: any,
    ): Promise<Data> {
        return this.runFormData("PUT", path, body, queryParams, headers, msg);
    }

    public async patch<Data = unknown, Body = unknown>(
        path: string,
        body?: Body,
        queryParams: Record<string, any> = {},
        headers: Record<string, string> = {},
    ): Promise<Data> {
        const url = REST.makeAPIUrl(path, queryParams);
        this.logger.debug(`PATCH ${url}; payload:`, body);
        const res = await fetch(url, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...this.headers,
                ...headers,
            },
            body: body ? JSON.stringify(body) : undefined,
            mode: "cors",
        });
        return this.handleFetchResponse<Data>(path, res);
    }

    public async postFormData<Data>(
        path: string,
        body: FormData,
        queryParams: Record<string, any> = {},
        headers: Record<string, string> = {},
        msg?: any,
    ): Promise<Data> {
        return this.runFormData("POST", path, body, queryParams, headers, msg);
    }

    public async patchFormData<Data>(
        path: string,
        body: FormData,
        queryParams: Record<string, any> = {},
        headers: Record<string, string> = {},
        msg?: any,
    ): Promise<Data> {
        return this.runFormData("PATCH", path, body, queryParams, headers, msg);
    }

    public async delete<Data>(
        path: string,
        queryParams: Record<string, any> = {},
        body?: unknown,
        headers: Record<string, string> = {},
    ): Promise<Data> {
        const url = REST.makeAPIUrl(path, queryParams);
        this.logger.debug(`DELETE ${url}; payload:`, body);
        const res = await fetch(url, {
            method: "DELETE",
            headers: {
                ...(body ? { "Content-Type": "application/json" } : {}),
                ...headers,
                ...this.headers,
            },
            body: body ? JSON.stringify(body) : undefined,
            mode: "cors",
        });
        return this.handleFetchResponse<Data>(path, res);
    }
}
