import type { PresenceStatus } from "@mutualzz/types";
import { Box, useTheme } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";

interface StatusBadgeProps {
    status: PresenceStatus;
    size?: number;
    showInvisible?: boolean;
}

function roundPx(value: number) {
    return Math.max(2, Math.round(value));
}

export const StatusBadge = observer(
    ({ status, size = 36, showInvisible = false }: StatusBadgeProps) => {
        const { theme } = useTheme();

        if (!showInvisible && status === "invisible") return null;
        if (status === "offline") return null;

        const diameter = roundPx(size * 0.3);
        const ringThickness = roundPx(diameter * 0.16);

        const fillColor = (() => {
            switch (status) {
                case "online":
                    return theme.colors.success;
                case "idle":
                    return theme.colors.warning;
                case "dnd":
                    return theme.colors.danger;
                case "invisible":
                    return "transparent";
                default:
                    return null;
            }
        })();

        if (fillColor == null) return null;

        return (
            <Box
                style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: diameter,
                    height: diameter,
                    borderRadius: 9999,
                    backgroundColor: fillColor,
                    borderWidth: ringThickness,
                    borderColor: theme.colors.surface,
                    transform: [
                        { translateX: roundPx(diameter * 0.15) },
                        { translateY: roundPx(diameter * 0.15) },
                    ],
                }}
            />
        );
    },
);
