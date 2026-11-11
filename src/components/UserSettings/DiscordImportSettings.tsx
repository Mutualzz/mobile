import { Button } from "@components/Button";
import {
  SettingsScroll,
  SettingsSection,
} from "@components/UserSettings/SettingsField";
import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import type {
  DiscordImportProgressPayload,
  DiscordImportStage,
  HttpException,
} from "@mutualzz/types";
import { ChannelType } from "@mutualzz/types";
import {
  Box,
  CircularProgress,
  InputDefault,
  LinearProgress,
  Typography,
  useTheme,
} from "@mutualzz/ui-native";
import type { DiscordImportResult } from "@stores/Gateway.store";
import { Invite } from "@stores/objects/Invite";
import { useMutation } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { observer } from "mobx-react-lite";
import {
  CaretDownIcon,
  CaretRightIcon,
  CheckCircleIcon,
  CheckSquareIcon,
  CircleIcon,
  HashIcon,
  LockSimpleIcon,
  MinusSquareIcon,
  SpeakerHighIcon,
  SquareIcon,
  WarningCircleIcon,
} from "phosphor-react-native";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, Pressable } from "react-native";

interface PreviewChannel {
  id: string;
  name: string;
  type: number | null;
  topic: string | null;
  nsfw: boolean;
  isPrivate: boolean;
  parentId: string | null;
}

interface PreviewImage {
  id: string;
  name: string;
  url: string;
}

interface ImportPreview {
  guild: { name: string; iconUrl: string | null; description: string | null };
  channels: PreviewChannel[];
  roles: { id: string; name: string; color: string | null }[];
  emojis: PreviewImage[];
  stickers: PreviewImage[];
  maxExpressions: number;
  skippedChannelCount: number;
  skippedStickerCount: number;
}

interface ImportSelectionState {
  channels: Set<string>;
  roles: Set<string>;
  emojis: Set<string>;
  stickers: Set<string>;
}

type SelectionKey = keyof ImportSelectionState;

type ImportProgressState = Record<
  DiscordImportStage,
  { completed: number; total: number } | undefined
>;

const IMPORT_STAGES: { stage: DiscordImportStage; weight: number }[] = [
  { stage: "fetching", weight: 5 },
  { stage: "emojis", weight: 35 },
  { stage: "space", weight: 5 },
  { stage: "roles", weight: 15 },
  { stage: "channels", weight: 30 },
  { stage: "finishing", weight: 10 },
];

const EMPTY_PROGRESS: ImportProgressState = {
  fetching: undefined,
  emojis: undefined,
  space: undefined,
  roles: undefined,
  channels: undefined,
  finishing: undefined,
};

const selectEverything = (preview: ImportPreview): ImportSelectionState => ({
  channels: new Set(preview.channels.map((channel) => channel.id)),
  roles: new Set(preview.roles.map((role) => role.id)),
  emojis: new Set(preview.emojis.map((emoji) => emoji.id)),
  stickers: new Set(preview.stickers.map((sticker) => sticker.id)),
});

const isStageDone = (stageProgress?: { completed: number; total: number }) =>
  Boolean(stageProgress && stageProgress.completed >= stageProgress.total);

const overallPercent = (progress: ImportProgressState) => {
  const totalWeight = IMPORT_STAGES.reduce(
    (sum, { weight }) => sum + weight,
    0,
  );
  const earnedWeight = IMPORT_STAGES.reduce((sum, { stage, weight }) => {
    const stageProgress = progress[stage];
    if (!stageProgress) return sum;
    if (stageProgress.total === 0) return sum + weight;
    return sum + (weight * stageProgress.completed) / stageProgress.total;
  }, 0);
  return Math.min(100, Math.round((earnedWeight / totalWeight) * 100));
};

function StepHeader({
  step,
  title,
  description,
  done,
}: {
  step: number;
  title: string;
  description?: string;
  done?: boolean;
}) {
  const { theme } = useTheme();

  return (
    <Box style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      {done ? (
        <CheckCircleIcon size={26} weight="fill" color={theme.colors.success} />
      ) : (
        <Box
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            borderWidth: 2,
            borderColor: theme.typography.colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography level="body-xs" weight={700}>
            {step}
          </Typography>
        </Box>
      )}
      <Box style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Typography level="body-sm" weight={700}>
          {title}
        </Typography>
        {description ? (
          <Typography level="body-xs" textColor="muted">
            {description}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}

function SelectionHeader({
  title,
  selected,
  total,
  onSelectAll,
  onSelectNone,
}: {
  title: string;
  selected: number;
  total: number;
  onSelectAll: () => void;
  onSelectNone: () => void;
}) {
  const { t } = useTranslation("settings");

  return (
    <Box style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Typography level="body-sm" weight={700} style={{ flex: 1 }}>
        {title}
      </Typography>
      <Typography level="body-xs" textColor="muted">
        {t("discordImport.selectedCount", { selected, total })}
      </Typography>
      <Button
        variant="plain"
        size="sm"
        onPress={selected === total ? onSelectNone : onSelectAll}
      >
        {selected === total
          ? t("discordImport.selectNone")
          : t("discordImport.selectAll")}
      </Button>
    </Box>
  );
}

function SelectionCheckbox({
  checked,
  partial,
}: {
  checked: boolean;
  partial?: boolean;
}) {
  const { theme } = useTheme();
  if (partial)
    return (
      <MinusSquareIcon size={22} weight="fill" color={theme.colors.primary} />
    );
  if (checked)
    return (
      <CheckSquareIcon size={22} weight="fill" color={theme.colors.primary} />
    );
  return <SquareIcon size={22} color={theme.typography.colors.muted} />;
}

function Badge({ icon, label }: { icon?: ReactNode; label: string }) {
  const { theme } = useTheme();

  return (
    <Box
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: `${theme.typography.colors.muted}55`,
      }}
    >
      {icon}
      <Typography level="body-xs" textColor="muted">
        {label}
      </Typography>
    </Box>
  );
}

function ChannelSelectionList({
  channels,
  selected,
  onToggle,
}: {
  channels: PreviewChannel[];
  selected: Set<string>;
  onToggle: (channel: PreviewChannel) => void;
}) {
  const { t } = useTranslation("settings");
  const { theme } = useTheme();
  const iconColor = theme.typography.colors.muted;
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(
    () => new Set(),
  );

  const childIdsByCategory = useMemo(() => {
    const childIdsMap = new Map<string, string[]>();
    for (const channel of channels) {
      if (!channel.parentId) continue;
      const siblingIds = childIdsMap.get(channel.parentId) ?? [];
      siblingIds.push(channel.id);
      childIdsMap.set(channel.parentId, siblingIds);
    }
    return childIdsMap;
  }, [channels]);

  const toggleExpanded = (categoryId: string) =>
    setExpandedCategoryIds((previous) => {
      const next = new Set(previous);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });

  const visibleChannels = channels.filter(
    (channel) => !channel.parentId || expandedCategoryIds.has(channel.parentId),
  );

  const renderBadges = (channel: PreviewChannel) => (
    <>
      {channel.isPrivate ? (
        <Badge
          icon={<LockSimpleIcon size={10} color={iconColor} />}
          label={t("discordImport.private")}
        />
      ) : null}
      {channel.nsfw ? <Badge label={t("discordImport.nsfw")} /> : null}
    </>
  );

  return (
    <Box style={{ gap: 2 }}>
      {visibleChannels.map((channel) => {
        const isChecked = selected.has(channel.id);

        if (channel.type === ChannelType.Category) {
          const childIds = childIdsByCategory.get(channel.id) ?? [];
          const selectedChildCount = childIds.filter((childId) =>
            selected.has(childId),
          ).length;
          const isPartial =
            selectedChildCount > 0 && selectedChildCount < childIds.length;
          const isExpanded = expandedCategoryIds.has(channel.id);
          const CaretIcon = isExpanded ? CaretDownIcon : CaretRightIcon;

          return (
            <Box
              key={channel.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 6,
                opacity: isChecked || isPartial ? 1 : 0.5,
              }}
            >
              <Pressable
                onPress={() => onToggle(channel)}
                hitSlop={8}
                style={{ paddingVertical: 6, paddingRight: 8 }}
              >
                <SelectionCheckbox checked={isChecked} partial={isPartial} />
              </Pressable>
              <Pressable
                onPress={() => toggleExpanded(channel.id)}
                disabled={childIds.length === 0}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingVertical: 6,
                }}
              >
                <Typography
                  level="body-xs"
                  weight={700}
                  textColor="muted"
                  style={{ flexShrink: 1, textTransform: "uppercase" }}
                  numberOfLines={1}
                >
                  {channel.name}
                </Typography>
                {renderBadges(channel)}
                <Box style={{ flex: 1 }} />
                {childIds.length ? (
                  <>
                    <Typography level="body-xs" textColor="muted">
                      {t("discordImport.selectedCount", {
                        selected: selectedChildCount,
                        total: childIds.length,
                      })}
                    </Typography>
                    <CaretIcon size={14} color={iconColor} />
                  </>
                ) : null}
              </Pressable>
            </Box>
          );
        }

        return (
          <Pressable
            key={channel.id}
            onPress={() => onToggle(channel)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingVertical: 6,
              paddingLeft: channel.parentId ? 24 : 0,
              opacity: isChecked ? 1 : 0.5,
            }}
          >
            <SelectionCheckbox checked={isChecked} />
            {channel.type === ChannelType.Voice ? (
              <SpeakerHighIcon size={16} color={iconColor} />
            ) : (
              <HashIcon size={16} color={iconColor} />
            )}
            <Typography
              level="body-sm"
              style={{ flexShrink: 1 }}
              numberOfLines={1}
            >
              {channel.name}
            </Typography>
            {renderBadges(channel)}
          </Pressable>
        );
      })}
    </Box>
  );
}

function ImageSelectionGrid({
  images,
  selected,
  onToggle,
  imageSize,
}: {
  images: PreviewImage[];
  selected: Set<string>;
  onToggle: (imageId: string) => void;
  imageSize: number;
}) {
  return (
    <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      {images.map((image) => (
        <Pressable
          key={image.id}
          onPress={() => onToggle(image.id)}
          accessibilityLabel={image.name}
          style={{
            padding: 4,
            borderRadius: 8,
            opacity: selected.has(image.id) ? 1 : 0.25,
          }}
        >
          <Image
            source={{ uri: image.url }}
            style={{ width: imageSize, height: imageSize }}
            contentFit="contain"
          />
        </Pressable>
      ))}
    </Box>
  );
}

function ImportProgressPanel({ progress }: { progress: ImportProgressState }) {
  const { t } = useTranslation("settings");
  const { theme } = useTheme();
  const percent = overallPercent(progress);
  const activeStage = IMPORT_STAGES.find(
    ({ stage }) => !isStageDone(progress[stage]),
  )?.stage;

  return (
    <Box style={{ gap: 12 }}>
      <Box style={{ gap: 6 }}>
        <Box style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Typography level="body-sm" weight={700}>
            {activeStage
              ? t(`discordImport.stages.${activeStage}`)
              : t("discordImport.stages.done")}
          </Typography>
          <Typography level="body-sm" textColor="muted">
            {percent}%
          </Typography>
        </Box>
        <LinearProgress
          determinate
          value={percent}
          length="100%"
          thickness="sm"
        />
      </Box>

      <Box style={{ gap: 8 }}>
        {IMPORT_STAGES.map(({ stage }) => {
          const stageProgress = progress[stage];
          const done = isStageDone(stageProgress);
          const active = stage === activeStage;

          return (
            <Box
              key={stage}
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              {done ? (
                <CheckCircleIcon
                  size={18}
                  weight="fill"
                  color={theme.colors.success}
                />
              ) : active ? (
                <CircularProgress size={18} />
              ) : (
                <CircleIcon
                  size={18}
                  color={`${theme.typography.colors.muted}66`}
                />
              )}
              <Typography
                level="body-sm"
                textColor={done || active ? undefined : "muted"}
                style={{ flex: 1 }}
              >
                {t(`discordImport.stages.${stage}`)}
              </Typography>
              {stageProgress && stageProgress.total > 1 ? (
                <Typography level="body-xs" textColor="muted">
                  {stageProgress.completed}/{stageProgress.total}
                </Typography>
              ) : null}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export const DiscordImportSettings = observer(() => {
  const app = useAppStore();
  const account = app.account;
  const { theme } = useTheme();
  const { navigate } = useAppNavigation();
  const { t } = useTranslation("settings");
  const [guildId, setGuildId] = useState("");
  const [spaceName, setSpaceName] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [selection, setSelection] = useState<ImportSelectionState | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<DiscordImportResult | null>(
    null,
  );
  const [progress, setProgress] = useState<ImportProgressState>(EMPTY_PROGRESS);
  const [inviteCopied, setInviteCopied] = useState(false);

  const { mutate: startDiscordAuthorization, isPending: authorizing } =
    useMutation({
      mutationFn: async () => {
        setPreviewError(null);
        const { url } = await app.rest.get<{ url: string }>(
          "/@me/discord/import?client=mobile",
        );
        await Linking.openURL(url);
      },
      onError: (error: HttpException) => setPreviewError(error.message),
    });

  const { mutate: loadPreview, isPending: previewing } = useMutation({
    mutationFn: (targetGuildId: string) =>
      app.rest.post<ImportPreview>("/@me/discord-import/preview", {
        guildId: targetGuildId,
      }),
    onSuccess: (data) => {
      setPreview(data);
      setSelection(selectEverything(data));
      setPreviewError(null);
      setImportError(null);
      setImportResult(null);
      if (!spaceName.trim()) setSpaceName(data.guild.name.slice(0, 100));
    },
    onError: (error: HttpException) => {
      setPreview(null);
      setSelection(null);
      setPreviewError(error.message);
    },
  });

  const { guild: returnedGuildId } = useLocalSearchParams<{ guild?: string }>();
  const handledGuildId = useRef<string | null>(null);

  useEffect(() => {
    if (!returnedGuildId || handledGuildId.current === returnedGuildId) return;
    handledGuildId.current = returnedGuildId;
    setGuildId(returnedGuildId);
    setSpaceName("");
    setImportResult(null);
    loadPreview(returnedGuildId);
  }, [returnedGuildId, loadPreview]);

  const { mutate: runImport, isPending: importing } = useMutation({
    mutationFn: async () => {
      if (!selection) throw new Error(t("discordImport.failed"));
      setProgress(EMPTY_PROGRESS);
      const ack = await app.gateway.importDiscordServer(
        guildId.trim(),
        spaceName.trim(),
        {
          channelIds: [...selection.channels],
          roleIds: [...selection.roles],
          emojiIds: [...selection.emojis],
          stickerIds: [...selection.stickers],
        },
        (update: DiscordImportProgressPayload) =>
          setProgress((previous) => ({
            ...previous,
            [update.stage]: {
              completed: update.completed,
              total: update.total,
            },
          })),
      );
      if (!ack.ok) throw new Error(ack.message ?? t("discordImport.failed"));
      return ack;
    },
    onSuccess: (result) => {
      setImportResult(result);
      setImportError(null);
    },
    onError: (error: Error) => setImportError(error.message),
  });

  const resetImport = () => {
    setPreview(null);
    setSelection(null);
    setPreviewError(null);
    setImportError(null);
    setImportResult(null);
    setProgress(EMPTY_PROGRESS);
  };

  const setSelectedIds = (key: SelectionKey, ids: Iterable<string>) =>
    setSelection((previous) =>
      previous ? { ...previous, [key]: new Set(ids) } : previous,
    );

  const toggleIds = (key: SelectionKey, ids: string[], include: boolean) =>
    setSelection((previous) => {
      if (!previous) return previous;
      const next = new Set(previous[key]);
      for (const id of ids) {
        if (include) next.add(id);
        else next.delete(id);
      }
      return { ...previous, [key]: next };
    });

  const toggleId = (key: SelectionKey, id: string) =>
    toggleIds(key, [id], !selection?.[key].has(id));

  const toggleChannel = (channel: PreviewChannel) => {
    if (!preview) return;
    const include = !selection?.channels.has(channel.id);
    const childIds =
      channel.type === ChannelType.Category
        ? preview.channels
            .filter((child) => child.parentId === channel.id)
            .map((child) => child.id)
        : [];
    toggleIds("channels", [channel.id, ...childIds], include);
  };

  const copyInviteLink = async () => {
    if (!importResult) return;
    await Clipboard.setStringAsync(
      Invite.constructUrl(importResult.inviteCode),
    );
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const importedSpace = importResult
    ? app.spaces.get(importResult.space.id)
    : undefined;

  const openImportedSpace = () => {
    if (!importedSpace) return;
    app.spaces.setActive(importedSpace.id);
    navigate(`/spaces/${importedSpace.id}`);
  };

  const selectedChannelCount =
    preview && selection
      ? preview.channels.filter(
          (channel) =>
            channel.type !== ChannelType.Category &&
            selection.channels.has(channel.id),
        ).length
      : 0;
  const totalChannelCount =
    preview?.channels.filter((channel) => channel.type !== ChannelType.Category)
      .length ?? 0;
  const selectedExpressionCount =
    (selection?.emojis.size ?? 0) + (selection?.stickers.size ?? 0);
  const maxExpressions = preview?.maxExpressions ?? 100;
  const isOverExpressionLimit = selectedExpressionCount > maxExpressions;
  const hasAnythingSelected =
    selection !== null &&
    (selection.channels.size > 0 ||
      selection.roles.size > 0 ||
      selectedExpressionCount > 0);
  const isSelectionLocked = importing || Boolean(importResult);
  const canImport =
    Boolean(preview) &&
    Boolean(spaceName.trim()) &&
    hasAnythingSelected &&
    !isOverExpressionLimit &&
    !importing;
  const showProgress =
    importing || Boolean(importResult) || Boolean(importError);

  if (!account) return null;

  return (
    <SettingsScreen title={t("pages.discordImport")}>
      <SettingsScroll>
        <Typography textColor="muted" level="body-sm">
          {t("discordImport.intro")}
        </Typography>

        <SettingsSection>
          <StepHeader
            step={1}
            title={t("discordImport.chooseServer")}
            description={t("discordImport.authorizeHint")}
            done={Boolean(preview)}
          />
          <Button
            variant={preview ? "outlined" : "solid"}
            disabled={importing || previewing}
            loading={authorizing || previewing}
            onPress={() => startDiscordAuthorization()}
          >
            {preview
              ? t("discordImport.chooseDifferentServer")
              : t("discordImport.importFromDiscord")}
          </Button>

          {previewError ? (
            <Box
              style={{
                flexDirection: "row",
                gap: 8,
                padding: 12,
                borderRadius: 10,
                backgroundColor: `${theme.colors.danger}22`,
              }}
            >
              <WarningCircleIcon
                size={20}
                weight="fill"
                color={theme.colors.danger}
              />
              <Box style={{ flex: 1, gap: 2 }}>
                <Typography level="body-sm">{previewError}</Typography>
                <Typography level="body-xs" textColor="muted">
                  {t("discordImport.previewErrorHint")}
                </Typography>
              </Box>
            </Box>
          ) : null}
        </SettingsSection>

        {preview && selection ? (
          <Box
            pointerEvents={isSelectionLocked ? "none" : "auto"}
            style={{ gap: 16, opacity: isSelectionLocked ? 0.6 : 1 }}
          >
            <SettingsSection>
              <Box
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                {preview.guild.iconUrl ? (
                  <Image
                    source={{ uri: preview.guild.iconUrl }}
                    style={{ width: 48, height: 48, borderRadius: 16 }}
                  />
                ) : (
                  <Box
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: `${theme.colors.primary}33`,
                    }}
                  >
                    <Typography level="body-md" weight={700}>
                      {preview.guild.name.charAt(0).toUpperCase()}
                    </Typography>
                  </Box>
                )}
                <Box style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Typography level="body-md" weight={700}>
                    {preview.guild.name}
                  </Typography>
                  {preview.guild.description ? (
                    <Typography
                      level="body-xs"
                      textColor="muted"
                      numberOfLines={2}
                    >
                      {preview.guild.description}
                    </Typography>
                  ) : null}
                </Box>
              </Box>
              <Typography level="body-xs" textColor="muted">
                {t("discordImport.tapToToggle")}
              </Typography>
              <Typography level="body-xs" textColor="muted">
                {t("discordImport.permissionsNote")}
              </Typography>
              {preview.skippedChannelCount > 0 ? (
                <Typography level="body-xs" textColor="muted">
                  {t("discordImport.skippedChannels", {
                    count: preview.skippedChannelCount,
                  })}
                </Typography>
              ) : null}
              {preview.skippedStickerCount > 0 ? (
                <Typography level="body-xs" textColor="muted">
                  {t("discordImport.skippedStickers", {
                    count: preview.skippedStickerCount,
                  })}
                </Typography>
              ) : null}
            </SettingsSection>

            <SettingsSection>
              <SelectionHeader
                title={t("discordImport.channels")}
                selected={selectedChannelCount}
                total={totalChannelCount}
                onSelectAll={() =>
                  setSelectedIds(
                    "channels",
                    preview.channels.map((channel) => channel.id),
                  )
                }
                onSelectNone={() => setSelectedIds("channels", [])}
              />
              <ChannelSelectionList
                channels={preview.channels}
                selected={selection.channels}
                onToggle={toggleChannel}
              />
            </SettingsSection>

            {preview.roles.length ? (
              <SettingsSection>
                <SelectionHeader
                  title={t("discordImport.roles")}
                  selected={selection.roles.size}
                  total={preview.roles.length}
                  onSelectAll={() =>
                    setSelectedIds(
                      "roles",
                      preview.roles.map((role) => role.id),
                    )
                  }
                  onSelectNone={() => setSelectedIds("roles", [])}
                />
                <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {preview.roles.map((role) => {
                    const isChecked = selection.roles.has(role.id);
                    return (
                      <Pressable
                        key={role.id}
                        onPress={() => toggleId("roles", role.id)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: `${theme.typography.colors.muted}55`,
                          opacity: isChecked ? 1 : 0.4,
                        }}
                      >
                        <Box
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: role.color ?? "#99aab5",
                          }}
                        />
                        <Typography
                          level="body-xs"
                          style={{
                            textDecorationLine: isChecked
                              ? "none"
                              : "line-through",
                          }}
                        >
                          {role.name}
                        </Typography>
                      </Pressable>
                    );
                  })}
                </Box>
              </SettingsSection>
            ) : null}

            {preview.emojis.length ? (
              <SettingsSection>
                <SelectionHeader
                  title={t("discordImport.emojis")}
                  selected={selection.emojis.size}
                  total={preview.emojis.length}
                  onSelectAll={() =>
                    setSelectedIds(
                      "emojis",
                      preview.emojis.map((emoji) => emoji.id),
                    )
                  }
                  onSelectNone={() => setSelectedIds("emojis", [])}
                />
                <ImageSelectionGrid
                  images={preview.emojis}
                  selected={selection.emojis}
                  onToggle={(emojiId) => toggleId("emojis", emojiId)}
                  imageSize={32}
                />
              </SettingsSection>
            ) : null}

            {preview.stickers.length ? (
              <SettingsSection>
                <SelectionHeader
                  title={t("discordImport.stickers")}
                  selected={selection.stickers.size}
                  total={preview.stickers.length}
                  onSelectAll={() =>
                    setSelectedIds(
                      "stickers",
                      preview.stickers.map((sticker) => sticker.id),
                    )
                  }
                  onSelectNone={() => setSelectedIds("stickers", [])}
                />
                <ImageSelectionGrid
                  images={preview.stickers}
                  selected={selection.stickers}
                  onToggle={(stickerId) => toggleId("stickers", stickerId)}
                  imageSize={64}
                />
              </SettingsSection>
            ) : null}

            <Typography
              level="body-xs"
              textColor={isOverExpressionLimit ? undefined : "muted"}
              color={isOverExpressionLimit ? "danger" : undefined}
            >
              {isOverExpressionLimit
                ? t("discordImport.expressionLimit", {
                    max: maxExpressions,
                    over: selectedExpressionCount - maxExpressions,
                  })
                : t("discordImport.expressionCount", {
                    selected: selectedExpressionCount,
                    max: maxExpressions,
                  })}
            </Typography>
          </Box>
        ) : null}

        {preview ? (
          <SettingsSection>
            <StepHeader
              step={2}
              title={t("discordImport.importStep")}
              description={t("discordImport.importStepHint")}
              done={Boolean(importResult)}
            />

            {!importResult ? (
              <>
                <Box style={{ gap: 4 }}>
                  <Typography level="body-sm" weight={600}>
                    {t("discordImport.spaceName")}
                  </Typography>
                  <InputDefault
                    placeholder={t("discordImport.spaceNamePlaceholder")}
                    value={spaceName}
                    editable={!importing}
                    maxLength={100}
                    onChangeText={(text) => {
                      setSpaceName(text);
                      setImportError(null);
                    }}
                    fullWidth
                  />
                </Box>
                <Typography level="body-xs" textColor="muted">
                  {hasAnythingSelected
                    ? t("discordImport.importSummary", {
                        channels: selectedChannelCount,
                        roles: selection?.roles.size ?? 0,
                        expressions: selectedExpressionCount,
                      })
                    : t("discordImport.nothingSelected")}
                </Typography>
                <Button
                  disabled={!canImport}
                  loading={importing}
                  onPress={() => runImport()}
                >
                  {importError
                    ? t("discordImport.retry")
                    : t("discordImport.import")}
                </Button>
              </>
            ) : null}

            {showProgress ? <ImportProgressPanel progress={progress} /> : null}

            {importError ? (
              <Box
                style={{
                  flexDirection: "row",
                  gap: 8,
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: `${theme.colors.danger}22`,
                }}
              >
                <WarningCircleIcon
                  size={20}
                  weight="fill"
                  color={theme.colors.danger}
                />
                <Typography level="body-sm" style={{ flex: 1 }}>
                  {importError}
                </Typography>
              </Box>
            ) : null}

            {importResult ? (
              <Box
                style={{
                  gap: 10,
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: `${theme.colors.success}22`,
                }}
              >
                <Box
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <CheckCircleIcon
                    size={22}
                    weight="fill"
                    color={theme.colors.success}
                  />
                  <Box style={{ flex: 1, gap: 2 }}>
                    <Typography level="body-sm" weight={700}>
                      {t("discordImport.successTitle", {
                        name: importResult.space.name,
                      })}
                    </Typography>
                    <Typography level="body-xs">
                      {t("discordImport.inviteReady", {
                        code: importResult.inviteCode,
                      })}
                    </Typography>
                    {importResult.skippedExpressionCount > 0 ? (
                      <Typography level="body-xs" textColor="muted">
                        {t("discordImport.expressionsSkipped", {
                          count: importResult.skippedExpressionCount,
                        })}
                      </Typography>
                    ) : null}
                  </Box>
                </Box>
                <Button
                  disabled={!importedSpace}
                  loading={!importedSpace}
                  onPress={openImportedSpace}
                >
                  {t("discordImport.openSpace")}
                </Button>
                <Button
                  variant="outlined"
                  onPress={() => void copyInviteLink()}
                >
                  {inviteCopied
                    ? t("discordImport.copied")
                    : t("discordImport.copyInvite")}
                </Button>
                <Button
                  variant="plain"
                  onPress={() => {
                    setGuildId("");
                    setSpaceName("");
                    resetImport();
                  }}
                >
                  {t("discordImport.importAnother")}
                </Button>
              </Box>
            ) : null}
          </SettingsSection>
        ) : null}
      </SettingsScroll>
    </SettingsScreen>
  );
});

export default DiscordImportSettings;
