import { Button } from "@components/Button";
import { ReactionEmojiPicker } from "@components/Expression/ReactionEmojiPicker";
import { UnicodeEmoji } from "@components/emojis/UnicodeEmoji";
import { BottomSheet } from "@components/Keyboard";
import { useAppStore } from "@hooks/useStores";
import {
  formatCustomStatusClearLabel,
  hasCustomStatusContent,
} from "@mutualzz/client";
import { STATUS_DURATION_OPTIONS } from "@mutualzz/client";
import type { PresenceActivityEmoji } from "@mutualzz/types";
import { IconButton } from "@components/IconButton";
import { Box, InputDefault, Typography, useTheme } from "@mutualzz/ui-native";
import { useScaledSquareSize } from "@utils/accessibilityLayout";
import { CaretRightIcon, CheckIcon, XIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { Fragment, useEffect, useMemo, useState } from "react";
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
    const [text, setText] = useState("");
    const [emoji, setEmoji] = useState<PresenceActivityEmoji | null>(null);
    const [durationValue, setDurationValue] = useState("forever");
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const [durationPickerOpen, setDurationPickerOpen] = useState(false);

    useEffect(() => {
      if (!active) {
        setEmojiPickerOpen(false);
        setDurationPickerOpen(false);
        return;
      }

      setText(app.customStatus.effectiveText);
      setEmoji(app.customStatus.effectiveEmoji);
      setDurationValue("forever");
    }, [
      active,
      app.customStatus.effectiveEmoji,
      app.customStatus.effectiveText,
    ]);

    const selectedDurationLabel = useMemo(() => {
      const option = STATUS_DURATION_OPTIONS.find(
        (entry) => toDurationValue(entry.durationMs) === durationValue,
      );
      return formatCustomStatusClearLabel(option?.durationMs ?? null, t);
    }, [durationValue]);

    const trimmedText = text.trim();
    const canSave =
      hasCustomStatusContent(trimmedText, emoji) && trimmedText.length <= 128;
    const canClear =
      app.customStatus.enabled || !!app.customStatus.scheduledCustomStatus;

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
      app.gateway.clearCustomStatus();
      setText("");
      setEmoji(null);
      setDurationValue("forever");
      onSaved?.();
    };

    return (
      <Fragment>
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
                padding={4}
                accessibilityLabel={t("customStatus.pickEmoji")}
                onPress={() => setEmojiPickerOpen(true)}
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

          <Pressable
            accessibilityRole="button"
            onPress={() => setDurationPickerOpen(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: theme.colors.surface,
            }}
          >
            <Typography level="body-sm" weight={600}>
              {t("status.clearCustomAfter")}
            </Typography>
            <Box
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                flexShrink: 1,
                minWidth: 0,
              }}
            >
              <Typography
                level="body-sm"
                textColor="muted"
                truncate="single"
                style={{ flexShrink: 1 }}
              >
                {selectedDurationLabel}
              </Typography>
              <CaretRightIcon
                size={14}
                weight="bold"
                color={theme.typography.colors.muted}
              />
            </Box>
          </Pressable>

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

        <ReactionEmojiPicker
          visible={emojiPickerOpen}
          title={t("customStatus.pickEmoji")}
          onClose={() => setEmojiPickerOpen(false)}
          onSelectEmoji={(pickerEmoji) => {
            setEmoji({ name: pickerEmoji.emoji });
          }}
          onSelectCustomEmoji={(expression) => {
            setEmoji({
              id: expression.id,
              name: expression.name,
              animated: expression.animated,
            });
          }}
        />

        <BottomSheet
          open={durationPickerOpen}
          onClose={() => setDurationPickerOpen(false)}
          title={t("status.clearCustomAfter")}
          maxHeight="60%"
          elevation={app.settings?.preferEmbossed ? 4 : 2}
        >
          {STATUS_DURATION_OPTIONS.map((option) => {
            const value = toDurationValue(option.durationMs);
            const selected = durationValue === value;

            return (
              <Pressable
                key={`${option.labelKey}:${option.count ?? "forever"}`}
                onPress={() => {
                  setDurationValue(value);
                  setDurationPickerOpen(false);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  borderRadius: 8,
                  backgroundColor: selected
                    ? `${theme.colors.primary}18`
                    : undefined,
                }}
              >
                <Typography
                  level="body-sm"
                  weight={selected ? 700 : 500}
                  style={{ flex: 1 }}
                >
                  {formatCustomStatusClearLabel(option.durationMs, t)}
                </Typography>
                {selected && (
                  <CheckIcon
                    size={16}
                    weight="bold"
                    color={theme.colors.success}
                  />
                )}
              </Pressable>
            );
          })}
        </BottomSheet>
      </Fragment>
    );
  },
);
