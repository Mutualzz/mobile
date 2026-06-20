import { useAppStore } from "@hooks/useStores";
import { Stack } from "expo-router";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";

const MeLayout = () => {
    const app = useAppStore();

    useEffect(() => {
        app.setMode("@me");

        return () => {
            if (app.mode === "@me") app.resetMode();
        };
    }, []);

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
            }}
        />
    );
};

export default observer(MeLayout);
