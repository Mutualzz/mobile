export type BridgeSummary = {
  id: string;
  name: string;
  status: number;
  createdAt?: string;
  hubConnected?: boolean;
  onlineCount?: number;
  unread?: boolean;
  lastMessageId?: string | null;
  lastAckedId?: string | null;
};

export type PluginConfig = {
  hubUrl: string;
  token: string;
  serverId: string;
};

export type BridgeDetail = BridgeSummary & {
  hubConnected: boolean;
  connectedServers: string[];
  servers: {
    id: string;
    serverId: string;
    displayName: string;
    lastSeenAt?: string | null;
  }[];
  discordBindings: {
    id: string;
    serverId: string;
    guildId: string;
    channelId: string;
    guildName?: string | null;
    channelName?: string | null;
    hasWebhook: boolean;
  }[];
  voiceBindings: {
    id: string;
    serverId: string;
    name: string;
    spaceId: string;
    channelId: string;
  }[];
  tokens: {
    id: string;
    name: string;
    tokenPrefix: string;
    lastUsedAt: string | null;
    createdAt: string;
  }[];
  onlinePlayers?: {
    uuid: string;
    name: string;
    serverId: string;
    linkedUser?: {
      id: string;
      username: string;
      globalName?: string | null;
      avatar?: string | null;
    } | null;
  }[];
};

export type MinecraftLink = {
  minecraftUuid: string;
  minecraftName: string;
  discordId: string | null;
  createdAt: string;
};

export type CreatedBridgeResult = {
  id: string;
  name: string;
  pluginConfig: PluginConfig;
};

export const sanitizeServerId = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9_-]/g, "");

export const isDiscordSnowflake = (value: string) =>
  /^\d{17,20}$/.test(value.trim());

export const looksLikeDiscordSnowflake = (value: string) =>
  /^\d{16,22}$/.test(value.trim());

export const pluginConfigYaml = (config: PluginConfig) =>
  `hubUrl: ${config.hubUrl}\ntoken: ${config.token}\nserverId: ${config.serverId}\n`;
