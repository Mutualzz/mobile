import { ChannelIcon } from "@components/Channel/ChannelIcon";
import { IconButton } from "@components/IconButton";
import { ChatComposerPane } from "@components/Message/ChatComposerPane";
import { Paper } from "@components/Paper";
import { useScreenComposer } from "@hooks/useScreenComposer";
import { useAppStore } from "@hooks/useStores";
import { Modal, Typography, useTheme } from "@mutualzz/ui-native";
import {
  MODAL_SHEET_WRAPPER_STYLE,
  useModalSheetMaxHeight,
} from "@utils/modalSheet";
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
    const app = useAppStore();
    const { theme } = useTheme();
    const composerVisible = useScreenComposer();
    const sheetHeight = useModalSheetMaxHeight(0.85);
    const { t } = useTranslation("chat");

    const handleClose = () => {
      Keyboard.dismiss();
      onClose();
    };

    return (
      <Modal
        open={visible}
        onClose={handleClose}
        layout="fullscreen"
        showCloseButton={false}
        style={{
          justifyContent: "flex-end",
          alignItems: "stretch",
          backgroundColor: "transparent",
          paddingVertical: 0,
        }}
      >
        <View pointerEvents="box-none" style={MODAL_SHEET_WRAPPER_STYLE}>
          <View style={{ justifyContent: "flex-end", width: "100%" }}>
            <Paper
            elevation={app.settings?.preferEmbossed ? 4 : 2}
            style={{
              height: sheetHeight,
              maxHeight: sheetHeight,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingHorizontal: 16,
                  paddingTop: 16,
                  paddingBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: `${theme.typography.colors.muted}33`,
                }}
              >
                <ChannelIcon type={channel.type} />
                <Typography level="body-lg" weight="bold" truncate="single" style={{ flex: 1 }}>
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
          </Paper>
          </View>
        </View>
      </Modal>
    );
  },
);
