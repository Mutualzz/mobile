import { navigateOnce } from "@utils/navigation";
import { type Href, usePathname, useRouter } from "expo-router";
import { useCallback } from "react";

export function useAppNavigation() {
    const router = useRouter();
    const pathname = usePathname();

    const navigate = useCallback(
        (href: Href, options?: { replace?: boolean }) => {
            navigateOnce(router, href, {
                ...options,
                currentPath: pathname,
            });
        },
        [router, pathname],
    );

    return {
        ...router,
        navigate,
        push: navigate,
    };
}
