import { BottomSheet } from "@components/Keyboard";
import { StatusBadge } from "@components/StatusBadge";
import { CustomStatusEditor } from "@components/User/CustomStatusEditor";
import { useAppStore } from "@hooks/useStores";
import type { PresenceStatus } from "@mutualzz/types";
import { STATUS_DURATION_OPTIONS } from "@utils/statusDurations";
import { Box, Divider, Typography, useTheme } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { CheckIcon } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { Pressable } from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  onDone?: () => void;
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
    const account = app.account;
    const effectiveStatus = app.presence.get(account?.id ?? "")?.status;
    const [selectedStatus, setSelectedStatus] = useState<PresenceStatus | null>(
      null,
    );
    const [selectedDurationMs, setSelectedDurationMs] = useState<number | null>(
      STATUS_DURATION_OPTIONS[1]?.durationMs ?? null,
    );

    useEffect(() => {
      if (!visible) return;
      setSelectedStatus(null);
      setSelectedDurationMs(STATUS_DURATION_OPTIONS[1]?.durationMs ?? null);
    }, [visible]);

    const selectStatus = (status: PresenceStatus) => {
      if (selectedDurationMs == null) {
        app.gateway.clearScheduledStatus();
        app.gateway.setStatus(status, { persist: true });
      } else {
        app.gateway.scheduleStatus({
          status,
          durationMs: selectedDurationMs,
        });
      }
      setSelectedStatus(status);
      onDone?.();
      onClose();
    };

    if (!account) return null;

    return (
      <BottomSheet
        open={visible}
        onClose={onClose}
        title="Change Status"
        maxHeight="92%"
        keyboard="scroll"
        elevation={app.settings?.preferEmbossed ? 4 : 2}
      >
        {STATUS_OPTIONS.map((option) => {
          const active =
            selectedStatus === option.status ||
            effectiveStatus === option.status;

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
                {option.description && (
                  <Typography
                    level="body-xs"
                    textColor="muted"
                    truncate="single"
                  >
                    {option.description}
                  </Typography>
                )}
              </Box>
              {active && (
                <CheckIcon
                  size={16}
                  weight="bold"
                  color={theme.colors.success}
                />
              )}
            </Pressable>
          );
        })}

        <Divider style={{ marginVertical: 4 }} />

        <Box style={{ gap: 8, paddingHorizontal: 8 }}>
          <Typography level="body-xs" textColor="muted">
            Clear online status after
          </Typography>
          <Box
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {STATUS_DURATION_OPTIONS.map((option) => {
              const active = selectedDurationMs === option.durationMs;
              return (
                <Pressable
                  key={option.label}
                  onPress={() => setSelectedDurationMs(option.durationMs)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: active
                      ? `${theme.colors.primary}18`
                      : theme.colors.surface,
                  }}
                >
                  <Typography level="body-xs" weight={active ? 700 : 500}>
                    {option.label}
                  </Typography>
                </Pressable>
              );
            })}
          </Box>
        </Box>

        <Divider style={{ marginVertical: 4 }} />

        <CustomStatusEditor active={visible} onSaved={onClose} />
      </BottomSheet>
    );
  },
);
