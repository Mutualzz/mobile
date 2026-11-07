import { Button } from "@components/Button";
import { BottomSheet } from "@components/Keyboard";
import { MinecraftAvatar } from "@components/Minecraft/MinecraftAvatar";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppStore } from "@hooks/useStores";
import type { BridgeOnlinePlayer } from "@stores/BridgeChat.store";
import { Box, Typography } from "@mutualzz/ui-native";
import * as Clipboard from "expo-clipboard";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  player: BridgeOnlinePlayer;
  lastSeenAt?: string;
  onClose: () => void;
  onViewInventory?: () => void;
  onKick?: () => void;
  onBan?: () => void;
}

export const PlayerActionsSheet = observer(
  ({ player, lastSeenAt, onClose, onViewInventory, onKick, onBan }: Props) => {
    const { t } = useTranslation("settings");
    const app = useAppStore();
    const [copied, setCopied] = useState<"name" | "uuid" | null>(null);
    const linkedUser =
      player.linkedUser?.id != null
        ? (app.users.get(player.linkedUser.id) ?? null)
        : null;

    const copy = async (value: string, kind: "name" | "uuid") => {
      await Clipboard.setStringAsync(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    };

    return (
      <BottomSheet
        embedded
        open
        onClose={onClose}
        elevation={app.settings?.preferEmbossed ? 4 : 2}
      >
        <Box style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {linkedUser ? (
            <UserAvatar user={linkedUser} size="md" />
          ) : (
            <MinecraftAvatar uuid={player.uuid} name={player.name} size={40} />
          )}
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Typography level="body-md" weight="bold" truncate="single">
              {player.name}
            </Typography>
            {player.linkedUser && (
              <Typography level="body-xs" textColor="muted">
                {t("minecraftBridge.linkedMutualzz", {
                  name:
                    player.linkedUser.globalName || player.linkedUser.username,
                })}
              </Typography>
            )}
            {lastSeenAt && (
              <Typography level="body-xs" textColor="muted">
                {t("minecraftBridge.playersLastSeen", {
                  time: new Date(lastSeenAt).toLocaleString(),
                })}
              </Typography>
            )}
          </Box>
        </Box>

        <Typography level="body-xs" textColor="muted" selectable>
          {player.uuid}
        </Typography>

        <Box style={{ flexDirection: "row", gap: 8 }}>
          <Button
            size="sm"
            variant="soft"
            onPress={() => void copy(player.name, "name")}
          >
            {copied === "name"
              ? t("minecraftBridge.copied")
              : t("minecraftBridge.copyName")}
          </Button>
          <Button
            size="sm"
            variant="soft"
            onPress={() => void copy(player.uuid, "uuid")}
          >
            {copied === "uuid"
              ? t("minecraftBridge.copied")
              : t("minecraftBridge.copyUuid")}
          </Button>
        </Box>

        {onViewInventory && (
          <Button variant="soft" color="primary" onPress={onViewInventory}>
            {t("minecraftBridge.inventoryView")}
          </Button>
        )}

        {(onKick || onBan) && (
          <Box style={{ flexDirection: "row", gap: 8 }}>
            {onKick && (
              <Button
                variant="soft"
                color="warning"
                onPress={onKick}
                style={{ flex: 1 }}
              >
                {t("minecraftBridge.kickFromServer")}
              </Button>
            )}
            {onBan && (
              <Button
                variant="soft"
                color="danger"
                onPress={onBan}
                style={{ flex: 1 }}
              >
                {t("minecraftBridge.ban")}
              </Button>
            )}
          </Box>
        )}
      </BottomSheet>
    );
  },
);
