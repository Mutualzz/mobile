import { EmojiPickerContent } from "@components/Expression/EmojiPickerContent";
import { GifPickerContent } from "@components/Expression/GifPicker";
import { StickerPickerContent } from "@components/Expression/StickerPickerContent";
import { IconButton } from "@components/IconButton";
import { GifIcon, SmileyIcon, StickerIcon, XIcon } from "phosphor-react-native";
import { Box, Sheet, Typography, useTheme } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import type { Expression } from "@stores/objects/Expression";
import type { GifResult } from "@utils/gifs";
import type { PickerEmoji, SkinTone } from "@utils/emojis/emojiPickerData";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

export type ExpressionPickerTab = "emoji" | "gifs" | "stickers";

interface Props {
  visible?: boolean;
  onClose: () => void;
  channel?: Channel | null;
  initialTab?: ExpressionPickerTab;
  showEmoji?: boolean;
  showGifs?: boolean;
  showStickers?: boolean;
  onSelectEmoji: (emoji: PickerEmoji, skinTone: SkinTone) => void;
  onSelectCustomEmoji: (expression: Expression) => void;
  onSelectGif: (gif: GifResult) => void;
  onSelectSticker: (sticker: Expression) => void;
  embedded?: boolean;
}

const TAB_DEFS: {
  id: ExpressionPickerTab;
  labelKey: "picker.tabs.emoji" | "picker.tabs.gifs" | "picker.tabs.stickers";
  Icon: typeof SmileyIcon;
}[] = [
  { id: "emoji", labelKey: "picker.tabs.emoji", Icon: SmileyIcon },
  { id: "gifs", labelKey: "picker.tabs.gifs", Icon: GifIcon },
  { id: "stickers", labelKey: "picker.tabs.stickers", Icon: StickerIcon },
];

export const ExpressionPickerSheet = observer(
  ({
    visible = true,
    onClose,
    channel,
    initialTab = "emoji",
    showEmoji = true,
    showGifs = true,
    showStickers = true,
    onSelectEmoji,
    onSelectCustomEmoji,
    onSelectGif,
    onSelectSticker,
    embedded = false}: Props) => {
    const { t } = useTranslation("chat");
    const { theme } = useTheme();
    const [tab, setTab] = useState<ExpressionPickerTab>(initialTab);
    const isActive = embedded || visible;

    useEffect(() => {
      if (!isActive) return;
      setTab(initialTab);
    }, [isActive, initialTab]);

    const tabs = TAB_DEFS.filter((entry) => {
      if (entry.id === "emoji") return showEmoji;
      if (entry.id === "gifs") return showGifs;
      if (entry.id === "stickers") return showStickers;
      return true;
    });

    const panel = (
      <View
        style={{
          flex: 1,
          width: "100%",
          minHeight: 0,
          backgroundColor: theme.colors.background,
          paddingTop: 12
        }}
      >
        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            paddingBottom: 8,
            gap: 8}}
        >
          <Box
            style={{
              flex: 1,
              flexDirection: "row",
              gap: 4}}
          >
            {tabs.map(({ id, labelKey, Icon }) => {
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
                      : "transparent"}}
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
                    truncate="single"
                    style={{
                      color: active
                        ? theme.colors.primary
                        : theme.typography.colors.muted}}
                  >
                    {t(labelKey)}
                  </Typography>
                </Pressable>
              );
            })}
          </Box>
          <IconButton padding={6} onPress={onClose}>
            <XIcon size={20} />
          </IconButton>
        </Box>

        <Box style={{ flex: 1, minHeight: 0 }}>
          {tab === "emoji" && (
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
          )}

          {tab === "gifs" && (
            <GifPickerContent
              active={isActive && tab === "gifs"}
              onSelectGif={(gif) => {
                onSelectGif(gif);
                onClose();
              }}
            />
          )}

          {tab === "stickers" && showStickers && (
            <StickerPickerContent
              channel={channel}
              onSelectSticker={onSelectSticker}
            />
          )}
        </Box>
      </View>
    );

    if (embedded) return panel;

    return (
      <Sheet
        open={visible}
        onClose={onClose}
        showCloseButton={false}
        snapPoints={["62%"]}
        enableDynamicSizing={false}
      >
        {panel}
      </Sheet>
    );
  },
);
