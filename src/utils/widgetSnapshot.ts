import { ChannelType } from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import { getVoiceLiveActivityThemeColors } from "@utils/voiceLiveActivityTheme";
import * as VoiceLiveActivity from "voice-live-activity";

export type WidgetSnapshotPayload = {
  updatedAt: number;
  unread: {
    channelCount: number;
    mentionCount: number;
    topChannelId: string;
    topChannelName: string;
    topDeepLink: string;
    topIsDm: boolean;
  };
  friends: Array<{
    id: string;
    displayName: string;
    status: string;
  }>;
  spaces: Array<{
    id: string;
    name: string;
    unreadCount: number;
    mentionCount: number;
    deepLink: string;
  }>;
  dms: Array<{
    id: string;
    name: string;
    unread: boolean;
    mentionCount: number;
    deepLink: string;
  }>;
  voice: {
    connected: boolean;
    muted: boolean;
    deafened: boolean;
    channelId: string;
    channelName: string;
    spaceName: string;
    deepLink: string;
    members: Array<{
      id: string;
      displayName: string;
      muted: boolean;
      deafened: boolean;
    }>;
  };
  theme: {
    accentColor: string;
    textColor: string;
    mutedTextColor: string;
    dangerColor: string;
    backgroundColor: string;
  };
};

function channelTitle(app: AppStore, channelId: string): string {
  const channel = app.channels.get(channelId);
  if (!channel) return "Channel";

  if (channel.type === ChannelType.DM) {
    return channel.dmRecipient?.displayName ?? "Direct Message";
  }

  if (channel.type === ChannelType.GroupDM) {
    if (channel.name?.trim()) return channel.name.trim();
    const names = channel.dmRecipientsList
      .map((user) => user.displayName)
      .filter(Boolean);
    if (!names.length) return "Group DM";
    if (names.length <= 2) return names.join(", ");
    return `${names.slice(0, 2).join(", ")}, +${names.length - 2}`;
  }

  const spaceName = channel.space?.name?.trim();
  const channelName = channel.name?.trim() || "channel";
  return spaceName ? `${spaceName} #${channelName}` : `#${channelName}`;
}

function deepLinkForChannel(app: AppStore, channelId: string): string {
  const channel = app.channels.get(channelId);
  if (!channel) return "com.mutualzz.app://";
  if (
    channel.type === ChannelType.DM ||
    channel.type === ChannelType.GroupDM
  ) {
    return `com.mutualzz.app://@me/${channelId}`;
  }
  return `com.mutualzz.app://spaces/channel/${channelId}`;
}

export function buildWidgetSnapshot(app: AppStore): WidgetSnapshotPayload {
  const unreadChannels: Array<{
    id: string;
    mentionCount: number;
    isDm: boolean;
    lastMessageId: string;
  }> = [];

  let mentionCount = 0;

  for (const channel of app.channels.all) {
    if (
      channel.type === ChannelType.Category ||
      channel.type === ChannelType.Voice
    ) {
      continue;
    }

    const readState = app.readStates.get(channel.id);
    const mentions = readState?.mentionCount ?? 0;
    mentionCount += mentions;

    const isUnread = readState?.isUnread === true || mentions > 0;
    if (!isUnread) continue;

    unreadChannels.push({
      id: channel.id,
      mentionCount: mentions,
      isDm:
        channel.type === ChannelType.DM ||
        channel.type === ChannelType.GroupDM,
      lastMessageId: channel.lastMessageId ?? channel.id,
    });
  }

  unreadChannels.sort((a, b) => {
    if (a.mentionCount !== b.mentionCount) {
      return b.mentionCount - a.mentionCount;
    }
    if (a.isDm !== b.isDm) return a.isDm ? -1 : 1;
    try {
      const diff = BigInt(b.lastMessageId) - BigInt(a.lastMessageId);
      return diff > 0n ? 1 : diff < 0n ? -1 : 0;
    } catch {
      return 0;
    }
  });

  const top = unreadChannels[0];
  const friends = app.relationships.online
    .slice(0, 6)
    .flatMap((relationship) => {
      const id = relationship.otherUserIdForMe;
      if (!id) return [];
      const user = relationship.otherUser;
      return [
        {
          id,
          displayName: user?.displayName ?? id,
          status: app.presence.get(id)?.status ?? "online",
        },
      ];
    });

  const spaces = app.spaces.all.slice(0, 40).map((space) => {
    let unreadCount = 0;
    let spaceMentions = 0;
    for (const channel of space.channels) {
      if (
        channel.type === ChannelType.Category ||
        channel.type === ChannelType.Voice
      ) {
        continue;
      }
      const readState = app.readStates.get(channel.id);
      const mentions = readState?.mentionCount ?? 0;
      spaceMentions += mentions;
      if (readState?.isUnread === true || mentions > 0) unreadCount += 1;
    }
    const firstText = space.channels.find(
      (channel) =>
        channel.type !== ChannelType.Category &&
        channel.type !== ChannelType.Voice,
    );
    return {
      id: space.id,
      name: space.name,
      unreadCount,
      mentionCount: spaceMentions,
      deepLink: firstText
        ? `com.mutualzz.app://spaces/channel/${firstText.id}`
        : `com.mutualzz.app://spaces/${space.id}`,
    };
  });

  const dms = app.channels.dms.slice(0, 30).map((channel) => {
    const readState = app.readStates.get(channel.id);
    const mentions = readState?.mentionCount ?? 0;
    return {
      id: channel.id,
      name: channelTitle(app, channel.id),
      unread: readState?.isUnread === true || mentions > 0,
      mentionCount: mentions,
      deepLink: `com.mutualzz.app://@me/${channel.id}`,
    };
  });

  const voiceChannelId = app.voice.currentChannelId;
  const voiceChannel = voiceChannelId
    ? app.channels.get(voiceChannelId)
    : null;
  const members = voiceChannelId
    ? app.voiceStates.getAllByChannel(voiceChannelId).slice(0, 8).map((state) => {
        const user = app.users.get(state.userId);
        return {
          id: state.userId,
          displayName: user?.displayName ?? state.userId,
          muted: state.selfMute === true || state.spaceMute === true,
          deafened: state.selfDeaf === true || state.spaceDeaf === true,
        };
      })
    : [];

  return {
    updatedAt: Date.now(),
    unread: {
      channelCount: unreadChannels.length,
      mentionCount,
      topChannelId: top?.id ?? "",
      topChannelName: top ? channelTitle(app, top.id) : "",
      topDeepLink: top
        ? deepLinkForChannel(app, top.id)
        : "com.mutualzz.app://",
      topIsDm: top?.isDm ?? false,
    },
    friends,
    spaces,
    dms,
    voice: {
      connected: app.voice.connectionStatus === "connected",
      muted: app.voice.effectiveSelfMute === true,
      deafened: app.voice.effectiveSelfDeaf === true,
      channelId: voiceChannelId ?? "",
      channelName: voiceChannel?.name?.trim() || "Voice",
      spaceName: voiceChannel?.space?.name?.trim() || "",
      deepLink: voiceChannelId
        ? `com.mutualzz.app://spaces/channel/${voiceChannelId}`
        : "com.mutualzz.app://",
      members,
    },
    theme: getVoiceLiveActivityThemeColors(app),
  };
}

let lastWrittenJson = "";

export function publishWidgetSnapshot(app: AppStore) {
  if (!app.isGatewayReady) return;

  try {
    const snapshot = buildWidgetSnapshot(app);
    const json = JSON.stringify(snapshot);
    if (json === lastWrittenJson) return;
    lastWrittenJson = json;

    if (typeof VoiceLiveActivity.writeNativeWidgetSnapshot === "function") {
      VoiceLiveActivity.writeNativeWidgetSnapshot(json);
    }
    if (typeof VoiceLiveActivity.reloadNativeWidgets === "function") {
      VoiceLiveActivity.reloadNativeWidgets();
    }
  } catch {
    return;
  }
}
