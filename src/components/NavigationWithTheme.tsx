import { CssBaseline, useTheme } from "@mutualzz/ui-native";
import {
    ThemeProvider as NavigationThemeProvider,
    Theme,
} from "@react-navigation/native";
import { PropsWithChildren, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export const NavigationWithTheme = ({ children }: PropsWithChildren) => {
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

    return (
        <SafeAreaView
            style={{ backgroundColor: theme.colors.background, flex: 1 }}
            edges={["top", "left", "right"]}
        >
            <NavigationThemeProvider value={navTheme}>
                <CssBaseline>{children}</CssBaseline>
            </NavigationThemeProvider>
        </SafeAreaView>
    );
};
