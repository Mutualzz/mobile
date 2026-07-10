import { Button } from "@components/Button";
import { ReactionEmojiPicker } from "@components/Expression/ReactionEmojiPicker";
import { UnicodeEmoji } from "@components/emojis/UnicodeEmoji";
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
  Modal,
  Paper,
  Typography,
  useTheme,
} from "@mutualzz/ui-native";
import { useScaledSquareSize } from "@utils/accessibilityLayout";
import { CaretDownIcon, CheckIcon, XIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
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
    const app = useAppStore();
    const { theme } = useTheme();
    const [text, setText] = useState("");
    const [emoji, setEmoji] = useState<PresenceActivityEmoji | null>(null);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [durationValue, setDurationValue] = useState("forever");
    const [durationPickerOpen, setDurationPickerOpen] = useState(false);

    useEffect(() => {
      if (!active) return;

      setText(app.customStatus.effectiveText);
      setEmoji(app.customStatus.effectiveEmoji);
      setDurationValue(
        toDurationValue(
          STATUS_DURATION_OPTIONS[4]?.durationMs ?? 24 * 60 * 60_000,
        ),
      );
      setPickerOpen(false);
      setDurationPickerOpen(false);
    }, [
      active,
      app.customStatus.effectiveEmoji,
      app.customStatus.effectiveText,
    ]);

    const selectedDurationOption = STATUS_DURATION_OPTIONS.find(
      (option) => toDurationValue(option.durationMs) === durationValue,
    );

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
      <>
        <Box style={{ gap: 8, paddingHorizontal: 8 }}>
          <Typography level="body-xs" weight={700}>
            Custom status
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
                accessibilityLabel="Pick an emoji"
                onPress={() => setPickerOpen(true)}
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
                  accessibilityLabel="Remove emoji"
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
              placeholder="What's on your mind?"
              value={text}
              onChangeText={setText}
              maxLength={128}
              onSubmitEditing={save}
            />
          </Box>

          <Box style={{ gap: 6 }}>
            <Typography level="body-xs" weight={700}>
              Clear custom status after
            </Typography>
            <Pressable
              onPress={() => setDurationPickerOpen(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: `${theme.typography.colors.muted}48`,
              }}
            >
              <Typography level="body-sm" truncate="single">
                {formatCustomStatusClearLabel(
                  selectedDurationOption?.durationMs ?? null,
                )}
              </Typography>
              <CaretDownIcon
                size={14}
                weight="bold"
                color={theme.typography.colors.muted}
              />
            </Pressable>
          </Box>

          <Box style={{ flexDirection: "row", gap: 8 }}>
            <Button expand disabled={!canSave} onPress={save}>
              Save custom status
            </Button>
            {canClear && (
              <Button
                expand
                variant="plain"
                color="danger"
                onPress={clearStatus}
              >
                Clear
              </Button>
            )}
          </Box>
        </Box>

        <Modal
          open={durationPickerOpen}
          onClose={() => setDurationPickerOpen(false)}
          layout="center"
          showCloseButton={false}
        >
          <Paper
            elevation={app.settings?.preferEmbossed ? 4 : 2}
            style={{
              width: "100%",
              maxWidth: 280,
              borderRadius: 16,
              padding: 8,
              gap: 2,
            }}
          >
            {STATUS_DURATION_OPTIONS.map((option) => {
              const value = toDurationValue(option.durationMs);
              const selected = durationValue === value;

              return (
                <Pressable
                  key={option.label}
                  onPress={() => {
                    setDurationValue(value);
                    setDurationPickerOpen(false);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: selected
                      ? `${theme.colors.primary}18`
                      : undefined,
                  }}
                >
                  <Typography
                    level="body-sm"
                    weight={selected ? 600 : undefined}
                  >
                    {formatCustomStatusClearLabel(option.durationMs)}
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
          </Paper>
        </Modal>

        <ReactionEmojiPicker
          visible={pickerOpen}
          title="Pick an emoji"
          onClose={() => setPickerOpen(false)}
          onSelectEmoji={(pickerEmoji) => {
            setEmoji({ name: pickerEmoji.emoji });
            setPickerOpen(false);
          }}
          onSelectCustomEmoji={(expression) => {
            setEmoji({
              id: expression.id,
              name: expression.name,
              animated: expression.animated,
            });
            setPickerOpen(false);
          }}
        />
      </>
    );
  },
);
