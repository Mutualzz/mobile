import { Button } from "@components/Button";
import { ReactionEmojiPicker } from "@components/Expression/ReactionEmojiPicker";
import { UnicodeEmoji } from "@components/emojis/UnicodeEmoji";
import { useOpenBottomSheet } from "@hooks/useOpenBottomSheet";
import { useAppStore } from "@hooks/useStores";
import {
  formatCustomStatusClearLabel,
  hasCustomStatusContent,
} from "@utils/customStatus";
import { STATUS_DURATION_OPTIONS } from "@utils/statusDurations";
import type { PresenceActivityEmoji } from "@mutualzz/types";
import {
  Box,
  IconButton,
  InputDefault,
  Typography,
  useTheme,
} from "@mutualzz/ui-native";
import { useScaledSquareSize } from "@utils/accessibilityLayout";
import { XIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable } from "react-native";

const toDurationValue = (durationMs: number | null) =>
  durationMs == null ? "forever" : String(durationMs);

export const EmojiPreview = observer(
  ({ emoji }: { emoji: PresenceActivityEmoji }) => {
    const app = useAppStore();
    const emojiSize = useScaledSquareSize(22);

    if (emoji.id) {
      const expression = app.expressions.get(emoji.id);
      if (expression) {
        return (
          <Image
            source={{ uri: expression.url }}
            style={{ width: emojiSize, height: emojiSize }}
          />
        );
      }
    }

    return <UnicodeEmoji value={emoji.name} size={emojiSize} />;
  },
);

interface Props {
  active?: boolean;
  onSaved?: () => void;
}

export const CustomStatusEditor = observer(
  ({ active = true, onSaved }: Props) => {
    const { t } = useTranslation("common");
    const app = useAppStore();
    const { theme } = useTheme();
    const { openBottomSheet, closeBottomSheet } = useOpenBottomSheet();
    const [text, setText] = useState("");
    const [emoji, setEmoji] = useState<PresenceActivityEmoji | null>(null);
    const [durationValue, setDurationValue] = useState("forever");

    useEffect(() => {
      if (!active) return;

      setText(app.customStatus.effectiveText);
      setEmoji(app.customStatus.effectiveEmoji);
      setDurationValue(
        toDurationValue(
          STATUS_DURATION_OPTIONS[4]?.durationMs ?? 24 * 60 * 60_000,
        ),
      );
    }, [
      active,
      app.customStatus.effectiveEmoji,
      app.customStatus.effectiveText,
    ]);

    const trimmedText = text.trim();
    const canSave =
      hasCustomStatusContent(trimmedText, emoji) && trimmedText.length <= 128;
    const canClear =
      app.customStatus.enabled || !!app.customStatus.scheduledCustomStatus;

    const openEmojiPicker = () => {
      openBottomSheet(
        "custom-status-emoji",
        <ReactionEmojiPicker
          embedded
          title={t("customStatus.pickEmoji")}
          onClose={() => closeBottomSheet("custom-status-emoji")}
          onSelectEmoji={(pickerEmoji) => {
            setEmoji({ name: pickerEmoji.emoji });
            closeBottomSheet("custom-status-emoji");
          }}
          onSelectCustomEmoji={(expression) => {
            setEmoji({
              id: expression.id,
              name: expression.name,
              animated: expression.animated,
            });
            closeBottomSheet("custom-status-emoji");
          }}
        />,
      );
    };

    const save = () => {
      if (!canSave) return;
      if (durationValue === "forever") {
        app.gateway.clearScheduledCustomStatus();
        app.gateway.setCustomStatus(trimmedText, { persist: true, emoji });
      } else {
        app.gateway.scheduleCustomStatus({
          text: trimmedText,
          emoji,
          durationMs: Number(durationValue),
        });
      }
      onSaved?.();
    };

    const clearStatus = () => {
      app.gateway.clearScheduledCustomStatus();
      app.gateway.clearCustomStatus();
      setText("");
      setEmoji(null);
      setDurationValue(
        toDurationValue(
          STATUS_DURATION_OPTIONS[4]?.durationMs ?? 24 * 60 * 60_000,
        ),
      );
      onSaved?.();
    };

    return (
      <Box style={{ gap: 8, paddingHorizontal: 8 }}>
        <Typography level="body-xs" weight={700}>
          {t("customStatus.heading")}
        </Typography>

        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: `${theme.typography.colors.muted}48`,
          }}
        >
          <Box style={{ position: "relative" }}>
            <IconButton
              variant="plain"
              color="neutral"
              padding={4}
              accessibilityLabel={t("customStatus.pickEmoji")}
              onPress={openEmojiPicker}
            >
              {emoji ? (
                <EmojiPreview emoji={emoji} />
              ) : (
                <Typography style={{ fontSize: 20 }}>🙂</Typography>
              )}
            </IconButton>
            {emoji && (
              <IconButton
                size="sm"
                padding={2}
                color="neutral"
                variant="solid"
                accessibilityLabel={t("customStatus.removeEmoji")}
                onPress={() => setEmoji(null)}
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  borderRadius: 9999,
                }}
              >
                <XIcon size={10} color={theme.typography.colors.primary} />
              </IconButton>
            )}
          </Box>

          <InputDefault
            variant="plain"
            fullWidth
            placeholder={t("customStatus.whatsOnYourMind")}
            value={text}
            onChangeText={setText}
            maxLength={128}
            onSubmitEditing={save}
          />
        </Box>

        <Box style={{ gap: 6 }}>
          <Typography level="body-xs" weight={700}>
            {t("status.clearCustomAfter")}
          </Typography>
          <Box
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {STATUS_DURATION_OPTIONS.map((option) => {
              const value = toDurationValue(option.durationMs);
              const selected = durationValue === value;
              return (
                <Pressable
                  key={`${option.labelKey}:${option.count ?? "forever"}`}
                  onPress={() => setDurationValue(value)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: selected
                      ? `${theme.colors.primary}18`
                      : theme.colors.surface,
                  }}
                >
                  <Typography level="body-xs" weight={selected ? 700 : 500}>
                    {formatCustomStatusClearLabel(option.durationMs)}
                  </Typography>
                </Pressable>
              );
            })}
          </Box>
        </Box>

        <Box style={{ flexDirection: "row", gap: 8 }}>
          <Button expand disabled={!canSave} onPress={save}>
            {t("status.saveCustom")}
          </Button>
          {canClear && (
            <Button
              expand
              variant="plain"
              color="danger"
              onPress={clearStatus}
            >
              {t("clear")}
            </Button>
          )}
        </Box>
      </Box>
    );
  },
);
