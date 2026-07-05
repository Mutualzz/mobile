import { EmojiPickerContent } from "@components/Expression/EmojiPickerContent";
import { GifPickerContent } from "@components/Expression/GifPicker";
import { StickerPickerContent } from "@components/Expression/StickerPickerContent";
import { IconButton } from "@components/IconButton";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { GifIcon, SmileyIcon, StickerIcon, XIcon } from "phosphor-react-native";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import type { Expression } from "@stores/objects/Expression";
import type { GifResult } from "@utils/gifs";
import type { PickerEmoji, SkinTone } from "@utils/emojis/emojiPickerData";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ExpressionPickerTab = "emoji" | "gifs" | "stickers";

interface Props {
  visible: boolean;
  onClose: () => void;
  channel: Channel;
  initialTab?: ExpressionPickerTab;
  showStickers?: boolean;
  onSelectEmoji: (emoji: PickerEmoji, skinTone: SkinTone) => void;
  onSelectCustomEmoji: (expression: Expression) => void;
  onSelectGif: (gif: GifResult) => void;
  onSelectSticker: (sticker: Expression) => void;
}

const TABS: {
  id: ExpressionPickerTab;
  label: string;
  Icon: typeof SmileyIcon;
}[] = [
  { id: "emoji", label: "Emoji", Icon: SmileyIcon },
  { id: "gifs", label: "GIFs", Icon: GifIcon },
  { id: "stickers", label: "Stickers", Icon: StickerIcon },
];

export const ExpressionPickerSheet = observer(
  ({
    visible,
    onClose,
    channel,
    initialTab = "emoji",
    showStickers = true,
    onSelectEmoji,
    onSelectCustomEmoji,
    onSelectGif,
    onSelectSticker,
  }: Props) => {
    const app = useAppStore();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const { height } = useWindowDimensions();
    const [tab, setTab] = useState<ExpressionPickerTab>(initialTab);

    useEffect(() => {
      if (!visible) return;
      setTab(initialTab);
    }, [visible, initialTab]);

    const tabs = showStickers
      ? TABS
      : TABS.filter((entry) => entry.id !== "stickers");

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <Pressable
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
          }}
          onPress={onClose}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View onStartShouldSetResponder={() => true}>
              <Paper
                elevation={app.settings?.preferEmbossed ? 4 : 2}
                style={{
                  height: height * 0.62,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  backgroundColor: theme.colors.background,
                  paddingTop: 12,
                  paddingBottom: insets.bottom + 8,
                }}
              >
                <Box
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    paddingBottom: 8,
                    gap: 8,
                  }}
                >
                  <Box
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      gap: 4,
                    }}
                  >
                    {tabs.map(({ id, label, Icon }) => {
                      const active = tab === id;
                      return (
                        <Pressable
                          key={id}
                          onPress={() => setTab(id)}
                          style={{
                            flex: 1,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            paddingVertical: 8,
                            borderRadius: 8,
                            borderBottomWidth: 2,
                            borderBottomColor: active
                              ? theme.colors.primary
                              : "transparent",
                            backgroundColor: active
                              ? `${theme.colors.primary}14`
                              : "transparent",
                          }}
                        >
                          <Icon
                            size={18}
                            color={
                              active
                                ? theme.colors.primary
                                : theme.typography.colors.muted
                            }
                            weight="fill"
                          />
                          <Typography
                            level="body-sm"
                            weight={active ? "bold" : undefined}
                            numberOfLines={1}
                            maxFontSizeMultiplier={1.3}
                            style={{
                              color: active
                                ? theme.colors.primary
                                : theme.typography.colors.muted,
                            }}
                          >
                            {label}
                          </Typography>
                        </Pressable>
                      );
                    })}
                  </Box>
                  <IconButton padding={6} color="neutral" onPress={onClose}>
                    <XIcon size={20} />
                  </IconButton>
                </Box>

                <Box style={{ flex: 1, minHeight: 0 }}>
                  {tab === "emoji" ? (
                    <EmojiPickerContent
                      channel={channel}
                      onSelectEmoji={(emoji, skinTone) => {
                        onSelectEmoji(emoji, skinTone);
                        onClose();
                      }}
                      onSelectCustomEmoji={(expression) => {
                        onSelectCustomEmoji(expression);
                        onClose();
                      }}
                    />
                  ) : null}

                  {tab === "gifs" ? (
                    <GifPickerContent
                      active={visible && tab === "gifs"}
                      onSelectGif={(gif) => {
                        onSelectGif(gif);
                        onClose();
                      }}
                    />
                  ) : null}

                  {tab === "stickers" && showStickers ? (
                    <StickerPickerContent
                      channel={channel}
                      onSelectSticker={onSelectSticker}
                    />
                  ) : null}
                </Box>
              </Paper>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    );
  },
);
