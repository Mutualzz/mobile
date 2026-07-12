import { MinecraftAvatar } from "@components/Minecraft/MinecraftAvatar";
import {
  MessageBase,
  MessageContent,
  MessageInfo,
  MessageRow,
} from "@components/Message/MessageBase";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppStore } from "@hooks/useStores";
import type { BridgeFeedEntry } from "@stores/BridgeChat.store";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { CubeIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { Image } from "react-native";

export const bridgeAuthorKey = (entry: BridgeFeedEntry) =>
  entry.uuid ??
  entry.userId ??
  entry.linkedUser?.id ??
  `${entry.source}:${entry.name}`;

export const shouldStartBridgeGroup = (
  prev: BridgeFeedEntry | undefined,
  entry: BridgeFeedEntry,
) => {
  if (!prev) return true;
  if (entry.kind !== "chat" || prev.kind !== "chat") return true;
  if (bridgeAuthorKey(prev) !== bridgeAuthorKey(entry)) return true;
  if (prev.source !== entry.source) return true;
  const prevAt = new Date(prev.at);
  const at = new Date(entry.at);
  if (prevAt.toDateString() !== at.toDateString()) return true;
  return at.getTime() - prevAt.getTime() > 10 * 60 * 1000;
};

const BridgeAvatar = observer(({ entry }: { entry: BridgeFeedEntry }) => {
  const app = useAppStore();
  const { theme } = useTheme();

  if (entry.avatarUrl) {
    return (
      <Image
        source={{ uri: entry.avatarUrl }}
        style={{ width: 40, height: 40, borderRadius: 20 }}
      />
    );
  }

  const linkedId = entry.linkedUser?.id ?? entry.userId;
  if (linkedId) {
    const user =
      app.users.get(linkedId) ??
      (app.account?.id === linkedId ? app.account : null);
    if (user) return <UserAvatar user={user} size="md" />;
  }

  if (entry.uuid) {
    return <MinecraftAvatar uuid={entry.uuid} name={entry.name} size={40} />;
  }

  return (
    <Box
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(128,128,128,0.25)",
      }}
    >
      <CubeIcon
        weight="fill"
        size={18}
        color={theme.typography.colors.muted}
      />
    </Box>
  );
});

interface Props {
  entry: BridgeFeedEntry;
  header?: boolean;
}

export const BridgeMessage = observer(({ entry, header }: Props) => {
  const { t } = useTranslation("settings");
  const { theme } = useTheme();

  const sourceLabel =
    entry.source === "minecraft"
      ? t("minecraftBridge.liveSourceMinecraft")
      : entry.source === "discord"
        ? t("minecraftBridge.liveSourceDiscord")
        : t("minecraftBridge.liveSourceApp");

  if (entry.kind !== "chat") {
    const label =
      entry.kind === "join"
        ? t("minecraftBridge.liveJoined", { name: entry.name })
        : entry.kind === "leave"
          ? t("minecraftBridge.liveLeft", { name: entry.name })
          : entry.kind === "voice_join"
            ? t("minecraftBridge.liveVoiceJoined", {
                name: entry.name,
                channel: entry.content
                  ? `#${entry.content}`
                  : t("minecraftBridge.liveVoiceFallback"),
              })
            : t("minecraftBridge.liveVoiceLeft", {
                name: entry.name,
                channel: entry.content
                  ? `#${entry.content}`
                  : t("minecraftBridge.liveVoiceFallback"),
              });

    return (
      <MessageBase header system style={{ overflow: "hidden", minWidth: 0 }}>
        <MessageInfo>
          {entry.uuid ? (
            <MinecraftAvatar uuid={entry.uuid} name={entry.name} size={40} />
          ) : (
            <Box
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(128,128,128,0.25)",
              }}
            >
              <CubeIcon
                weight="fill"
                size={18}
                color={theme.typography.colors.muted}
              />
            </Box>
          )}
        </MessageInfo>
        <MessageContent>
          <Typography
            level="body-sm"
            textColor="muted"
            style={{ flexShrink: 1 }}
          >
            {label}
          </Typography>
        </MessageContent>
      </MessageBase>
    );
  }

  return (
    <MessageBase header={header} style={{ overflow: "hidden", minWidth: 0 }}>
      <MessageRow header={header}>
        <MessageInfo>
          {header ? <BridgeAvatar entry={entry} /> : <Box style={{ width: 40 }} />}
        </MessageInfo>
        <MessageContent>
          {header && (
            <Box
              style={{
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 6,
                minWidth: 0,
              }}
            >
              <Typography level="body-sm" weight="bold" truncate="single">
                {entry.name}
              </Typography>
              <Typography level="body-xs" textColor="muted">
                {sourceLabel}
              </Typography>
              {entry.pending && (
                <Typography level="body-xs" textColor="muted">
                  {t("minecraftBridge.pendingSend")}
                </Typography>
              )}
              {entry.failed && (
                <Typography level="body-xs" color="danger">
                  {t("minecraftBridge.failedSend")}
                </Typography>
              )}
            </Box>
          )}
          <Typography level="body-sm" style={{ flexShrink: 1 }}>
            {entry.content}
          </Typography>
        </MessageContent>
      </MessageRow>
    </MessageBase>
  );
});
