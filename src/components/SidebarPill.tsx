import styled from "@emotion/native";
import { Box } from "@mutualzz/ui-native";

export type PillType = "none" | "unread" | "hover" | "active";

const Pill = styled.View<{ type: PillType }>(({ theme, type }) => ({
    width: 4,
    borderRadius: "0 4px 4px 0",
    background: theme.colors.neutral,
    marginLeft: -16,
    transition: "height 0.3s ease, background 0.3s ease",

    ...(type === "none" && {
        height: 0,
    }),
    ...(type === "unread" && {
        height: 8,
        background: theme.colors.warning,
    }),
    ...(type === "hover" && {
        height: 20,
    }),
    ...(type === "active" && {
        height: 40,
    }),
}));

interface Props {
    type: PillType;
}

export const SidebarPill = ({ type }: Props) => {
    return (
        <Box
            style={{
                justifyContent: "flex-start",
                alignItems: "center",
                position: "absolute",
                left: 0,
                width: 8,
                height: 48,
            }}
        >
            <Pill type={type} />
        </Box>
    );
};
