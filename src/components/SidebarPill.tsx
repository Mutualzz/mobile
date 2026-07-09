import { Box, scaledLayoutSize, useFontScale, useTheme } from "@mutualzz/ui-native";

export type PillType = "none" | "unread" | "hover" | "active";

interface Props {
    type: PillType;
}

export const SidebarPill = ({ type }: Props) => {
    const { theme } = useTheme();
    const fontScale = useFontScale();

    const pillHeight =
        type === "none"
            ? 0
            : type === "unread"
              ? scaledLayoutSize(8, fontScale, 1.3)
              : type === "hover"
                ? scaledLayoutSize(20, fontScale, 1.3)
                : scaledLayoutSize(40, fontScale, 1.3);

    const pillColor =
        type === "unread" ? theme.colors.warning : theme.colors.neutral;

    return (
        <Box
            style={{
                justifyContent: "center",
                alignItems: "center",
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 8,
                pointerEvents: "none",
            }}
        >
            <Box
                style={{
                    width: 4,
                    height: pillHeight,
                    borderTopRightRadius: 4,
                    borderBottomRightRadius: 4,
                    marginLeft: -16,
                    backgroundColor: pillColor,
                }}
            />
        </Box>
    );
};
