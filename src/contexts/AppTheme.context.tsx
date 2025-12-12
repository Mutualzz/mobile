import type { Theme as MzTheme } from "@emotion/react";
import { useAppStore } from "@hooks/useStores";
import { baseDarkTheme, baseLightTheme } from "@mutualzz/ui-core";
import { ThemeProvider, ThemeProviderRef } from "@mutualzz/ui-native";
import { Theme } from "@stores/objects/Theme";
import { reaction } from "mobx";
import { observer } from "mobx-react";
import { useEffect, useRef, type PropsWithChildren } from "react";
import { useColorScheme } from "react-native";

export const AppTheme = observer(({ children }: PropsWithChildren) => {
    const app = useAppStore();

    const themeProviderRef = useRef<ThemeProviderRef>(null);
    const prefersDark = useColorScheme() === "dark";

    const applyingRef = useRef(false);
    const lastAppliedRef = useRef<{
        type: typeof app.themes.currentType | null;
        themeId: string | null;
    }>({
        type: null,
        themeId: null,
    });

    useEffect(() => {
        const dispose = reaction(
            () => ({
                theme: app.themes.currentTheme,
                type: app.themes.currentType,
                userThemeRemote: app.settings?.currentTheme,
                isLoggedIn: !!app.token,
            }),
            ({ theme, type, userThemeRemote, isLoggedIn }) => {
                let selectedTheme: MzTheme | undefined;

                const themes = app.themes.all;

                // Only proceed if themes are loaded
                if (type === "system") {
                    selectedTheme = prefersDark
                        ? baseDarkTheme
                        : baseLightTheme;
                } else if (isLoggedIn) {
                    const pick = (id?: string | null) => {
                        const pickenTheme = themes.find((t) => t.id === id);
                        if (!pickenTheme) return undefined;
                        return Theme.toEmotionTheme(pickenTheme);
                    };

                    selectedTheme = pick(theme) || pick(userThemeRemote);
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
                if (theme.id !== app.themes.currentTheme)
                    app.themes.setCurrentTheme(theme.id);
            }}
            onTypeChange={(type) => {
                if (type !== app.themes.currentType)
                    app.themes.setCurrentType(type);
            }}
            onStyleChange={(style) => {
                if (style !== app.themes.currentStyle)
                    app.themes.setCurrentStyle(style);
            }}
        >
            {children}
        </ThemeProvider>
    );
});
