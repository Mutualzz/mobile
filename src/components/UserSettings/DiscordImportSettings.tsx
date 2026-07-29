import { Button } from "@components/Button";
import {
  SettingsActionRow,
  SettingsScroll,
  SettingsSection,
} from "@components/UserSettings/SettingsField";
import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { useAppStore } from "@hooks/useStores";
import type { HttpException } from "@mutualzz/types";
import { Box, InputDefault, Typography } from "@mutualzz/ui-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";

interface ImportPreview {
  channels: { name: string; type: number | null }[];
  roles: { name: string }[];
  emojis: { name: string }[];
  skippedChannelCount: number;
}

export const DiscordImportSettings = observer(() => {
  const app = useAppStore();
  const account = app.account;
  const { t } = useTranslation("settings");
  const [guildId, setGuildId] = useState("");
  const [spaceName, setSpaceName] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLinked = Boolean(account?.discordId);

  const botInviteQuery = useQuery({
    queryKey: ["discord-bot-invite"],
    queryFn: () =>
      app.rest.get<{ url: string }>("/@me/discord-import/bot-invite"),
    staleTime: Infinity,
    enabled: isLinked,
  });

  const { mutate: loadPreview, isPending: previewing } = useMutation({
    mutationFn: () =>
      app.rest.post<ImportPreview>("/@me/discord-import/preview", { guildId }),
    onSuccess: (data) => {
      setPreview(data);
      setError(null);
    },
    onError: (err: HttpException) => setError(err.message),
  });

  const { mutate: runImport, isPending: importing } = useMutation({
    mutationFn: () =>
      app.rest.post<{ inviteCode: string }>("/@me/discord-import/execute", {
        guildId,
        spaceName,
      }),
    onSuccess: ({ inviteCode: code }) => {
      setInviteCode(code);
      setError(null);
    },
    onError: (err: HttpException) => setError(err.message),
  });

  if (!account) return null;

  return (
    <SettingsScreen title={t("pages.discordImport")}>
      <SettingsScroll>
        <SettingsSection>
          <Typography textColor="muted" level="body-sm">
            {t("discordImport.intro")}
          </Typography>
          <SettingsActionRow
            title={t("discord.linkDiscord")}
            description={
              isLinked
                ? t("discordImport.linkedStatus")
                : t("discordImport.linkHint")
            }
            actionLabel={
              isLinked ? t("discord.unlinkDiscord") : t("discord.linkDiscord")
            }
            onPress={() => {
              if (isLinked) {
                void app.rest.delete("/@me/discord").then(() => {
                  account.discordId = null;
                  setPreview(null);
                  setInviteCode(null);
                  setError(null);
                });
                return;
              }
              void app.rest
                .get<{ url: string }>("/@me/discord/link?client=mobile")
                .then(({ url }) => Linking.openURL(url));
            }}
          />
        </SettingsSection>

        {isLinked ? (
          <SettingsSection>
            <Typography level="body-sm">
              {t("discordImport.botInviteHint")}
            </Typography>
            <Button
              variant="soft"
              disabled={!botInviteQuery.data?.url}
              onPress={() => {
                const url = botInviteQuery.data?.url;
                if (url) void Linking.openURL(url);
              }}
            >
              {t("discordImport.botInvite")}
            </Button>
            <Box style={{ gap: 4 }}>
              <Typography level="body-sm" weight={500}>
                {t("discordImport.guildId")}
              </Typography>
              <Typography textColor="muted" level="body-xs">
                {t("discordImport.guildIdHint")}
              </Typography>
              <InputDefault
                placeholder={t("discordImport.guildIdPlaceholder")}
                value={guildId}
                onChangeText={setGuildId}
                fullWidth
              />
            </Box>
            <Box style={{ gap: 4 }}>
              <Typography level="body-sm" weight={500}>
                {t("discordImport.spaceName")}
              </Typography>
              <InputDefault
                placeholder={t("discordImport.spaceNamePlaceholder")}
                value={spaceName}
                onChangeText={setSpaceName}
                fullWidth
              />
            </Box>
            <Box style={{ flexDirection: "row", gap: 8 }}>
              <Button
                disabled={!guildId || previewing}
                onPress={() => loadPreview()}
              >
                {t("discordImport.preview")}
              </Button>
              <Button
                disabled={!guildId || !spaceName || !preview || importing}
                onPress={() => runImport()}
              >
                {t("discordImport.import")}
              </Button>
            </Box>
            {error && (
              <Typography color="danger" level="body-sm">
                {error}
              </Typography>
            )}
            {preview && (
              <Box style={{ gap: 4 }}>
                <Typography level="body-sm" weight={600}>
                  {t("discordImport.previewTitle")}
                </Typography>
                <Typography level="body-sm">
                  {t("discordImport.previewSummary", {
                    channels: preview.channels.length,
                    roles: preview.roles.length,
                    emojis: preview.emojis.length,
                    skipped: preview.skippedChannelCount,
                  })}
                </Typography>
              </Box>
            )}
            {inviteCode && (
              <Typography color="success" level="body-sm">
                {t("discordImport.inviteReady", { code: inviteCode })}
              </Typography>
            )}
          </SettingsSection>
        ) : null}
      </SettingsScroll>
    </SettingsScreen>
  );
});

export default DiscordImportSettings;
