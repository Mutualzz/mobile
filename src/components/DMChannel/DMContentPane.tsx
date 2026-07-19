import { ChatComposerPane } from "@components/Message/ChatComposerPane";
import { DMChannelHeader } from "@components/DMChannel/DMChannelHeader";
import { DMCallView } from "@components/DMChannel/DMCallView";
import { GroupDMAddRecipientSheet } from "@components/DMChannel/GroupDMAddRecipientSheet";
import { GroupDMManageSheet } from "@components/DMChannel/GroupDMManageSheet";
import { Screen } from "@components/Screen/Screen";
import { UserActionSheet } from "@components/User/UserActionSheet";
import { ChatCircleIcon } from "phosphor-react-native";
import { useScreenComposer } from "@hooks/useScreenComposer";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard } from "react-native";

const EmptyDMState = () => {
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
        <ChatCircleIcon size={40} color={theme.typography.colors.muted} />
        <Typography textColor="muted" style={{ textAlign: "center" }}>
          {t("selectConversation")}
        </Typography>
      </Box>
    </Screen>
  );
};

export const DMContentPane = observer(() => {
  const app = useAppStore();
  const { theme } = useTheme();
  const composerVisible = useScreenComposer();
  const [addRecipientOpen, setAddRecipientOpen] = useState(false);
  const [manageGroupOpen, setManageGroupOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const channel = app.channels.active;

  useEffect(() => {
    if (app.dmDrawerOpen) Keyboard.dismiss();
  }, [app.dmDrawerOpen]);

  useEffect(() => {
    return () => {
      Keyboard.dismiss();
    };
  }, [channel?.id]);

  if (!channel) return <EmptyDMState />;

  const dmRecipient = channel.dmRecipient;
  const hasWallpaper = Boolean(theme.backgroundImageUrl);

  return (
    <Screen
      surfaceRole={hasWallpaper ? "content" : undefined}
      elevation={hasWallpaper ? 0 : undefined}
      style={{ flex: 1, flexDirection: "column", borderWidth: 0 }}
    >
      <DMChannelHeader
        channel={channel}
        onBack={() => app.setDMDrawerOpen(true)}
        onOpenAddRecipient={
          channel.isGroupDM ? () => setAddRecipientOpen(true) : undefined
        }
        onOpenManage={
          channel.isGroupDM ? () => setManageGroupOpen(true) : undefined
        }
        onOpenUserMenu={
          !channel.isGroupDM && dmRecipient
            ? () => setUserMenuOpen(true)
            : undefined
        }
      />
      <DMCallView channel={channel} />
      <ChatComposerPane channel={channel} composerVisible={composerVisible} />

      {channel.isGroupDM ? (
        <>
          <GroupDMAddRecipientSheet
            visible={addRecipientOpen}
            onClose={() => setAddRecipientOpen(false)}
            channel={channel}
          />
          <GroupDMManageSheet
            visible={manageGroupOpen}
            onClose={() => setManageGroupOpen(false)}
            channel={channel}
          />
        </>
      ) : (
        dmRecipient && (
          <UserActionSheet
            user={dmRecipient}
            visible={userMenuOpen}
            onClose={() => setUserMenuOpen(false)}
            insideDMs
          />
        )
      )}
    </Screen>
  );
});
