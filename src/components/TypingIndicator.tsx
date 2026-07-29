import { useAppStore } from "@hooks/useStores";
import { Box, Typography } from "@mutualzz/ui-native";
import { UserAvatar } from "@components/User/UserAvatar";
import { useScaledSquareSize } from "@utils/accessibilityLayout";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

interface Props {
    channelId: string;
}

export const TypingIndicator = observer(({ channelId }: Props) => {
    const app = useAppStore();
    const { t } = useTranslation("chat");
    const typingAvatarSize = useScaledSquareSize(20);
    const users = app.typing.getUsersTyping(channelId);

    if (app.settings?.showTypingIndicators === false) {
        return null;
    }

    if (users.length === 0) return null;

    const text =
        users.length === 1
            ? t("typing.one", { name: users[0].displayName })
            : users.length === 2
              ? t("typing.two", {
                    name1: users[0].displayName,
                    name2: users[1].displayName,
                })
              : t("typing.many", {
                    name1: users[0].displayName,
                    name2: users[1].displayName,
                });

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
                        style={{
                            width: typingAvatarSize,
                            height: typingAvatarSize,
                            marginRight: -typingAvatarSize * 0.3,
                        }}
                    />
                ))}
            </Box>
            <Typography level="body-xs" textColor="muted">
                {text}
            </Typography>
        </Box>
    );
});
