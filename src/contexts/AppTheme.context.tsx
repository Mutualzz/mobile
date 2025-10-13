import { useAppStore } from "@hooks/useStores";
import { baseDarkTheme, baseLightTheme } from "@mutualzz/ui-core";
import { ThemeProvider, ThemeProviderRef } from "@mutualzz/ui-native";
import { reaction } from "mobx";
import { observer } from "mobx-react";
import { useEffect, useRef, type PropsWithChildren } from "react";
import { useColorScheme } from "react-native";

export const AppTheme = observer(({ children }: PropsWithChildren) => {
    const app = useAppStore();
    const { theme: themeStore, account } = app;
    const themeProviderRef = useRef<ThemeProviderRef>(null);
    const prefersDark = useColorScheme() === "dark";

    const applyingRef = useRef(false);
    const lastAppliedRef = useRef<{
        type: typeof themeStore.currentType | null;
        themeId: string | null;
    }>({
        type: null,
        themeId: null,
    });

    useEffect(() => {
        const dispose = reaction(
            () => ({
                theme: themeStore.currentTheme,
                type: themeStore.currentType,
                style: themeStore.currentStyle,
                userThemeRemote: account?.settings.currentTheme,
                defaultThemesLoaded: themeStore.defaultThemesLoaded,
                userThemesLoaded: themeStore.userThemesLoaded,
                isLoggedIn: app.token,
            }),
            ({
                theme,
                type,
                style,
                userThemeRemote,
                defaultThemesLoaded,
                userThemesLoaded,
                isLoggedIn,
            }) => {
                let selectedTheme;

                // Only proceed if themes are loaded
                if (type === "system") {
                    selectedTheme = prefersDark
                        ? baseDarkTheme
                        : baseLightTheme;
                } else if (isLoggedIn) {
                    // Wait for both to be loaded
                    if (!defaultThemesLoaded || !userThemesLoaded) return;

                    const pick = (id?: string | null) =>
                        (id &&
                            themeStore.themes.find(
                                (t) =>
                                    t.id === id &&
                                    t.type === type &&
                                    t.style === style,
                            )) ||
                        themeStore.themes.find(
                            (t) => t.type === type && t.style === style,
                        ) ||
                        themeStore.themes.find(
                            (t) => t.type === type && t.style === "normal",
                        );

                    selectedTheme = pick(theme) || pick(userThemeRemote?.id);
                } else if (defaultThemesLoaded) {
                    selectedTheme =
                        themeStore.themes.find(
                            (t) => t.type === type && t.style === style,
                        ) ||
                        themeStore.themes.find(
                            (t) => t.type === type && t.style === "normal",
                        );
                } else {
                    selectedTheme =
                        type === "dark" ? baseDarkTheme : baseLightTheme;
                }

                if (!selectedTheme) return;

                const needType = lastAppliedRef.current.type !== type;
                const needTheme =
                    lastAppliedRef.current.themeId !== selectedTheme.id;

                if (!needType && !needTheme) return;

                applyingRef.current = true;
                try {
                    if (needType) {
                        themeProviderRef.current?.changeType(type);
                        lastAppliedRef.current.type = type;
                    }
                    if (needTheme) {
                        themeProviderRef.current?.changeTheme(selectedTheme);
                        lastAppliedRef.current.themeId =
                            selectedTheme.id ?? null;
                    }
                } finally {
                    // Defer clearing to ensure provider callbacks fire first
                    setTimeout(() => {
                        applyingRef.current = false;
                    }, 0);
                }
            },
        );

        return dispose;
    }, [prefersDark]);

    return (
        <ThemeProvider
            ref={themeProviderRef}
            onThemeChange={(theme) => {
                if (theme.id !== themeStore.currentTheme)
                    themeStore.setCurrentTheme(theme.id);
            }}
            onTypeChange={(type) => {
                if (type !== themeStore.currentType)
                    themeStore.setCurrentType(type);
            }}
            onStyleChange={(style) => {
                if (style !== themeStore.currentStyle)
                    themeStore.setCurrentStyle(style);
            }}
        >
            {children}
        </ThemeProvider>
    );
});
