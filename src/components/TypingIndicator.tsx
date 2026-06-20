import { useAppStore } from "@hooks/useStores";
import { Box, Typography } from "@mutualzz/ui-native";
import { UserAvatar } from "@components/User/UserAvatar";
import { observer } from "mobx-react-lite";

interface Props {
    channelId: string;
}

export const TypingIndicator = observer(({ channelId }: Props) => {
    const app = useAppStore();
    const users = app.typing.getUsersTyping(channelId);

    if (users.length === 0) return null;

    const text =
        users.length === 1
            ? `${users[0].displayName} is typing...`
            : users.length === 2
              ? `${users[0].displayName} and ${users[1].displayName} are typing...`
              : `${users[0].displayName}, ${users[1].displayName}, and others are typing...`;

    return (
        <Box
            style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingHorizontal: 16,
                paddingVertical: 6,
                flexShrink: 0,
            }}
        >
            <Box style={{ flexDirection: "row" }}>
                {users.slice(0, 3).map((user) => (
                    <UserAvatar
                        key={user.id}
                        user={user}
                        size="sm"
                        style={{ width: 20, height: 20, marginRight: -6 }}
                    />
                ))}
            </Box>
            <Typography level="body-xs" textColor="muted">
                {text}
            </Typography>
        </Box>
    );
});
