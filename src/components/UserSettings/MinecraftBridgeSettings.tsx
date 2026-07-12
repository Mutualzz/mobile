import { Button } from "@components/Button";
import { MinecraftAvatar } from "@components/Minecraft/MinecraftAvatar";
import { Paper } from "@components/Paper";
import { CreateBridgeSheet } from "@components/UserSettings/CreateBridgeSheet";
import { DeleteBridgeSheet } from "@components/UserSettings/DeleteBridgeSheet";
import { UnlinkMinecraftSheet } from "@components/UserSettings/UnlinkMinecraftSheet";
import { useOpenBottomSheet } from "@hooks/useOpenBottomSheet";
import { useAppStore } from "@hooks/useStores";
import type {
  BridgeDetail,
  BridgeSummary,
  CreatedBridgeResult,
  MinecraftLink,
  PluginConfig,
} from "@app-types/bridge";
import {
  pluginConfigYaml,
  sanitizeServerId,
  isDiscordSnowflake,
  looksLikeDiscordSnowflake,
} from "@app-types/bridge";
import { Box, InputDefault, Typography } from "@mutualzz/ui-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { CheckCircleIcon, CircleIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, ScrollView } from "react-native";

type BridgeTab = "bridges" | "discord" | "voice" | "link";

const tabs: BridgeTab[] = ["bridges", "discord", "voice", "link"];

const ChecklistItem = ({ done, label }: { done: boolean; label: string }) => (
  <Box style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
    {done ? (
      <CheckCircleIcon weight="fill" size={18} />
    ) : (
      <CircleIcon size={18} />
    )}
    <Typography
      level="body-sm"
      textColor={done ? undefined : "muted"}
      weight={done ? "bold" : undefined}
    >
      {label}
    </Typography>
  </Box>
);

export const MinecraftBridgeSettings = observer(() => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const queryClient = useQueryClient();
  const { openBottomSheet, closeBottomSheet } = useOpenBottomSheet();

  const [currentTab, setCurrentTab] = useState<BridgeTab>("bridges");
  const [selectedBridgeId, setSelectedBridgeId] = useState<string | null>(null);
  const [freshConfig, setFreshConfig] = useState<PluginConfig | null>(null);
  const [copied, setCopied] = useState<"config" | "token" | "code" | null>(
    null,
  );
  const [bindServerId, setBindServerId] = useState("");
  const [guildId, setGuildId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [voiceSpaceId, setVoiceSpaceId] = useState("");
  const [voiceChannelId, setVoiceChannelId] = useState("");
  const [voiceRoomName, setVoiceRoomName] = useState("default");
  const [redeemCode, setRedeemCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const bridgesQuery = useQuery({
    queryKey: ["me", "bridges"],
    queryFn: () => app.rest.get<BridgeSummary[]>("/@me/bridges"),
    refetchInterval: currentTab === "link" ? 5_000 : false,
  });

  const detailQuery = useQuery({
    queryKey: ["me", "bridges", selectedBridgeId],
    enabled: !!selectedBridgeId,
    queryFn: () =>
      app.rest.get<BridgeDetail>(`/@me/bridges/${selectedBridgeId}`),
  });

  const linkQuery = useQuery({
    queryKey: ["me", "bridges", "link"],
    queryFn: () => app.rest.get<MinecraftLink | null>("/@me/bridges/link"),
  });

  type DiscordStatus = {
    botInviteUrl: string | null;
  };

  const discordStatusQuery = useQuery({
    queryKey: ["me", "bridges", "discord", "status"],
    queryFn: () =>
      app.rest.get<DiscordStatus>("/@me/bridges/discord/status"),
    enabled: currentTab === "discord",
  });

  const copyText = async (
    text: string,
    kind: "config" | "token" | "code",
  ) => {
    await Clipboard.setStringAsync(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleBridgeCreated = (created: CreatedBridgeResult) => {
    setError(null);
    setFreshConfig(created.pluginConfig);
    setSelectedBridgeId(created.id);
    setBindServerId(created.pluginConfig.serverId);
    setCurrentTab("bridges");
  };

  const openCreate = () => {
    if ((bridgesQuery.data?.length ?? 0) >= 5) return;
    openBottomSheet(
      "create-bridge",
      <CreateBridgeSheet
        onClose={() => closeBottomSheet("create-bridge")}
        onCreated={handleBridgeCreated}
      />,
    );
  };

  const rotateMutation = useMutation({
    mutationFn: () => {
      if (!selectedBridgeId) throw new Error("No bridge selected");
      return app.rest.post<{ token: string; pluginConfig: PluginConfig }>(
        `/@me/bridges/${selectedBridgeId}/token`,
        { serverId: bindServerId.trim() || undefined },
      );
    },
    onSuccess: (result) => {
      setError(null);
      setFreshConfig(result.pluginConfig);
      void queryClient.invalidateQueries({
        queryKey: ["me", "bridges", selectedBridgeId],
      });
    },
    onError: (err: Error) => setError(err.message),
  });

  const renameMutation = useMutation({
    mutationFn: (name: string) => {
      if (!selectedBridgeId) throw new Error("No bridge selected");
      return app.rest.patch(`/@me/bridges/${selectedBridgeId}`, { name });
    },
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["me", "bridges"] });
      void queryClient.invalidateQueries({
        queryKey: ["me", "bridges", selectedBridgeId],
      });
    },
    onError: (err: Error) => setError(err.message),
  });

  const bindMutation = useMutation({
    mutationFn: () => {
      if (!selectedBridgeId) throw new Error("No bridge selected");
      return app.rest.put(`/@me/bridges/${selectedBridgeId}/discord`, {
        serverId: bindServerId.trim(),
        guildId: guildId.trim(),
        channelId: channelId.trim(),
      });
    },
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({
        queryKey: ["me", "bridges", selectedBridgeId],
      });
    },
    onError: (err: Error) => setError(err.message),
  });

  const bindVoiceMutation = useMutation({
    mutationFn: () => {
      if (!selectedBridgeId) throw new Error("No bridge selected");
      return app.rest.put(`/@me/bridges/${selectedBridgeId}/voice`, {
        serverId: bindServerId.trim(),
        name: voiceRoomName.trim() || "default",
        spaceId: voiceSpaceId.trim(),
        channelId: voiceChannelId.trim(),
      });
    },
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({
        queryKey: ["me", "bridges", selectedBridgeId],
      });
    },
    onError: (err: Error) => setError(err.message),
  });

  const unbindDiscordMutation = useMutation({
    mutationFn: (bindingId: string) => {
      if (!selectedBridgeId) throw new Error("No bridge selected");
      return app.rest.delete(
        `/@me/bridges/${selectedBridgeId}/discord/${bindingId}`,
      );
    },
    onSuccess: () => {
      setError(null);
      setGuildId("");
      setChannelId("");
      void queryClient.invalidateQueries({
        queryKey: ["me", "bridges", selectedBridgeId],
      });
    },
    onError: (err: Error) => setError(err.message),
  });

  const openBotInvite = async () => {
    const url = discordStatusQuery.data?.botInviteUrl;
    if (!url) return;
    await Linking.openURL(url);
  };

  const unbindVoiceMutation = useMutation({
    mutationFn: (bindingId: string) => {
      if (!selectedBridgeId) throw new Error("No bridge selected");
      return app.rest.delete(
        `/@me/bridges/${selectedBridgeId}/voice/${bindingId}`,
      );
    },
    onSuccess: () => {
      setError(null);
      setVoiceSpaceId("");
      setVoiceChannelId("");
      void queryClient.invalidateQueries({
        queryKey: ["me", "bridges", selectedBridgeId],
      });
    },
    onError: (err: Error) => setError(err.message),
  });

  const generateCodeMutation = useMutation({
    mutationFn: () =>
      app.rest.post<{
        code?: string;
        alreadyLinked?: boolean;
        minecraftName?: string;
      }>("/@me/bridges/link/code", {
        bridgeId: selectedBridgeId ?? undefined,
      }),
    onSuccess: (result) => {
      setError(null);
      if (result.code) setGeneratedCode(result.code);
      void queryClient.invalidateQueries({
        queryKey: ["me", "bridges", "link"],
      });
    },
    onError: (err: Error) => setError(err.message),
  });

  const redeemMutation = useMutation({
    mutationFn: () =>
      app.rest.post("/@me/bridges/link/redeem", {
        code: redeemCode.trim(),
      }),
    onSuccess: () => {
      setError(null);
      setRedeemCode("");
      void queryClient.invalidateQueries({
        queryKey: ["me", "bridges", "link"],
      });
    },
    onError: (err: Error) => setError(err.message),
  });

  const bridges = bridgesQuery.data ?? [];
  const selectedBridge =
    bridges.find((b) => b.id === selectedBridgeId) ?? null;
  const detail =
    selectedBridge && detailQuery.data?.id === selectedBridge.id
      ? detailQuery.data
      : undefined;
  const link = linkQuery.data;

  useEffect(() => {
    if (bridges.length === 0) {
      if (selectedBridgeId !== null) setSelectedBridgeId(null);
      return;
    }
    if (!selectedBridgeId || !bridges.some((b) => b.id === selectedBridgeId)) {
      setSelectedBridgeId(bridges[0].id);
    }
  }, [bridges, selectedBridgeId]);

  useEffect(() => {
    if (!selectedBridge) {
      setBindServerId("");
      setGuildId("");
      setChannelId("");
      setFreshConfig(null);
      setGeneratedCode(null);
      setRenameValue("");
    } else {
      setRenameValue(selectedBridge.name);
    }
  }, [selectedBridge]);

  useEffect(() => {
    if (detail?.servers[0]?.serverId) {
      setBindServerId(detail.servers[0].serverId);
    }
  }, [detail?.id]);

  useEffect(() => {
    if (!detail) return;
    const binding = detail.discordBindings.find(
      (b) => b.serverId === bindServerId,
    );
    setGuildId(binding?.guildId ?? "");
    setChannelId(binding?.channelId ?? "");
  }, [bindServerId, detail?.id, detail?.discordBindings.length]);

  useEffect(() => {
    if (!detail) return;
    const binding = (detail.voiceBindings ?? []).find(
      (b) =>
        b.serverId === bindServerId &&
        b.name === (voiceRoomName.trim() || "default"),
    );
    setVoiceSpaceId(binding?.spaceId ?? "");
    setVoiceChannelId(binding?.channelId ?? "");
  }, [bindServerId, voiceRoomName, detail?.id, detail?.voiceBindings?.length]);

  useEffect(() => {
    if (link) setGeneratedCode(null);
  }, [link]);

  const atBridgeLimit = bridges.length >= 5;
  const hasPluginConfig = !!freshConfig || (detail?.tokens.length ?? 0) > 0;
  const hasDiscord = (detail?.discordBindings.length ?? 0) > 0;
  const hasVoice = (detail?.voiceBindings?.length ?? 0) > 0;
  const hasLink = !!link;
  const anyHubConnected = bridges.some((b) => b.hubConnected === true);
  const activeDiscordBinding = detail?.discordBindings.find(
    (b) => b.serverId === bindServerId,
  );
  const spaces = app.spaces.positioned;
  const selectedSpace =
    spaces.find((s) => s.id === voiceSpaceId) ??
    (voiceSpaceId ? app.spaces.get(voiceSpaceId) : undefined) ??
    null;
  const voiceChannels = selectedSpace
    ? selectedSpace.channels
        .filter((c) => c.isVoiceChannel)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    : [];
  const knownServerIds = [
    ...new Set([
      ...(detail?.servers.map((s) => s.serverId) ?? []),
      ...(detail?.discordBindings.map((b) => b.serverId) ?? []),
      ...(detail?.voiceBindings?.map((b) => b.serverId) ?? []),
      ...(bindServerId ? [bindServerId] : []),
    ]),
  ].filter(Boolean);

  const cardElevation = app.settings?.preferEmbossed ? 3 : 0;

  return (
    <ScrollView
      contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Typography level="body-sm" textColor="muted">
        {t("minecraftBridge.intro")}
      </Typography>

      <Paper
        style={{
          padding: 8,
          borderRadius: 12,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 6,
        }}
        elevation={cardElevation}
      >
        {tabs.map((tab) => (
          <Button
            key={tab}
            size="sm"
            variant={currentTab === tab ? "soft" : "plain"}
            onPress={() => setCurrentTab(tab)}
          >
            {t(`minecraftBridge.tabs.${tab}`)}
          </Button>
        ))}
      </Paper>

      {error && (
        <Typography color="danger" level="body-sm">
          {error}
        </Typography>
      )}

      {currentTab === "bridges" && (
        <Box style={{ gap: 12 }}>
          <Paper
            style={{ padding: 12, borderRadius: 12, gap: 8 }}
            elevation={cardElevation}
          >
            <Typography level="label-sm" weight="bold">
              {t("minecraftBridge.checklist.title")}
            </Typography>
            <ChecklistItem
              done={bridges.length > 0}
              label={t("minecraftBridge.checklist.bridge")}
            />
            <ChecklistItem
              done={hasPluginConfig}
              label={t("minecraftBridge.checklist.plugin")}
            />
            <ChecklistItem
              done={hasDiscord}
              label={t("minecraftBridge.checklist.discord")}
            />
            <ChecklistItem
              done={hasVoice}
              label={t("minecraftBridge.checklist.voice")}
            />
            <ChecklistItem
              done={hasLink}
              label={t("minecraftBridge.checklist.link")}
            />
          </Paper>

          <Button
            disabled={atBridgeLimit}
            onPress={openCreate}
          >
            {atBridgeLimit
              ? t("minecraftBridge.bridgeLimitReached", { limit: 5 })
              : t("minecraftBridge.create")}
          </Button>

          {bridges.length > 0 && (
            <Paper
              style={{ padding: 8, borderRadius: 12, gap: 6 }}
              elevation={cardElevation}
            >
              {bridges.map((b) => (
                <Pressable
                  key={b.id}
                  onPress={() => setSelectedBridgeId(b.id)}
                >
                  <Paper
                    variant={selectedBridgeId === b.id ? "soft" : "plain"}
                    style={{ padding: 10, borderRadius: 8 }}
                  >
                    <Typography level="body-sm" weight="bold">
                      {b.name}
                    </Typography>
                    <Typography level="body-xs" textColor="muted">
                      {b.hubConnected
                        ? t("minecraftBridge.hubConnected")
                        : t("minecraftBridge.hubDisconnected")}
                    </Typography>
                  </Paper>
                </Pressable>
              ))}
            </Paper>
          )}

          {selectedBridge && (
            <Paper
              style={{ padding: 12, borderRadius: 12, gap: 10 }}
              elevation={cardElevation}
            >
              <InputDefault
                fullWidth
                value={renameValue}
                onChangeText={setRenameValue}
                accessibilityLabel={t("minecraftBridge.name")}
              />
              <Box style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <Button
                  size="sm"
                  disabled={
                    renameMutation.isPending ||
                    !renameValue.trim() ||
                    renameValue.trim() === selectedBridge.name
                  }
                  onPress={() => renameMutation.mutate(renameValue.trim())}
                >
                  {t("minecraftBridge.rename")}
                </Button>
                <Button
                  size="sm"
                  variant="soft"
                  disabled={rotateMutation.isPending}
                  onPress={() => rotateMutation.mutate()}
                >
                  {t("minecraftBridge.rotateToken")}
                </Button>
                <Button
                  size="sm"
                  color="danger"
                  variant="soft"
                  onPress={() =>
                    openBottomSheet(
                      "delete-bridge",
                      <DeleteBridgeSheet
                        bridgeId={selectedBridge.id}
                        bridgeName={selectedBridge.name}
                        onClose={() => closeBottomSheet("delete-bridge")}
                        onDeleted={() => {
                          setSelectedBridgeId(null);
                          setFreshConfig(null);
                        }}
                      />,
                    )
                  }
                >
                  {t("minecraftBridge.delete")}
                </Button>
              </Box>

              {freshConfig && (
                <Box style={{ gap: 8 }}>
                  <Typography level="label-sm" weight="bold">
                    {t("minecraftBridge.pluginConfig")}
                  </Typography>
                  <Typography level="body-xs" textColor="muted">
                    {t("minecraftBridge.tokenOnce")}
                  </Typography>
                  <Paper
                    variant="soft"
                    style={{ padding: 10, borderRadius: 8 }}
                  >
                    <Typography
                      level="body-xs"
                      style={{ fontFamily: "monospace" }}
                    >
                      {pluginConfigYaml(freshConfig)}
                    </Typography>
                  </Paper>
                  <Button
                    size="sm"
                    onPress={() =>
                      void copyText(pluginConfigYaml(freshConfig), "config")
                    }
                  >
                    {copied === "config"
                      ? t("minecraftBridge.copied")
                      : t("minecraftBridge.copyConfig")}
                  </Button>
                </Box>
              )}

              {!freshConfig && (detail?.tokens.length ?? 0) > 0 && (
                <Typography level="body-xs" textColor="muted">
                  {t("minecraftBridge.rotateWarning")}
                </Typography>
              )}
            </Paper>
          )}
        </Box>
      )}

      {currentTab === "discord" && (
        <Box style={{ gap: 12 }}>
          {!selectedBridgeId || !detail ? (
            <Paper
              style={{ padding: 12, borderRadius: 12, gap: 10 }}
              elevation={cardElevation}
            >
              <Typography level="body-sm" textColor="muted">
                {t("minecraftBridge.selectBridgeFirst")}
              </Typography>
              <Button size="sm" onPress={() => setCurrentTab("bridges")}>
                {t("minecraftBridge.goToSetup")}
              </Button>
            </Paper>
          ) : (
            <>
              <Typography level="body-sm" textColor="muted">
                {t("minecraftBridge.discordBindHint")}
              </Typography>

              {hasDiscord ? (
                <Paper
                  style={{ padding: 12, borderRadius: 12, gap: 10 }}
                  elevation={cardElevation}
                >
                  <Typography level="label-sm" weight="bold">
                    {t("minecraftBridge.discordConnectedTitle")}
                  </Typography>
                  {detail.discordBindings.map((b) => (
                    <Box key={b.id} style={{ gap: 4 }}>
                      <Typography level="body-sm" weight="bold">
                        {b.guildName && b.channelName
                          ? t("minecraftBridge.discordConnectedNamed", {
                              server: b.serverId,
                              channel: b.channelName,
                              guild: b.guildName,
                            })
                          : t("minecraftBridge.discordConnectedFor", {
                              server: b.serverId,
                              channel: b.channelId,
                            })}
                      </Typography>
                      {(b.guildName || b.channelName) && (
                        <Typography level="body-xs" textColor="muted">
                          {b.guildId} / {b.channelId}
                        </Typography>
                      )}
                      <Typography
                        level="body-xs"
                        textColor={b.hasWebhook ? undefined : "muted"}
                        color={b.hasWebhook ? "success" : "warning"}
                      >
                        {b.hasWebhook
                          ? t("minecraftBridge.discordWebhookReady")
                          : t("minecraftBridge.discordWebhookPending")}
                      </Typography>
                      <Button
                        size="sm"
                        color="danger"
                        variant="soft"
                        disabled={unbindDiscordMutation.isPending}
                        onPress={() => unbindDiscordMutation.mutate(b.id)}
                      >
                        {t("minecraftBridge.unbind")}
                      </Button>
                    </Box>
                  ))}
                </Paper>
              ) : (
                <Typography level="body-sm" textColor="muted">
                  {t("minecraftBridge.noBindingsYet")}
                </Typography>
              )}

              <Paper
                style={{ padding: 12, borderRadius: 12, gap: 6 }}
                elevation={cardElevation}
              >
                <Typography level="label-sm" weight="bold">
                  {t("minecraftBridge.discordHowToTitle")}
                </Typography>
                <Typography level="body-xs" textColor="muted">
                  {t("minecraftBridge.discordHowToStep1")}
                </Typography>
                <Typography level="body-xs" textColor="muted">
                  {t("minecraftBridge.discordHowToStep2")}
                </Typography>
                <Typography level="body-xs" textColor="muted">
                  {t("minecraftBridge.discordHowToStep3")}
                </Typography>
                <Typography level="body-xs" textColor="muted">
                  {t("minecraftBridge.discordHowToStep4")}
                </Typography>
                <Typography level="body-xs" textColor="muted">
                  {t("minecraftBridge.discordHowToStep5")}
                </Typography>
                {!!discordStatusQuery.data?.botInviteUrl && (
                  <Button
                    size="sm"
                    variant="soft"
                    onPress={() => void openBotInvite()}
                  >
                    {t("minecraftBridge.discordInviteBot")}
                  </Button>
                )}
              </Paper>

              <Paper
                style={{ padding: 12, borderRadius: 12, gap: 10 }}
                elevation={cardElevation}
              >
                <Typography level="label-sm" weight="bold">
                  {activeDiscordBinding
                    ? t("minecraftBridge.discordFormUpdateTitle")
                    : t("minecraftBridge.discordFormTitle")}
                </Typography>
                <Typography level="body-xs" textColor="muted">
                  {activeDiscordBinding
                    ? t("minecraftBridge.discordChangeHint")
                    : t("minecraftBridge.discordFormHint")}
                </Typography>

                <Typography level="body-xs" weight="bold">
                  {t("minecraftBridge.discordServerPickerLabel")}
                </Typography>
                <InputDefault
                  fullWidth
                  placeholder={t("minecraftBridge.serverIdPlaceholder")}
                  value={bindServerId}
                  onChangeText={(v) => setBindServerId(sanitizeServerId(v))}
                  autoCapitalize="none"
                />
                {knownServerIds.length > 0 && (
                  <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    {knownServerIds.map((id) => (
                      <Button
                        key={id}
                        size="sm"
                        variant={bindServerId === id ? "soft" : "plain"}
                        onPress={() => setBindServerId(id)}
                      >
                        {id}
                      </Button>
                    ))}
                  </Box>
                )}

                <Typography level="body-xs" weight="bold">
                  {t("minecraftBridge.guildId")}
                </Typography>
                <InputDefault
                  fullWidth
                  placeholder={t("minecraftBridge.guildIdPlaceholder")}
                  value={guildId}
                  onChangeText={(v) => setGuildId(v.replace(/\s/g, ""))}
                  autoCapitalize="none"
                  keyboardType="number-pad"
                />
                <Typography level="body-xs" textColor="muted">
                  {t("minecraftBridge.guildIdHint")}
                </Typography>

                <Typography level="body-xs" weight="bold">
                  {t("minecraftBridge.channelId")}
                </Typography>
                <InputDefault
                  fullWidth
                  placeholder={t("minecraftBridge.channelIdPlaceholder")}
                  value={channelId}
                  onChangeText={(v) => setChannelId(v.replace(/\s/g, ""))}
                  autoCapitalize="none"
                  keyboardType="number-pad"
                />
                <Typography level="body-xs" textColor="muted">
                  {t("minecraftBridge.channelIdHint")}
                </Typography>

                <Button
                  disabled={
                    bindMutation.isPending ||
                    !bindServerId.trim() ||
                    !guildId.trim() ||
                    !channelId.trim()
                  }
                  onPress={() => {
                    if (looksLikeDiscordSnowflake(bindServerId)) {
                      setError(
                        t("minecraftBridge.discordInvalidMinecraftServer"),
                      );
                      return;
                    }
                    if (
                      !isDiscordSnowflake(guildId) ||
                      !isDiscordSnowflake(channelId)
                    ) {
                      setError(t("minecraftBridge.discordInvalidId"));
                      return;
                    }
                    setError(null);
                    bindMutation.mutate();
                  }}
                >
                  {bindMutation.isPending
                    ? t("minecraftBridge.saving")
                    : activeDiscordBinding
                      ? t("minecraftBridge.updateBinding")
                      : t("minecraftBridge.saveBinding")}
                </Button>
              </Paper>


            </>
          )}
        </Box>
      )}

      {currentTab === "voice" && (
        <Paper
          style={{ padding: 12, borderRadius: 12, gap: 10 }}
          elevation={cardElevation}
        >
          {!selectedBridgeId ? (
            <Typography level="body-sm" textColor="muted">
              {t("minecraftBridge.selectBridgeFirst")}
            </Typography>
          ) : (
            <>
              <Typography level="body-sm" textColor="muted">
                {t("minecraftBridge.voiceBindHint")}
              </Typography>
              <InputDefault
                fullWidth
                placeholder={t("minecraftBridge.serverId")}
                value={bindServerId}
                onChangeText={(v) => setBindServerId(sanitizeServerId(v))}
                autoCapitalize="none"
              />
              <InputDefault
                fullWidth
                placeholder={t("minecraftBridge.voiceRoomName")}
                value={voiceRoomName}
                onChangeText={(v) =>
                  setVoiceRoomName(sanitizeServerId(v) || "default")
                }
                autoCapitalize="none"
              />
              <Typography level="label-xs" textColor="muted">
                {t("minecraftBridge.voiceSpace")}
              </Typography>
              <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {spaces.map((space) => (
                  <Button
                    key={space.id}
                    size="sm"
                    variant={voiceSpaceId === space.id ? "soft" : "plain"}
                    onPress={() => {
                      setVoiceSpaceId(space.id);
                      setVoiceChannelId("");
                    }}
                  >
                    {space.name}
                  </Button>
                ))}
              </Box>
              {selectedSpace && (
                <>
                  <Typography level="label-xs" textColor="muted">
                    {t("minecraftBridge.voiceChannel")}
                  </Typography>
                  <Box
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}
                  >
                    {voiceChannels.length === 0 ? (
                      <Typography level="body-xs" textColor="muted">
                        {t("minecraftBridge.voiceNoChannels")}
                      </Typography>
                    ) : (
                      voiceChannels.map((ch) => (
                        <Button
                          key={ch.id}
                          size="sm"
                          variant={
                            voiceChannelId === ch.id ? "soft" : "plain"
                          }
                          onPress={() => setVoiceChannelId(ch.id)}
                        >
                          {ch.name}
                        </Button>
                      ))
                    )}
                  </Box>
                </>
              )}
              <Button
                disabled={
                  bindVoiceMutation.isPending ||
                  !bindServerId.trim() ||
                  !voiceSpaceId.trim() ||
                  !voiceChannelId.trim()
                }
                onPress={() => bindVoiceMutation.mutate()}
              >
                {t("minecraftBridge.saveBinding")}
              </Button>
              {(detail?.voiceBindings ?? [])
                .filter((b) => b.serverId === bindServerId)
                .map((b) => (
                  <Button
                    key={b.id}
                    size="sm"
                    color="danger"
                    variant="soft"
                    disabled={unbindVoiceMutation.isPending}
                    onPress={() => unbindVoiceMutation.mutate(b.id)}
                  >
                    {t("minecraftBridge.unbind")} ({b.name})
                  </Button>
                ))}
            </>
          )}
        </Paper>
      )}

      {currentTab === "link" && (
        <Paper
          style={{ padding: 12, borderRadius: 12, gap: 10 }}
          elevation={cardElevation}
        >
          {link ? (
            <>
              <Box
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <MinecraftAvatar
                  uuid={link.minecraftUuid}
                  name={link.minecraftName}
                  size="lg"
                />
                <Box style={{ flex: 1, gap: 2 }}>
                  <Typography level="body-md" weight="bold">
                    {link.minecraftName}
                  </Typography>
                  <Typography level="body-xs" textColor="muted">
                    {link.minecraftUuid}
                  </Typography>
                </Box>
              </Box>
              <Button
                color="danger"
                variant="soft"
                onPress={() =>
                  openBottomSheet(
                    "unlink-minecraft",
                    <UnlinkMinecraftSheet
                      minecraftName={link.minecraftName}
                      minecraftUuid={link.minecraftUuid}
                      onClose={() => closeBottomSheet("unlink-minecraft")}
                    />,
                  )
                }
              >
                {t("minecraftBridge.unlink")}
              </Button>
            </>
          ) : (
            <>
              <Typography level="body-sm" textColor="muted">
                {t("minecraftBridge.linkHint")}
              </Typography>
              {!anyHubConnected && (
                <Typography level="body-xs" color="warning">
                  {t("minecraftBridge.linkRequiresHub")}
                </Typography>
              )}
              <Button
                disabled={generateCodeMutation.isPending || !anyHubConnected}
                onPress={() => generateCodeMutation.mutate()}
              >
                {t("minecraftBridge.generateCode")}
              </Button>
              {generatedCode && (
                <Box style={{ gap: 8 }}>
                  <Typography level="title-md" weight="bold">
                    {t("minecraftBridge.codeCommand", { code: generatedCode })}
                  </Typography>
                  <Button
                    size="sm"
                    onPress={() =>
                      void copyText(`/mzlink ${generatedCode}`, "code")
                    }
                  >
                    {copied === "code"
                      ? t("minecraftBridge.copied")
                      : t("minecraftBridge.copyToken")}
                  </Button>
                </Box>
              )}
              <Typography level="label-xs" textColor="muted">
                {t("minecraftBridge.redeemTitle")}
              </Typography>
              <InputDefault
                fullWidth
                placeholder={t("minecraftBridge.redeemPlaceholder")}
                value={redeemCode}
                onChangeText={setRedeemCode}
                autoCapitalize="characters"
              />
              <Button
                disabled={redeemMutation.isPending || !redeemCode.trim()}
                onPress={() => redeemMutation.mutate()}
              >
                {t("minecraftBridge.redeem")}
              </Button>
            </>
          )}
        </Paper>
      )}
    </ScrollView>
  );
});
