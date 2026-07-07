import { useAppStore } from "@hooks/useStores";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export function useRequireStaffAccess() {
    const app = useAppStore();
    const router = useRouter();

    const isStaff = app.account?.isStaff ?? false;

    useEffect(() => {
        if (!isStaff) router.back();
    }, [isStaff, router]);

    return { isStaff };
}
