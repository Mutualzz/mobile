import { Logger } from "@logger";
import { Platform } from "react-native";

let isTauri = false;
let os = Platform.OS;
let client = "Mutualzz Mobile";

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

export class REST {
    private readonly logger = new Logger({
        tag: "REST",
    });
    private headers: Record<string, string>;

    constructor() {
        this.headers = DEFAULT_HEADERS;
    }

    public setToken(token: string | null) {
        if (token) {
            this.headers.Authorization = `Bearer ${token}`;
        } else {
            delete this.headers.Authorization;
        }
    }

    public static makeAPIUrl(
        path: string,
        queryParams: Record<string, any> = {},
    ) {
        const url = new URL(`${process.env.EXPO_API_URL}/v1/${path}`);
        Object.entries(queryParams).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
        return url.toString();
    }

    public static makeCDNUrl(
        path: string,
        queryParams: Record<string, any> = {},
    ) {
        const url = new URL(`${process.env.EXPo_CDN_URL}${path}`);
        Object.entries(queryParams).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
        return url.toString();
    }

    public async get<Data>(
        path: string,
        queryParams: Record<string, any> = {},
    ): Promise<Data> {
        return new Promise((resolve, reject) => {
            const url = REST.makeAPIUrl(path, queryParams);
            this.logger.debug(`GET ${url}`);
            return fetch(url, {
                method: "GET",
                headers: this.headers,
                mode: "cors",
            })
                .then(async (res) => {
                    if (res.headers.get("content-length") !== "0") {
                        if (
                            res.headers
                                .get("content-type")
                                ?.includes("application/json")
                        ) {
                            if (!res.ok) return reject(await res.json());
                            return res.json();
                        }
                        if (!res.ok) return reject(res.json());
                        return res.text();
                    }
                })
                .then(resolve)
                .catch(reject);
        });
    }

    public async post<Body, Data>(
        path: string,
        body?: Body,
        queryParams: Record<string, any> = {},
        headers: Record<string, string> = {},
    ): Promise<Data> {
        return new Promise((resolve, reject) => {
            const url = REST.makeAPIUrl(path, queryParams);
            this.logger.debug(`POST ${url}; payload:`, body);
            return fetch(url, {
                method: "POST",
                headers: {
                    ...headers,
                    ...this.headers,
                    "Content-Type": "application/json",
                },
                body: body ? JSON.stringify(body) : undefined,
                mode: "cors",
            })
                .then(async (res) => {
                    // handle json if content type is json
                    if (
                        res.headers
                            .get("content-type")
                            ?.includes("application/json")
                    ) {
                        const data = await res.json();
                        if (res.ok) return resolve(data);
                        else return reject(data);
                    }

                    // if theres content, handle text
                    if (res.headers.get("content-length") !== "0") {
                        const data = await res.text();
                        if (res.ok) return resolve(data as Data);
                        else return reject(data);
                    }

                    if (res.ok) return resolve(res.status as Data);
                    else return reject(res.statusText);
                })
                .catch(reject);
        });
    }

    public async put<Body, Data>(
        path: string,
        body?: Body,
        queryParams: Record<string, any> = {},
        headers: Record<string, string> = {},
    ): Promise<Data> {
        return new Promise((resolve, reject) => {
            const url = REST.makeAPIUrl(path, queryParams);
            this.logger.debug(`PUT ${url}; payload:`, body);
            return fetch(url, {
                method: "PUT",
                headers: {
                    ...headers,
                    ...this.headers,
                    "Content-Type": "application/json",
                },
                body: body ? JSON.stringify(body) : undefined,
                mode: "cors",
            })
                .then(async (res) => {
                    // handle json if content type is json
                    if (
                        res.headers
                            .get("content-type")
                            ?.includes("application/json")
                    ) {
                        const data = await res.json();
                        if (res.ok) return resolve(data);
                        else return reject(data);
                    }

                    // if theres content, handle text
                    if (res.headers.get("content-length") !== "0") {
                        const data = await res.text();
                        if (res.ok) return resolve(data as Data);
                        else return reject(data as Data);
                    }

                    if (res.ok) return resolve(res.status as Data);
                    else return reject(res.statusText);
                })
                .catch(reject);
        });
    }

    public async patch<T, U>(
        path: string,
        body?: T,
        queryParams: Record<string, any> = {},
        headers: Record<string, string> = {},
    ): Promise<U> {
        return new Promise((resolve, reject) => {
            const url = REST.makeAPIUrl(path, queryParams);
            this.logger.debug(`PATCH ${url}; payload:`, body);
            return fetch(url, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...this.headers,
                    ...headers,
                },
                body: body ? JSON.stringify(body) : undefined,
                mode: "cors",
            })
                .then(async (res) => {
                    // handle json if content type is json
                    if (
                        res.headers
                            .get("content-type")
                            ?.includes("application/json")
                    ) {
                        const data = await res.json();
                        if (res.ok) return resolve(data);
                        else return reject(data);
                    }

                    // if theres content, handle text
                    if (res.headers.get("content-length") !== "0") {
                        const data = await res.text();
                        if (res.ok) return resolve(data as U);
                        else return reject(data as U);
                    }

                    if (res.ok) return resolve(res.status as U);
                    else return reject(res.statusText);
                })
                .catch(reject);
        });
    }

    public async postFormData<Data>(
        path: string,
        body: FormData,
        queryParams: Record<string, any> = {},
        headers: Record<string, string> = {},
        msg?: any,
    ): Promise<Data> {
        return new Promise((resolve, reject) => {
            const url = REST.makeAPIUrl(path, queryParams);
            this.logger.debug(`POST ${url}; payload:`, body);
            const xhr = new XMLHttpRequest();
            if (msg) {
                // add abort callback
                msg.setAbortCallback(() => {
                    this.logger.debug("[PatchFormData]: Message called abort");
                    xhr.abort();
                    reject("aborted");
                });
                // add progress listener
                xhr.upload.addEventListener("progress", (e: ProgressEvent) =>
                    msg.updateProgress(e),
                );
            }
            xhr.addEventListener("loadend", () => {
                // if success, resolve text or json
                if (xhr.status >= 200 && xhr.status < 300) {
                    if (xhr.responseType === "json")
                        return resolve(xhr.response);

                    return resolve(JSON.parse(xhr.response));
                }

                // if theres content, reject with text
                if (xhr.getResponseHeader("content-length") !== "0")
                    return reject(xhr.responseText);

                // reject with status code if theres no content
                return reject(xhr.statusText);
            });
            xhr.open("POST", url);
            // set headers
            Object.entries({ ...headers, ...this.headers }).forEach(
                ([key, value]) => {
                    xhr.setRequestHeader(key, value);
                },
            );
            xhr.send(body);
        });
    }

    public async patchFormData<Data>(
        path: string,
        body: FormData,
        queryParams: Record<string, any> = {},
        headers: Record<string, string> = {},
        msg?: any,
    ): Promise<Data> {
        return new Promise((resolve, reject) => {
            const url = REST.makeAPIUrl(path, queryParams);
            this.logger.debug(`PATCH ${url}; payload:`, body);
            const xhr = new XMLHttpRequest();
            if (msg) {
                // add abort callback
                msg.setAbortCallback(() => {
                    this.logger.debug("[PostFormData]: Message called abort");
                    xhr.abort();
                    reject("aborted");
                });
                // add progress listener
                xhr.upload.addEventListener("progress", (e: ProgressEvent) =>
                    msg.updateProgress(e),
                );
            }
            xhr.addEventListener("loadend", () => {
                // if success, resolve text or json
                if (xhr.status >= 200 && xhr.status < 300) {
                    if (xhr.responseType === "json")
                        return resolve(xhr.response);

                    return resolve(JSON.parse(xhr.response));
                }

                // if theres content, reject with text
                if (xhr.getResponseHeader("content-length") !== "0")
                    return reject(xhr.responseText);

                // reject with status code if theres no content
                return reject(xhr.statusText);
            });
            xhr.open("PATCH", url);
            // set headers
            Object.entries({ ...headers, ...this.headers }).forEach(
                ([key, value]) => {
                    xhr.setRequestHeader(key, value);
                },
            );
            xhr.send(body);
        });
    }

    public async delete<Data>(
        path: string,
        queryParams: Record<string, any> = {},
        headers: Record<string, string> = {},
    ): Promise<Data> {
        return new Promise((resolve, reject) => {
            const url = REST.makeAPIUrl(path, queryParams);
            this.logger.debug(`DELETE ${url}`);
            return fetch(url, {
                method: "DELETE",
                headers: {
                    ...headers,
                    ...this.headers,
                },
                mode: "cors",
            })
                .then(async (res) => {
                    if (
                        res.headers
                            .get("content-type")
                            ?.includes("application/json")
                    ) {
                        const data = await res.json();
                        if (res.ok) return resolve(data);
                        else return reject(data);
                    }

                    if (res.headers.get("content-length") !== "0") {
                        const data = await res.text();
                        if (res.ok) return resolve(data as Data);
                        else return reject(data as Data);
                    }

                    if (res.ok) return resolve(res.status as Data);
                    else return reject(res.statusText);
                })
                .catch(reject);
        });
    }
}
