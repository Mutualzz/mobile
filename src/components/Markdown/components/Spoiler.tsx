import styled from "@emotion/native";
import { dynamicElevation } from "@mutualzz/ui-core";
import { Box, Typography } from "@mutualzz/ui-native";
import { useAppStore } from "@hooks/useStores";
import { observer } from "mobx-react-lite";
import { useState, type PropsWithChildren, type ReactNode } from "react";
import { Pressable } from "react-native";

const SpoilerWrapper = styled(Box)<{ revealed: boolean }>(({ theme, revealed }) => ({
    borderRadius: 4,
    paddingHorizontal: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    alignSelf: "flex-start",

    backgroundColor: revealed
        ? dynamicElevation(theme.colors.surface, 5)
        : theme.typography.colors.muted,
}));

const SpoilerText = styled(Typography)<{ revealed: boolean }>(({ theme, revealed }) => ({
    ...(!revealed && {
        color: theme.typography.colors.muted,
    }),
}));

const isTextOnly = (children: ReactNode) =>
    typeof children === "string" ||
    (Array.isArray(children) &&
        children.every((child) => typeof child === "string"));

export const Spoiler = observer(({ children }: PropsWithChildren) => {
    const app = useAppStore();
    const revealAll = app.settings?.revealAllSpoilers ?? false;
    const [revealed, setRevealed] = useState(revealAll);

    return (
        <Pressable
            onPress={() => setRevealed(true)}
            style={({ pressed }) => [
                { alignSelf: "flex-start" },
                pressed && !revealed ? { opacity: 0.9 } : null,
            ]}
        >
            <SpoilerWrapper revealed={revealed}>
                {isTextOnly(children) ? (
                    <SpoilerText revealed={revealed} level="body-sm">
                        {children}
                    </SpoilerText>
                ) : (
                    children
                )}
            </SpoilerWrapper>
        </Pressable>
    );
});
