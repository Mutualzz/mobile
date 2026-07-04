import { IconButton } from "@components/IconButton";
import { Paper } from "@components/Paper";
import { StatusBadge } from "@components/StatusBadge";
import {
  CustomStatusSheet,
  EmojiPreview,
} from "@components/UserSettings/CustomStatusSheet";
import { useAppStore } from "@hooks/useStores";
import type { PresenceStatus } from "@mutualzz/types";
import { Box, Divider, Typography, useTheme } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { CheckIcon, SmileyIcon, XIcon } from "phosphor-react-native";
import { useState } from "react";
import { Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  onClose: () => void;
  onDone: () => void;
}

const STATUS_OPTIONS: {
  status: PresenceStatus;
  label: string;
  description?: string;
  showInvisible?: boolean;
}[] = [
  { status: "online", label: "Online" },
  {
    status: "idle",
    label: "Idle",
    description: "Away from keyboard",
  },
  {
    status: "dnd",
    label: "Do Not Disturb",
    description: "You won't receive notifications",
  },
  {
    status: "invisible",
    label: "Invisible",
    description: "Appear offline",
    showInvisible: true,
  },
];

export const ChangeOnlineStatusModal = observer(
  ({ visible, onClose, onDone }: Props) => {
    const app = useAppStore();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const account = app.account;
    const effectiveStatus = app.presence.get(account?.id ?? "")?.status;
    const customStatusText = app.customStatus.effectiveText;
    const customStatusEmoji = app.customStatus.effectiveEmoji;
    const [customStatusSheetOpen, setCustomStatusSheetOpen] = useState(false);

    const selectStatus = (status: PresenceStatus) => {
      app.gateway.setStatus(status, { persist: true });
      onDone();
    };

    if (!account) return null;

    return (
      <>
        <Modal
          visible={visible}
          animationType="slide"
          transparent
          onRequestClose={onClose}
        >
          <Box
            style={{
              flex: 1,
              justifyContent: "flex-end",
              backgroundColor: "rgba(0,0,0,0.45)",
            }}
          >
            <Pressable style={{ flex: 1 }} onPress={onClose} />
            <Pressable onPress={() => undefined}>
              <Paper
                elevation={app.settings?.preferEmbossed ? 4 : 2}
                style={{
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  padding: 16,
                  paddingBottom: Math.max(16, insets.bottom),
                  gap: 4,
                }}
              >
                <Box
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: 8,
                  }}
                >
                  <Typography level="body-md" weight="bold">
                    Change Online Status
                  </Typography>
                  <IconButton
                    variant="plain"
                    padding={4}
                    accessibilityLabel="Close"
                    onPress={onClose}
                  >
                    <XIcon size={18} weight="bold" />
                  </IconButton>
                </Box>

                {STATUS_OPTIONS.map((option) => {
                  const active = effectiveStatus === option.status;

                  return (
                    <Pressable
                      key={option.status}
                      onPress={() => selectStatus(option.status)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        paddingVertical: 8,
                        paddingHorizontal: 8,
                        borderRadius: 8,
                        backgroundColor: active
                          ? `${theme.colors.primary}18`
                          : undefined,
                      }}
                    >
                      <StatusBadge
                        inPicker
                        status={option.status}
                        size={60}
                        showInvisible={option.showInvisible}
                        elevation={app.settings?.preferEmbossed ? 4 : 2}
                      />
                      <Box style={{ flex: 1, gap: 1, minWidth: 0 }}>
                        <Typography level="body-sm" weight={600}>
                          {option.label}
                        </Typography>
                        {option.description ? (
                          <Typography
                            level="body-xs"
                            textColor="muted"
                            numberOfLines={1}
                          >
                            {option.description}
                          </Typography>
                        ) : null}
                      </Box>
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

                <Divider style={{ marginVertical: 8 }} />

                <Pressable
                  onPress={() => setCustomStatusSheetOpen(true)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                    borderRadius: 8,
                    backgroundColor: theme.colors.surface,
                  }}
                >
                  <Box
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: `${theme.colors.neutral}18`,
                    }}
                  >
                    {customStatusEmoji ? (
                      <EmojiPreview emoji={customStatusEmoji} />
                    ) : (
                      <SmileyIcon
                        size={18}
                        color={theme.typography.colors.muted}
                      />
                    )}
                  </Box>
                  <Typography
                    level="body-sm"
                    textColor={customStatusText ? undefined : "muted"}
                    numberOfLines={1}
                    style={{ flex: 1 }}
                  >
                    {customStatusText || "Set a custom status..."}
                  </Typography>
                </Pressable>
              </Paper>
            </Pressable>
          </Box>
        </Modal>

        <CustomStatusSheet
          visible={customStatusSheetOpen}
          onClose={() => setCustomStatusSheetOpen(false)}
        />
      </>
    );
  },
);
