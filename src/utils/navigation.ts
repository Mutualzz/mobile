import type { Href, router as expoRouter } from "expo-router";

export function normalizeRoutePath(path: string): string {
    const withoutGroups = path.replace(/\/?\([^/]+\)/g, "");
    const normalized = withoutGroups.replace(/\/+/g, "/").replace(/\/$/, "");

    return normalized || "/";
}

let lastNavTarget: string | null = null;
let navigationTimer: ReturnType<typeof setTimeout> | null = null;

const NAVIGATION_DEDUP_MS = 200;

export function navigateOnce(
    router: typeof expoRouter,
    href: Href,
    options?: { replace?: boolean; currentPath?: string },
) {
    const hrefString = typeof href === "string" ? href : String(href);
    const target = normalizeRoutePath(hrefString);
    const current = options?.currentPath
        ? normalizeRoutePath(options.currentPath)
        : null;

    if (current === target) return;

    if (lastNavTarget === target) return;

    lastNavTarget = target;
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

export function exitStaffPanel(
    back: () => void,
    getParent?: () => { canGoBack: () => boolean; goBack: () => void } | undefined,
) {
    const parent = getParent?.();
    if (parent?.canGoBack()) {
        parent.goBack();
        return;
    }

    back();
}
