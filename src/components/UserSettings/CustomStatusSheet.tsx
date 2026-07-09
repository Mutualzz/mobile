import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
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
  Typography,
  useTheme,
} from "@mutualzz/ui-native";
import { useScaledSquareSize } from "@utils/accessibilityLayout";
import { CaretDownIcon, CheckIcon, XIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Image, Pressable, View } from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
}

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

export const CustomStatusSheet = observer(({ visible, onClose }: Props) => {
  const app = useAppStore();
  const { theme } = useTheme();
  const [text, setText] = useState(app.customStatus.effectiveText);
  const [emoji, setEmoji] = useState<PresenceActivityEmoji | null>(
    app.customStatus.effectiveEmoji,
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [durationValue, setDurationValue] = useState(
    toDurationValue(STATUS_DURATION_OPTIONS[4]?.durationMs ?? 24 * 60 * 60_000),
  );
  const [durationPickerOpen, setDurationPickerOpen] = useState(false);

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
    onClose();
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
    onClose();
  };

  return (
    <Modal
      open={visible}
      onClose={onClose}
      layout="fullscreen"
      showCloseButton={false}
      style={{
        justifyContent: "flex-end",
        alignItems: "stretch",
        backgroundColor: "transparent",
        paddingVertical: 0,
      }}
    >
      <View
        pointerEvents="box-none"
        style={{
          flex: 1,
          justifyContent: "flex-end",
          width: "100%",
        }}
      >
        <Paper
          elevation={app.settings?.preferEmbossed ? 4 : 2}
          style={{
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 20,
            gap: 12,
            height: "35%",
          }}
        >
          <Box
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography level="body-lg" weight="bold">
              Set your status
            </Typography>
            <IconButton
              variant="plain"
              color="neutral"
              padding={4}
              accessibilityLabel="Close"
              onPress={onClose}
            >
              <XIcon size={18} />
            </IconButton>
          </Box>

          <Box style={{ gap: 6 }}>
            <Typography level="body-xs" weight={700}>
              Status
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
                placeholder="Enter your status..."
                value={text}
                onChangeText={setText}
                maxLength={128}
                onSubmitEditing={save}
              />
            </Box>
          </Box>

          <Box style={{ gap: 6 }}>
            <Typography level="body-xs" weight={700}>
              Clear after
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

          <Box style={{ flexDirection: "row", gap: 6 }}>
            <Button expand onPress={save}>
              Save
            </Button>

            {canClear && (
              <Button
                expand
                variant="plain"
                color="danger"
                onPress={clearStatus}
              >
                Clear status
              </Button>
            )}
          </Box>
        </Paper>
      </View>

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
            const active = durationValue === value;

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
                  backgroundColor: active
                    ? `${theme.colors.primary}18`
                    : undefined,
                }}
              >
                <Typography level="body-sm" weight={active ? 600 : undefined}>
                  {formatCustomStatusClearLabel(option.durationMs)}
                </Typography>
                {active ? (
                  <CheckIcon
                    size={16}
                    weight="bold"
                    color={theme.colors.success}
                  />
                ) : null}
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
    </Modal>
  );
});
