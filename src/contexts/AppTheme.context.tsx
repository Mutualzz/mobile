import { useAppStore } from "@hooks/useStores";
import { baseDarkTheme, baseLightTheme } from "@mutualzz/ui-core";
import { ThemeProvider, type ThemeProviderRef } from "@mutualzz/ui-native";
import { reaction } from "mobx";
import { observer } from "mobx-react";
import { useEffect, useRef, type PropsWithChildren } from "react";
import { useColorScheme } from "react-native";

export const AppTheme = observer(({ children }: PropsWithChildren) => {
    const app = useAppStore();
    const { theme: themeStore } = app;
    const themeProviderRef = useRef<ThemeProviderRef>(null);

    useEffect(() => {
        const dispose = reaction(
            () => ({
                theme: themeStore.currentTheme,
                mode: themeStore.currentMode,
                defaultThemesLoaded: themeStore.defaultThemesLoaded,
                userThemesLoaded: themeStore.userThemesLoaded,
            }),
            ({ theme, mode, defaultThemesLoaded, userThemesLoaded }) => {
                themeProviderRef?.current?.changeMode(mode);
                let selectedTheme;

                // Only proceed if themes are loaded
                if (mode === "system") {
                    const prefersDark = useColorScheme() === "dark";
                    selectedTheme = prefersDark
                        ? baseDarkTheme
                        : baseLightTheme;
                } else if (defaultThemesLoaded) {
                    // Not logged in, just use default themes
                    if (theme) {
                        selectedTheme =
                            themeStore.themes.find(
                                (t) => t.id === theme && t.type === mode,
                            ) ?? themeStore.themes.find((t) => t.type === mode);
                    } else {
                        selectedTheme = themeStore.themes.find(
                            (t) => t.type === mode,
                        );
                    }
                } else {
                    selectedTheme =
                        mode === "dark" ? baseDarkTheme : baseLightTheme;
                }

                if (selectedTheme)
                    themeProviderRef?.current?.changeTheme(selectedTheme);
            },
        );

        return dispose;
    }, []);

    return (
        <ThemeProvider
            ref={themeProviderRef}
            onThemeChange={(theme) => {
                if (theme.id !== themeStore.currentTheme)
                    themeStore.setCurrentTheme(theme.id);
            }}
            onModeChange={(mode) => {
                if (mode !== themeStore.currentMode)
                    themeStore.setCurrentMode(mode);
            }}
            disableDefaultThemeOnModeChange
        >
            {children}
        </ThemeProvider>
    );
});
