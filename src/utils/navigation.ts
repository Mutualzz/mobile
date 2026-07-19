import type { Href, router as expoRouter } from "expo-router";

export function normalizeRoutePath(path: string): string {
    const withoutGroups = path.replace(/\/?\([^/]+\)/g, "");
    const normalized = withoutGroups.replace(/\/+/g, "/").replace(/\/$/, "");

    return normalized || "/";
}

let lastNavTarget: string | null = null;
let navigationTimer: ReturnType<typeof setTimeout> | null = null;

const NAVIGATION_DEDUP_MS = 200;

function hrefKey(href: Href): string {
    if (typeof href === "string") return href;
    if (href && typeof href === "object" && "pathname" in href) {
        const path = String(href.pathname ?? "");
        const params = "params" in href && href.params ? JSON.stringify(href.params) : "";
        return `${path}?${params}`;
    }
    return String(href);
}

export function navigateOnce(
    router: typeof expoRouter,
    href: Href,
    options?: { replace?: boolean; currentPath?: string },
) {
    const hrefString = hrefKey(href);
    const targetPath = normalizeRoutePath(hrefString.split("?")[0] ?? hrefString);
    const current = options?.currentPath
        ? normalizeRoutePath(options.currentPath)
        : null;

    if (current === targetPath && !hrefString.includes("?")) return;

    if (lastNavTarget === hrefString) return;

    lastNavTarget = hrefString;
    if (navigationTimer) clearTimeout(navigationTimer);
    navigationTimer = setTimeout(() => {
        lastNavTarget = null;
        navigationTimer = null;
    }, NAVIGATION_DEDUP_MS);

    if (options?.replace) {
        router.replace(href);
        return;
    }

    router.navigate(href);
}

export function dismissPresentedStack(back: () => void) {
    back();
}

export const exitStaffPanel = dismissPresentedStack;
