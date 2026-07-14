export function formatRestError(error: unknown, fallback: string): string {
    if (error instanceof Error) return error.message || fallback;
    if (typeof error === "string" && error.length > 0) return error;
    if (error && typeof error === "object") {
        const record = error as Record<string, unknown>;
        if (typeof record.message === "string" && record.message.length > 0) {
            return record.message;
        }
        if (typeof record.error === "string" && record.error.length > 0) {
            return record.error;
        }
    }
    return fallback;
}

export function parseXhrJson(responseText: string): unknown {
    if (!responseText) return null;
    try {
        return JSON.parse(responseText);
    } catch {
        return { message: responseText.slice(0, 200) };
    }
}
