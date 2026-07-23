import { BottomSheet } from "@components/Keyboard";
import { StatusBadge } from "@components/StatusBadge";
import { useAppStore } from "@hooks/useStores";
import type { PresenceStatus } from "@mutualzz/types";
import { STATUS_DURATION_OPTIONS } from "@mutualzz/client";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { CaretLeftIcon, CheckIcon } from "phosphor-react-native";
import { useEffect, useMemo, useState } from "react";
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
    const [pendingStatus, setPendingStatus] = useState<PresenceStatus | null>(
      null,
    );
    const isActive = embedded || visible;

    const STATUS_OPTIONS: {
      status: PresenceStatus;
      label: string;
      description?: string;
      showInvisible?: boolean;
    }[] = useMemo(
      () => [
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
      ],
      [t],
    );

    const pendingOption = pendingStatus
      ? STATUS_OPTIONS.find((option) => option.status === pendingStatus)
      : null;

    useEffect(() => {
      if (!isActive) return;
      setPendingStatus(null);
    }, [isActive]);

    const applyDuration = (durationMs: number | null) => {
      if (!pendingStatus) return;

      if (durationMs == null) {
        app.gateway.clearScheduledStatus();
        app.gateway.setStatus(pendingStatus, { persist: true });
      } else {
        app.gateway.scheduleStatus({
          status: pendingStatus,
          durationMs,
        });
      }

      onDone?.();
      onClose();
    };

    if (!account) return null;

    return (
      <BottomSheet
        embedded={embedded}
        open={visible}
        onClose={onClose}
        title={
          pendingOption ? pendingOption.label : t("customStatus.changeStatus")
        }
        maxHeight="70%"
        elevation={app.settings?.preferEmbossed ? 4 : 2}
      >
        {pendingStatus && pendingOption ? (
          <Box style={{ gap: 12, paddingHorizontal: 8 }}>
            <Pressable
              onPress={() => setPendingStatus(null)}
              accessibilityRole="button"
              accessibilityLabel={t("nav.goBack")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                alignSelf: "flex-start",
              }}
            >
              <CaretLeftIcon
                size={16}
                weight="bold"
                color={theme.typography.colors.muted}
              />
              <Typography level="body-xs" textColor="muted" weight={600}>
                {t("nav.goBack")}
              </Typography>
            </Pressable>

            <Box
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 4,
              }}
            >
              <StatusBadge
                inPicker
                status={pendingStatus}
                size={48}
                showInvisible={pendingOption.showInvisible}
                elevation={app.settings?.preferEmbossed ? 4 : 2}
              />
              <Box style={{ flex: 1, gap: 2, minWidth: 0 }}>
                <Typography level="body-sm" weight={600}>
                  {pendingOption.label}
                </Typography>
                {pendingOption.description && (
                  <Typography
                    level="body-xs"
                    textColor="muted"
                    truncate="single"
                  >
                    {pendingOption.description}
                  </Typography>
                )}
              </Box>
            </Box>

            <Typography level="body-xs" textColor="muted">
              {t("status.clearOnlineAfter")}
            </Typography>

            <Box style={{ gap: 8 }}>
              {STATUS_DURATION_OPTIONS.map((option) => (
                <Pressable
                  key={`${option.labelKey}:${option.count ?? "forever"}`}
                  onPress={() => applyDuration(option.durationMs)}
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
                  <Typography level="body-sm" weight={500}>
                    {option.count == null
                      ? t(option.labelKey)
                      : t(option.labelKey, { count: option.count })}
                  </Typography>
                </Pressable>
              ))}
            </Box>
          </Box>
        ) : (
          STATUS_OPTIONS.map((option) => {
            const active = effectiveStatus === option.status;

            return (
              <Pressable
                key={option.status}
                onPress={() => setPendingStatus(option.status)}
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
          })
        )}
      </BottomSheet>
    );
  },
);
