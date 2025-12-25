import { extractColors, isValidGradient } from "@mutualzz/ui-core";
import { useTheme } from "@mutualzz/ui-native";
import {
    ThemeProvider as NavigationThemeProvider,
    Theme,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { observer } from "mobx-react-lite";
import { PropsWithChildren, useMemo } from "react";

export const NavigationWithTheme = observer(
    ({ children }: PropsWithChildren) => {
        const { theme } = useTheme();

        const navTheme: Theme = useMemo(
            () => ({
                dark: theme.type === "dark",
                colors: {
                    primary: theme.colors.primary,
                    background: theme.colors.background,
                    card: theme.colors.surface,
                    text: theme.typography.colors.primary,
                    border: theme.colors.neutral,
                    notification: theme.typography.colors.accent,
                },
                fonts: {
                    regular: {
                        fontFamily: theme.typography.fontFamily,
                        fontWeight: "400",
                    },
                    medium: {
                        fontFamily: theme.typography.fontFamily,
                        fontWeight: "500",
                    },
                    bold: {
                        fontFamily: theme.typography.fontFamily,
                        fontWeight: "600",
                    },
                    heavy: {
                        fontFamily: theme.typography.fontFamily,
                        fontWeight: "700",
                    },
                },
            }),
            [theme],
        );

        const barBg = useMemo(() => {
            const surface = theme.colors.surface;
            if (!isValidGradient(surface)) return surface;

            try {
                const extracted = extractColors(surface);
                if (!extracted || extracted.length === 0) return surface;
                const lastIndex = extracted.length - 1;
                return extracted[lastIndex];
            } catch {
                return surface;
            }
        }, [theme]);

        return (
            <NavigationThemeProvider value={navTheme}>
                <StatusBar
                    backgroundColor={barBg}
                    translucent={false}
                    style={theme.type === "dark" ? "light" : "dark"}
                    animated
                />
                {children}
            </NavigationThemeProvider>
        );
    },
);
