import { useAppStore } from "@hooks/useStores";
import { ThemeProvider, type ThemeProviderRef } from "@mutualzz/ui-native";
import { Theme } from "@stores/objects/Theme";
import { reaction } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, type PropsWithChildren } from "react";
import { useColorScheme } from "react-native";

export const AppTheme = observer(({ children }: PropsWithChildren) => {
    const app = useAppStore();
    const themeProviderRef = useRef<ThemeProviderRef>(null);
    const prefersDark = useColorScheme() === "dark";
    const isUpdatingFromServer = useRef(false);

    useEffect(() => {
        const dispose = reaction(
            () => ({
                userThemeRemote: app.settings?.currentTheme,
                userIconRemote: app.settings?.currentIcon,
            }),
            ({ userThemeRemote, userIconRemote }) => {
                const themes = app.themes.all;

                if (userIconRemote !== app.themes.currentIcon) {
                    app.themes.setCurrentIcon(userIconRemote ?? null);
                }

                const pick = (id?: string | null) => {
                    const pickenTheme = themes.find((t) => t.id === id);
                    if (!pickenTheme) return undefined;
                    return Theme.toEmotion(pickenTheme);
                };

                const selectedTheme =
                    pick(userThemeRemote) || pick(app.themes.currentTheme);

                if (!selectedTheme) return;

                if (selectedTheme.id === themeProviderRef.current?.theme.id)
                    return;

                isUpdatingFromServer.current = true;
                themeProviderRef.current?.changeTheme(selectedTheme);
                isUpdatingFromServer.current = false;
            },
            { fireImmediately: true },
        );

        return dispose;
    }, [prefersDark]);

    return <ThemeProvider ref={themeProviderRef}>{children}</ThemeProvider>;
});
