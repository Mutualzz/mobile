import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import type { PaperProps } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { forwardRef, type PropsWithChildren } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SafeTop = boolean | number;

export type ScreenProps = PropsWithChildren<
    PaperProps & {
        fill?: boolean;
        safeTop?: SafeTop;
        safeHorizontal?: boolean;
    }
>;

function resolveTopInset(safeTop: SafeTop, insetTop: number) {
    if (safeTop === false) return undefined;
    if (safeTop === true) return insetTop;
    return insetTop + safeTop;
}

const ScreenComponent = forwardRef<View, ScreenProps>(
    (
        {
            children,
            style,
            elevation,
            fill = true,
            safeTop = false,
            safeHorizontal = false,
            ...props
        },
        ref,
    ) => {
        const app = useAppStore();
        const insets = useSafeAreaInsets();
        const topInset = resolveTopInset(safeTop, insets.top);

        return (
            <View
                style={[
                    fill && { flex: 1 },
                    topInset != null && { paddingTop: topInset },
                    safeHorizontal && {
                        paddingLeft: insets.left,
                        paddingRight: insets.right,
                    },
                ]}
            >
                <Paper
                    ref={ref}
                    style={[fill && { flex: 1 }, style]}
                    elevation={
                        elevation ?? (app.settings?.preferEmbossed ? 2 : 0)
                    }
                    {...props}
                >
                    {children}
                </Paper>
            </View>
        );
    },
);

ScreenComponent.displayName = "Screen";

export const Screen = observer(ScreenComponent);

export type ScreenHeaderProps = PropsWithChildren<
    PaperProps & {
        safeTop?: SafeTop;
        safeTopExtra?: number;
        safeHorizontal?: boolean;
    }
>;

const ScreenHeaderComponent = forwardRef<View, ScreenHeaderProps>(
    (
        {
            children,
            style,
            elevation,
            safeTop = false,
            safeTopExtra = 0,
            safeHorizontal = true,
            ...props
        },
        ref,
    ) => {
        const app = useAppStore();
        const insets = useSafeAreaInsets();
        const topInset = resolveTopInset(safeTop, insets.top);
        const headerTopInset =
            topInset != null ? topInset + safeTopExtra : undefined;

        return (
            <View
                style={
                    headerTopInset != null ? { paddingTop: headerTopInset } : undefined
                }
            >
                <Paper
                    ref={ref}
                    style={[
                        {
                            paddingTop: 12,
                            paddingHorizontal: safeHorizontal
                                ? insets.left + 16
                                : 16,
                            paddingBottom: 12,
                            minHeight: 52,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                        },
                        style,
                    ]}
                    elevation={
                        elevation ?? (app.settings?.preferEmbossed ? 3 : 0)
                    }
                    {...props}
                >
                    {children}
                </Paper>
            </View>
        );
    },
);

ScreenHeaderComponent.displayName = "ScreenHeader";

export const ScreenHeader = observer(ScreenHeaderComponent);
