import { ChatComposerPane } from "@components/Message/ChatComposerPane";
import { VoiceChannelView } from "@components/Views/VoiceChannelView";
import { ChannelIcon } from "@components/Channel/ChannelIcon";
import { MemberListSheet } from "@components/MemberList/MemberListSheet";
import { Screen, ScreenHeader } from "@components/Screen/Screen";
import { ArrowLeftIcon, HashIcon, UsersIcon } from "phosphor-react-native";
import { useScreenComposer } from "@hooks/useScreenComposer";
import { useAppStore } from "@hooks/useStores";
import { ChannelType } from "@mutualzz/types";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, Pressable } from "react-native";

const EmptyChannelState = () => {
  const { theme } = useTheme();
  const { t } = useTranslation("chat");

  return (
    <Screen style={{ flexDirection: "column" }}>
      <Box
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: 24,
        }}
      >
        <HashIcon size={40} color={theme.typography.colors.muted} />
        <Typography textColor="muted" style={{ textAlign: "center" }}>
          {t("selectChannel")}
        </Typography>
      </Box>
    </Screen>
  );
};

export const ChannelContentPane = observer(() => {
  const app = useAppStore();
  const { theme } = useTheme();
  const composerVisible = useScreenComposer();
  const [memberListOpen, setMemberListOpen] = useState(false);
  const channel = app.channels.active;

  useEffect(() => {
    if (app.spacesDrawerOpen) Keyboard.dismiss();
  }, [app.spacesDrawerOpen]);

  useEffect(() => {
    return () => {
      Keyboard.dismiss();
    };
  }, [channel?.id]);

  if (!channel) return <EmptyChannelState />;

  if (channel.type === ChannelType.Voice) {
    return <VoiceChannelView channel={channel} />;
  }

  const hasWallpaper = Boolean(theme.backgroundImageUrl);

  return (
    <Screen
      surfaceRole={hasWallpaper ? "content" : undefined}
      elevation={hasWallpaper ? 0 : undefined}
      style={{
        flex: 1,
        flexDirection: "column",
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
      }}
    >
      <ScreenHeader
        elevation={hasWallpaper ? 0 : undefined}
        style={{
          zIndex: 1,
          borderTopWidth: 0,
          borderLeftWidth: 0,
          borderRightWidth: 0,
          ...(hasWallpaper ? { backgroundColor: "transparent" } : null),
        }}
      >
        <Pressable hitSlop={8} onPress={() => app.setSpacesDrawerOpen(true)}>
          <ArrowLeftIcon color={theme.typography.colors.primary} />
        </Pressable>
        <ChannelIcon type={channel.type} />
        <Typography style={{ flex: 1 }}>{channel.name}</Typography>
        <Pressable hitSlop={8} onPress={() => setMemberListOpen(true)}>
          <UsersIcon color={theme.typography.colors.primary} weight="fill" />
        </Pressable>
      </ScreenHeader>
      <ChatComposerPane channel={channel} composerVisible={composerVisible} />

      <MemberListSheet
        channel={channel}
        visible={memberListOpen}
        onClose={() => setMemberListOpen(false)}
      />
    </Screen>
  );
});
