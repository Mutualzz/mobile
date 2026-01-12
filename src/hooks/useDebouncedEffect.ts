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
            if (typeof cleanupRef.current === "function") cleanupRef.current();
            cleanupRef.current = effect();
        }, delayMs);

        return () => {
            clearTimeout(t);
        };
    }, [...deps, delayMs]);

    useEffect(() => {
        return () => {
            if (typeof cleanupRef.current === "function") cleanupRef.current();
        };
    }, []);
}
