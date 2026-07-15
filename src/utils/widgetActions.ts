import { ChannelType } from "@mutualzz/types";
import { Linking, Platform } from "react-native";
import type { AppStore } from "@stores/App.store";
import { addWidgetActionListener } from "voice-live-activity";
import { publishWidgetSnapshot } from "@utils/widgetSnapshot";

export function bindWidgetActionHandlers(app: AppStore) {
  if (Platform.OS !== "ios") {
    return { remove() {} };
  }

  try {
    return addWidgetActionListener((action) => {
      if (typeof action !== "string" || action.length === 0) return;

      if (action === "openTopUnread") {
        const channels = app.channels?.all;
        if (!Array.isArray(channels)) return;
        const snapshotChannel = channels.find((channel) => {
          const readState = app.readStates.get(channel.id);
          return (
            readState?.isUnread === true || (readState?.mentionCount ?? 0) > 0
          );
        });
        if (!snapshotChannel) return;
        const isDm =
          snapshotChannel.type === ChannelType.DM ||
          snapshotChannel.type === ChannelType.GroupDM;
        void Linking.openURL(
          isDm
            ? `com.mutualzz.app://@me/${snapshotChannel.id}`
            : `com.mutualzz.app://spaces/channel/${snapshotChannel.id}`,
        );
        return;
      }

      if (action.startsWith("markRead:")) {
        const channelId = action.slice("markRead:".length);
        if (!channelId) return;
        const readState = app.readStates.get(channelId);
        const ack = readState?.ack?.();
        if (ack && typeof ack.finally === "function") {
          void ack.finally(() => {
            publishWidgetSnapshot(app);
          });
        } else {
          publishWidgetSnapshot(app);
        }
      }
    });
  } catch {
    return { remove() {} };
  }
}
