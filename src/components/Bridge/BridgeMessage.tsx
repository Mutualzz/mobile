import { AppLogo } from "@components/Logo/AppLogo";
import { MinecraftAvatar } from "@components/Minecraft/MinecraftAvatar";
import {
  MessageBase,
  MessageContent,
  MessageInfo,
  MessageRow,
} from "@components/Message/MessageBase";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppStore } from "@hooks/useStores";
import { ItemIcon } from "@components/Minecraft/inventory/ItemIcon";
import type {
  BridgeAdvancementDetails,
  BridgeFeedEntry,
} from "@stores/BridgeChat.store";
import { formatColor } from "@mutualzz/ui-core";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import {
  CaretDownIcon,
  CubeIcon,
  DiscordLogoIcon,
  SignInIcon,
  SignOutIcon,
  SkullIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
  TrophyIcon,
  UsersThreeIcon,
} from "phosphor-react-native";
import dayjs from "dayjs";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { Image, Pressable } from "react-native";

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
      <CubeIcon weight="fill" size={18} color={theme.typography.colors.muted} />
    </Box>
  );
});

type BridgeEventKind = Exclude<BridgeFeedEntry["kind"], "chat">;
type ThemeEventColor = "success" | "danger" | "warning" | "muted";

const EVENT_STYLE = {
  join: { Icon: SignInIcon, color: "success" },
  leave: { Icon: SignOutIcon, color: "muted" },
  voice_join: { Icon: SpeakerHighIcon, color: "success" },
  voice_leave: { Icon: SpeakerSlashIcon, color: "muted" },
  death: { Icon: SkullIcon, color: "danger" },
  advancement: { Icon: TrophyIcon, color: "warning" },
} as const satisfies Record<
  BridgeEventKind,
  { Icon: typeof CubeIcon; color: ThemeEventColor }
>;

const useEventColor = (color: ThemeEventColor) => {
  const { theme } = useTheme();
  if (color === "muted") return formatColor(theme.typography.colors.muted);
  return formatColor(theme.colors[color]);
};

const SOURCE_COLORS = {
  minecraft: "#62B246",
  discord: "#5865F2",
} as const;

const SOURCE_LABEL_KEYS = {
  minecraft: "minecraftBridge.liveSourceMinecraft",
  discord: "minecraftBridge.liveSourceDiscord",
  app: "minecraftBridge.liveSourceApp",
} as const;

const SourceBadge = ({ source }: { source: BridgeFeedEntry["source"] }) => {
  const { t } = useTranslation("settings");
  const { theme } = useTheme();
  const color =
    source === "app"
      ? formatColor(theme.colors.primary)
      : SOURCE_COLORS[source];

  return (
    <Box
      accessible
      accessibilityLabel={t(SOURCE_LABEL_KEYS[source])}
      style={{
        width: 18,
        height: 18,
        borderRadius: 4,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: formatColor(color, { alpha: 18, format: "hexa" }),
      }}
    >
      {source === "minecraft" && (
        <CubeIcon weight="fill" size={12} color={color} />
      )}
      {source === "discord" && (
        <DiscordLogoIcon weight="fill" size={12} color={color} />
      )}
      {source === "app" && <AppLogo size={12} />}
    </Box>
  );
};

const EventText = observer(
  ({
    label,
    name,
    accentColor,
  }: {
    label: string;
    name: string;
    accentColor: string;
  }) => {
    const { theme } = useTheme();
    const nameIndex = name ? label.indexOf(name) : -1;
    const before = nameIndex >= 0 ? label.slice(0, nameIndex) : "";
    const after = nameIndex >= 0 ? label.slice(nameIndex + name.length) : label;
    const parts = after.split(/(\[[^\]]+\])/);

    return (
      <Typography
        level="body-sm"
        textColor="secondary"
        style={{ flexShrink: 1 }}
      >
        {before}
        {nameIndex >= 0 && (
          <Typography
            level="body-sm"
            weight="bold"
            style={{ color: formatColor(theme.typography.colors.primary) }}
          >
            {name}
          </Typography>
        )}
        {parts.map((part, index) =>
          part.startsWith("[") && part.endsWith("]") ? (
            <Typography
              key={index}
              level="body-sm"
              weight="bold"
              style={{ color: accentColor }}
            >
              {part}
            </Typography>
          ) : (
            part
          ),
        )}
      </Typography>
    );
  },
);

const ShortTime = ({ at }: { at: string }) => (
  <Typography level="body-xs" textColor="muted" style={{ flexShrink: 0 }}>
    {dayjs(at).format("h:mm A")}
  </Typography>
);

const EventRow = observer(({ entry }: { entry: BridgeFeedEntry }) => {
  const { t } = useTranslation("settings");
  const kind = entry.kind as BridgeEventKind;
  const { Icon, color } = EVENT_STYLE[kind];
  const accentColor = useEventColor(color);

  const voiceChannel = entry.content
    ? `#${entry.content}`
    : t("minecraftBridge.liveVoiceFallback");

  const label = (() => {
    switch (kind) {
      case "death":
      case "advancement":
        return entry.content ?? entry.name;
      case "join":
        return t("minecraftBridge.liveJoined", { name: entry.name });
      case "leave":
        return t("minecraftBridge.liveLeft", { name: entry.name });
      case "voice_join":
        return t("minecraftBridge.liveVoiceJoined", {
          name: entry.name,
          channel: voiceChannel,
        });
      case "voice_leave":
        return t("minecraftBridge.liveVoiceLeft", {
          name: entry.name,
          channel: voiceChannel,
        });
    }
  })();

  return (
    <MessageBase system style={{ overflow: "hidden", minWidth: 0 }}>
      <MessageInfo style={{ alignItems: "center" }}>
        <Icon weight="fill" size={18} color={accentColor} />
      </MessageInfo>
      <Box
        style={{
          flex: 1,
          minWidth: 0,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
      >
        {entry.uuid && (
          <MinecraftAvatar uuid={entry.uuid} name={entry.name} size={20} />
        )}
        <EventText label={label} name={entry.name} accentColor={accentColor} />
        <ShortTime at={entry.at} />
      </Box>
    </MessageBase>
  );
});

const CHALLENGE_COLOR = "#A855F7";

const ADVANCEMENT_LABEL_KEYS = {
  task: "minecraftBridge.advancementFrameTask",
  goal: "minecraftBridge.advancementFrameGoal",
  challenge: "minecraftBridge.advancementFrameChallenge",
} as const satisfies Record<BridgeAdvancementDetails["frame"], string>;

const AdvancementCard = observer(
  ({
    entry,
    details,
  }: {
    entry: BridgeFeedEntry;
    details: BridgeAdvancementDetails;
  }) => {
    const { t } = useTranslation("settings");
    const { theme } = useTheme();
    const accentColor =
      details.frame === "challenge"
        ? CHALLENGE_COLOR
        : formatColor(theme.colors.warning);

    return (
      <MessageBase system style={{ overflow: "hidden", minWidth: 0 }}>
        <MessageInfo style={{ paddingTop: 2 }}>
          <TrophyIcon weight="fill" size={18} color={accentColor} />
        </MessageInfo>
        <MessageContent>
          <Box
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              minWidth: 0,
            }}
          >
            {entry.uuid && (
              <MinecraftAvatar uuid={entry.uuid} name={entry.name} size={20} />
            )}
            <Typography
              level="body-sm"
              textColor="secondary"
              style={{ flexShrink: 1 }}
            >
              <Typography
                level="body-sm"
                weight="bold"
                style={{ color: formatColor(theme.typography.colors.primary) }}
              >
                {entry.name}
              </Typography>{" "}
              {t(ADVANCEMENT_LABEL_KEYS[details.frame])}
            </Typography>
            <ShortTime at={entry.at} />
          </Box>
          <Box
            style={{
              marginTop: 6,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderRadius: 6,
              borderLeftWidth: 3,
              borderLeftColor: accentColor,
              backgroundColor: formatColor(accentColor, {
                alpha: 10,
                format: "hexa",
              }),
            }}
          >
            {details.icon && (
              <Box
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 4,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: formatColor(
                    theme.typography.colors.primary,
                    { alpha: 6, format: "hexa" },
                  ),
                }}
              >
                <ItemIcon type={details.icon} size={28} />
              </Box>
            )}
            <Box style={{ flexShrink: 1, minWidth: 0 }}>
              <Typography
                level="body-sm"
                weight="bold"
                style={{ color: accentColor }}
              >
                {details.title}
              </Typography>
              {!!details.description && (
                <Typography level="body-xs" textColor="secondary">
                  {details.description}
                </Typography>
              )}
            </Box>
          </Box>
        </MessageContent>
      </MessageBase>
    );
  },
);

const COLLAPSE_THRESHOLD = 3;
const SUMMARY_NAME_LIMIT = 3;

export type ActivityFamily = "server" | "voice";

const ACTIVITY_STYLE = {
  server: {
    Icon: UsersThreeIcon,
    summaryKey: "minecraftBridge.activitySummary",
  },
  voice: {
    Icon: SpeakerHighIcon,
    summaryKey: "minecraftBridge.activityVoiceSummary",
  },
} as const;

export const BridgeActivityGroup = observer(
  ({
    family,
    entries,
    expanded,
    onToggle,
  }: {
    family: ActivityFamily;
    entries: BridgeFeedEntry[];
    expanded: boolean;
    onToggle: () => void;
  }) => {
    const { t } = useTranslation("settings");
    const { theme } = useTheme();

    if (entries.length < COLLAPSE_THRESHOLD) {
      return (
        <Box>
          {entries.map((entry) => (
            <EventRow key={entry.id} entry={entry} />
          ))}
        </Box>
      );
    }

    const players = [
      ...new Map(
        entries.map((entry) => [bridgeAuthorKey(entry), entry]),
      ).values(),
    ];
    const shownPlayers = players.slice(0, SUMMARY_NAME_LIMIT);
    const hiddenCount = players.length - shownPlayers.length;
    const firstAt = dayjs(entries[0].at).format("h:mm A");
    const lastAt = dayjs(entries[entries.length - 1].at).format("h:mm A");
    const { Icon: GroupIcon, summaryKey } = ACTIVITY_STYLE[family];
    const mutedColor = formatColor(theme.typography.colors.muted);

    return (
      <Box>
        <Pressable
          onPress={onToggle}
          style={({ pressed }) => ({
            borderRadius: 6,
            ...(pressed && {
              backgroundColor: formatColor(theme.typography.colors.primary, {
                alpha: 6,
                format: "hexa",
              }),
            }),
          })}
        >
          <MessageBase system style={{ overflow: "hidden", minWidth: 0 }}>
            <MessageInfo style={{ alignItems: "center" }}>
              <GroupIcon weight="fill" size={18} color={mutedColor} />
            </MessageInfo>
            <Box
              style={{
                flex: 1,
                minWidth: 0,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Box style={{ flexDirection: "row", flexShrink: 0 }}>
                {shownPlayers.map((player, index) =>
                  player.uuid ? (
                    <Box
                      key={bridgeAuthorKey(player)}
                      style={{ marginLeft: index === 0 ? 0 : -6 }}
                    >
                      <MinecraftAvatar
                        uuid={player.uuid}
                        name={player.name}
                        size={20}
                      />
                    </Box>
                  ) : null,
                )}
              </Box>
              <Typography
                level="body-sm"
                textColor="secondary"
                style={{ flexShrink: 1 }}
              >
                <Typography
                  level="body-sm"
                  weight="bold"
                  style={{
                    color: formatColor(theme.typography.colors.primary),
                  }}
                >
                  {shownPlayers.map((player) => player.name).join(", ")}
                  {hiddenCount > 0 && ` +${hiddenCount}`}
                </Typography>{" "}
                {t(summaryKey, { count: entries.length })}
              </Typography>
              <Typography
                level="body-xs"
                textColor="muted"
                style={{ flexShrink: 0 }}
              >
                {firstAt} – {lastAt}
              </Typography>
              <Box
                style={{
                  transform: [{ rotate: expanded ? "180deg" : "0deg" }],
                }}
              >
                <CaretDownIcon size={12} color={mutedColor} />
              </Box>
            </Box>
          </MessageBase>
        </Pressable>
        {expanded &&
          entries.map((entry) => <EventRow key={entry.id} entry={entry} />)}
      </Box>
    );
  },
);

interface Props {
  entry: BridgeFeedEntry;
  header?: boolean;
}

export const BridgeMessage = observer(({ entry, header }: Props) => {
  const { t } = useTranslation("settings");

  if (entry.kind === "advancement" && entry.advancement) {
    return <AdvancementCard entry={entry} details={entry.advancement} />;
  }

  if (entry.kind !== "chat") {
    return <EventRow entry={entry} />;
  }

  return (
    <MessageBase header={header} style={{ overflow: "hidden", minWidth: 0 }}>
      <MessageRow header={header}>
        <MessageInfo>
          {header ? (
            <BridgeAvatar entry={entry} />
          ) : (
            <Box style={{ width: 40 }} />
          )}
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
              <SourceBadge source={entry.source} />
              <ShortTime at={entry.at} />
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
