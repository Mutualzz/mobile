import { reaction } from "mobx";
import type { AppStore } from "@stores/App.store";
import { publishWidgetSnapshot } from "@utils/widgetSnapshot";
import { bindWidgetActionHandlers } from "@utils/widgetActions";

export function startWidgetSnapshotSync(app: AppStore) {
  bindWidgetActionHandlers(app);
  publishWidgetSnapshot(app);

  return reaction(
    () => {
      const unreadFingerprint = app.channels.all
        .map((channel) => {
          const readState = app.readStates.get(channel.id);
          return [
            channel.id,
            channel.lastMessageId ?? "",
            readState?.isUnread ? "1" : "0",
            String(readState?.mentionCount ?? 0),
          ].join(":");
        })
        .join("|");

      const friendsFingerprint = app.relationships.online
        .map((relationship) => {
          const id = relationship.otherUserIdForMe;
          if (!id) return "";
          return `${id}:${app.presence.get(id)?.status ?? "offline"}`;
        })
        .join("|");

      const voiceFingerprint = app.voiceStates.all
        .map(
          (state) =>
            `${state.userId}:${state.channelId ?? ""}:${state.selfMute ? 1 : 0}:${state.selfDeaf ? 1 : 0}`,
        )
        .join("|");

      return {
        ready: app.isGatewayReady,
        unreadFingerprint,
        friendsFingerprint,
        voiceFingerprint,
        spacesCount: app.spaces.all.length,
        themeId:
          app.settings?.currentTheme ?? app.themes?.currentTheme ?? null,
        voiceConnected: app.voice.connectionStatus === "connected",
        voiceChannelId: app.voice.currentChannelId ?? "",
        voiceMuted: app.voice.effectiveSelfMute,
        voiceDeafened: app.voice.effectiveSelfDeaf,
      };
    },
    ({ ready }) => {
      if (!ready) return;
      publishWidgetSnapshot(app);
    },
    { fireImmediately: true, delay: 250 },
  );
}
