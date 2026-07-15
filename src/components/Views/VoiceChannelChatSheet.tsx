import { ChannelIcon } from "@components/Channel/ChannelIcon";
import { IconButton } from "@components/IconButton";
import { ChatComposerPane } from "@components/Message/ChatComposerPane";
import { useScreenComposer } from "@hooks/useScreenComposer";
import { Sheet, Typography, useTheme } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import { XIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { Keyboard, View } from "react-native";
import { useTranslation } from "react-i18next";

interface Props {
  channel: Channel;
  visible: boolean;
  onClose: () => void;
}

export const VoiceChannelChatSheet = observer(
  ({ channel, visible, onClose }: Props) => {
    const { theme } = useTheme();
    const composerVisible = useScreenComposer();
    const { t } = useTranslation("chat");

    const handleClose = () => {
      Keyboard.dismiss();
      onClose();
    };

    return (
      <Sheet
        open={visible}
        onClose={handleClose}
        showCloseButton={false}
        snapPoints={["85%"]}
        enableDynamicSizing={false}
      >
        <View
          style={{
            flex: 1,
            width: "100%",
            minHeight: 0,
            flexDirection: "column",
            overflow: "hidden",
            backgroundColor: theme.colors.background}}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingHorizontal: 16,
              paddingTop: 16,
              borderBottomWidth: 1,
              borderBottomColor: `${theme.typography.colors.muted}33`}}
          >
            <ChannelIcon type={channel.type} />
            <Typography
              level="body-lg"
              weight="bold"
              truncate="single"
              style={{ flex: 1 }}
            >
              {channel.name}
            </Typography>
            <IconButton
              padding={6}
              color="neutral"
              accessibilityLabel={t("header.voice.closeChatA11y")}
              onPress={handleClose}
            >
              <XIcon size={20} />
            </IconButton>
          </View>

          <ChatComposerPane
            channel={channel}
            composerVisible={composerVisible}
          />
        </View>
      </Sheet>
    );
  },
);
