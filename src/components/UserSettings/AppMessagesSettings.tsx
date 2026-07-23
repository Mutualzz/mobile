import {
  SettingsActionRow,
  SettingsScroll,
  SettingsSection,
  SettingsSelectRow,
  SettingsSliderRow,
  SettingsToggleRow,
} from "@components/UserSettings/SettingsField";
import { useSettingsOptionSheet } from "@hooks/useSettingsOptionSheet";
import { useAppStore } from "@hooks/useStores";
import { clearRecentEmojisStorage } from "@hooks/useRecentEmojis";
import {
  messageDisplayLabelKey,
  timestampFormatLabelKey,
} from "@mutualzz/client";
import {
  CHAT_FONT_SCALE_MAX,
  CHAT_FONT_SCALE_MIN,
  CHAT_FONT_SCALE_STEP,
  MESSAGE_DISPLAY_OPTIONS,
  TIMESTAMP_FORMAT_OPTIONS,
  type MessageDisplay,
  type TimestampFormat,
} from "@mutualzz/types";
import { Divider } from "@mutualzz/ui-native";
import { applyChatFontScale } from "@utils/chatFontScale";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

export const AppMessagesSettings = observer(() => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const settings = app.settings;
  const openPicker = useSettingsOptionSheet();

  if (!settings) return null;

  const extended = settings.extendedSettings;

  const patch = (next: Partial<typeof extended>) => {
    settings.patchExtendedSettings(next);
    void settings.sync();
  };

  const messageDisplayLabel = (value: MessageDisplay) =>
    t(messageDisplayLabelKey(value));

  const timestampLabel = (value: TimestampFormat) =>
    t(timestampFormatLabelKey(value));

  const clearRecents = () => {
    void clearRecentEmojisStorage().then(() => {
      Alert.alert(t("composer.clearRecentEmojisDone"));
    });
  };

  return (
    <SettingsScroll>
      <SettingsSection title={t("textAndChat.title")}>
        <SettingsSelectRow
          title={t("textAndChat.messageDisplay")}
          description={t("textAndChat.messageDisplayDescription")}
          value={messageDisplayLabel(extended.messageDisplay)}
          onPress={() =>
            openPicker(
              "messages-display",
              t("textAndChat.messageDisplay"),
              MESSAGE_DISPLAY_OPTIONS.map((value) => ({
                value,
                label: messageDisplayLabel(value),
              })),
              extended.messageDisplay,
              (value) => patch({ messageDisplay: value as MessageDisplay }),
            )
          }
        />

        <Divider />

        <SettingsSliderRow
          title={t("textAndChat.chatFontScale")}
          description={t("textAndChat.chatFontScaleDescription")}
          min={CHAT_FONT_SCALE_MIN}
          max={CHAT_FONT_SCALE_MAX}
          step={CHAT_FONT_SCALE_STEP}
          value={extended.chatFontScale}
          formatValueLabel={(value) => `${Math.round(value * 100)}%`}
          onPreviewChange={applyChatFontScale}
          onChange={(scale) => {
            applyChatFontScale(scale);
            patch({ chatFontScale: scale });
          }}
        />

        <Divider />

        <SettingsSelectRow
          title={t("textAndChat.timestampFormat")}
          description={t("textAndChat.timestampFormatDescription")}
          value={timestampLabel(extended.timestampFormat)}
          onPress={() =>
            openPicker(
              "messages-timestamp",
              t("textAndChat.timestampFormat"),
              TIMESTAMP_FORMAT_OPTIONS.map((value) => ({
                value,
                label: timestampLabel(value),
              })),
              extended.timestampFormat,
              (value) => patch({ timestampFormat: value as TimestampFormat }),
            )
          }
        />

        <Divider />

        <SettingsToggleRow
          title={t("textAndChat.showLinkEmbeds")}
          description={t("textAndChat.showLinkEmbedsDescription")}
          checked={extended.showLinkEmbeds}
          onChange={(checked) => patch({ showLinkEmbeds: checked })}
        />

        <Divider />

        <SettingsToggleRow
          title={t("textAndChat.gifAutoplay")}
          description={t("textAndChat.gifAutoplayDescription")}
          checked={extended.gifAutoplay}
          onChange={(checked) => patch({ gifAutoplay: checked })}
        />

        <Divider />

        <SettingsToggleRow
          title={t("textAndChat.revealAllSpoilers")}
          description={t("textAndChat.revealAllSpoilersDescription")}
          checked={extended.revealAllSpoilers}
          onChange={(checked) => patch({ revealAllSpoilers: checked })}
        />

        <Divider />

        <SettingsToggleRow
          title={t("textAndChat.showTypingIndicators")}
          description={t("textAndChat.showTypingIndicatorsDescription")}
          checked={extended.showTypingIndicators}
          onChange={(checked) => patch({ showTypingIndicators: checked })}
        />

        <Divider />

        <SettingsToggleRow
          title={t("textAndChat.sendTypingIndicators")}
          description={t("textAndChat.sendTypingIndicatorsDescription")}
          checked={extended.sendTypingIndicators}
          onChange={(checked) => patch({ sendTypingIndicators: checked })}
        />
      </SettingsSection>

      <SettingsSection title={t("composer.title")}>
        <SettingsActionRow
          title={t("composer.clearRecentEmojis")}
          description={t("composer.clearRecentEmojisDescription")}
          actionLabel={t("composer.clearRecentEmojisAction")}
          onPress={clearRecents}
        />

        <Divider />

        <SettingsToggleRow
          title={t("composer.showEmojiPicker")}
          description={t("composer.showEmojiPickerDescription")}
          checked={extended.showEmojiPicker}
          onChange={(checked) => patch({ showEmojiPicker: checked })}
        />

        <Divider />

        <SettingsToggleRow
          title={t("composer.showGifPicker")}
          description={t("composer.showGifPickerDescription")}
          checked={extended.showGifPicker}
          onChange={(checked) => patch({ showGifPicker: checked })}
        />

        <Divider />

        <SettingsToggleRow
          title={t("composer.showStickerPicker")}
          description={t("composer.showStickerPickerDescription")}
          checked={extended.showStickerPicker}
          onChange={(checked) => patch({ showStickerPicker: checked })}
        />

        <Divider />

        <SettingsToggleRow
          title={t("composer.replyWithMention")}
          description={t("composer.replyWithMentionDescription")}
          checked={extended.replyWithMention}
          onChange={(checked) => patch({ replyWithMention: checked })}
        />
      </SettingsSection>
    </SettingsScroll>
  );
});
