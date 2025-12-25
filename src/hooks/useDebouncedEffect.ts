import { useEffect, useRef } from "react";

type Cleanup = void | (() => void);

export function useDebouncedEffect(
    effect: () => Cleanup,
    deps: readonly unknown[],
    delayMs: number,
) {
    const cleanupRef = useRef<Cleanup>(undefined);

    useEffect(() => {
        const t = setTimeout(() => {
            // run previous cleanup before re-running effect (matches useEffect semantics)
            if (typeof cleanupRef.current === "function") cleanupRef.current();
            cleanupRef.current = effect();
        }, delayMs);

        return () => {
            clearTimeout(t);
            // do NOT call cleanup here — this cleanup is for the *debounce timer*,
            // effect cleanup runs either on next effect or on unmount below.
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, delayMs]);

    useEffect(() => {
        return () => {
            if (typeof cleanupRef.current === "function") cleanupRef.current();
        };
    }, []);
}
