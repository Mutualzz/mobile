import { useAppStore } from "@hooks/useStores";
import { useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";

const SpacesIndex = () => {
    const app = useAppStore();
    const router = useRouter();

    useEffect(() => {
        const recentSpace = app.spaces.setPreferredActive();
        if (!recentSpace) return;

        router.replace(`/spaces/${recentSpace.id}`);
    }, [app.spaces, router]);

    return null;
};

export default observer(SpacesIndex);
