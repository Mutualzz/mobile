import styled from "@emotion/native";
import { dynamicElevation } from "@mutualzz/ui-core";
import { Typography } from "@mutualzz/ui-native";
import { useState, type PropsWithChildren } from "react";
import { Pressable } from "react-native";

const SpoilerWrapper = styled(Typography)<{ revealed: boolean }>(
    ({ theme, revealed }) => ({
        borderRadius: 4,
        paddingHorizontal: 4,

        backgroundColor: revealed
            ? dynamicElevation(theme.colors.surface, 5)
            : theme.typography.colors.muted,

        ...(!revealed && {
            color: theme.typography.colors.muted,
        }),
    }),
);

export const Spoiler = ({ children }: PropsWithChildren) => {
    const [revealed, setRevealed] = useState(false);

    return (
        <Pressable
            onPress={() => setRevealed(true)}
            style={({ pressed }) => [
                { alignSelf: "flex-start" },
                pressed && !revealed ? { opacity: 0.9 } : null,
            ]}
        >
            <SpoilerWrapper revealed={revealed}>{children}</SpoilerWrapper>
        </Pressable>
    );
};
