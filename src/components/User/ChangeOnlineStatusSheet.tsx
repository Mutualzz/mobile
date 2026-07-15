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
import { useTranslation } from "react-i18next";

interface Props {
  visible?: boolean;
  onClose: () => void;
  onDone?: () => void;
  embedded?: boolean;
}

export const ChangeOnlineStatusSheet = observer(
  ({ visible = true, onClose, onDone, embedded = false }: Props) => {
    const { t } = useTranslation("common");
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
    const isActive = embedded || visible;

    const STATUS_OPTIONS: {
      status: PresenceStatus;
      label: string;
      description?: string;
      showInvisible?: boolean;
    }[] = [
      { status: "online", label: t("status.online") },
      {
        status: "idle",
        label: t("status.idle"),
        description: t("status.idleDescription"),
      },
      {
        status: "dnd",
        label: t("status.dnd"),
        description: t("status.dndDescription"),
      },
      {
        status: "invisible",
        label: t("status.invisible"),
        description: t("status.invisibleDescription"),
        showInvisible: true,
      },
    ];

    useEffect(() => {
      if (!isActive) return;
      setSelectedStatus(null);
      setSelectedDurationMs(STATUS_DURATION_OPTIONS[1]?.durationMs ?? null);
    }, [isActive]);

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
        embedded={embedded}
        open={visible}
        onClose={onClose}
        title={t("customStatus.changeStatus")}
        maxHeight="95%"
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
            {t("status.clearOnlineAfter")}
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
                  key={`${option.labelKey}:${option.count ?? "forever"}`}
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
                    {option.count == null
                      ? t(option.labelKey)
                      : t(option.labelKey, { count: option.count })}
                  </Typography>
                </Pressable>
              );
            })}
          </Box>
        </Box>

        <Divider style={{ marginVertical: 4 }} />

        <CustomStatusEditor active={isActive} onSaved={onClose} />
      </BottomSheet>
    );
  },
);
