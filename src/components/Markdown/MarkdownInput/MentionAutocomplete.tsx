import { Paper } from "@components/Paper";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppStore } from "@hooks/useStores";
import type { MentionType, Snowflake } from "@mutualzz/types";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  useScaledAutocompleteMaxHeight,
  useScaledSquareSize,
} from "@utils/accessibilityLayout";
import { Pressable, ScrollView } from "react-native";

interface Candidate {
  id: string;
  displayName: string;
  mentionLabel: string;
  type: MentionType;
  userId?: Snowflake;
}

interface Props {
  channel: Channel;
  search: string;
  onSelect: (type: MentionType, id: string, label: string) => void;
}

export const MentionAutocomplete = observer(
  ({ channel, search, onSelect }: Props) => {
    const { t } = useTranslation("chat");
    const app = useAppStore();
    const { theme } = useTheme();
    const autocompleteMaxHeight = useScaledAutocompleteMaxHeight();
    const avatarSize = useScaledSquareSize(24);

    const space = channel.spaceId ? app.spaces.get(channel.spaceId) : null;

    const canMentionEveryone =
      space?.members.me?.hasPermission("MentionEveryone", channel) ?? false;

    const candidates = useMemo(() => {
      const userCandidates: Candidate[] = space
        ? [...space.members.all.values()].map((member) => {
            const label =
              member.user?.displayName ??
              member.user?.username ??
              member.userId;
            return {
              id: member.userId,
              displayName: label,
              mentionLabel: label,
              type: "user" as const,
              userId: member.userId,
            };
          })
        : channel.dmRecipientsList.map((user) => {
            const label = user.displayName ?? user.username ?? user.id;
            return {
              id: user.id,
              displayName: label,
              mentionLabel: label,
              type: "user" as const,
              userId: user.id,
            };
          });

      const roleCandidates: Candidate[] =
        space && space.roles
          ? space.roles.all
              .filter((role) => role.mentionable || canMentionEveryone)
              .filter((role) => role.id !== space.id)
              .map((role) => ({
                id: role.id,
                displayName: `@${role.name}`,
                mentionLabel: role.name,
                type: "role" as const,
              }))
          : [];

      const specialCandidates: Candidate[] = [];
      if (canMentionEveryone && space) {
        if (search.toLowerCase().includes("everyone")) {
          specialCandidates.push({
            id: "everyone",
            displayName: "@everyone",
            mentionLabel: "everyone",
            type: "everyone",
          });
        }
        if (search.toLowerCase().includes("here")) {
          specialCandidates.push({
            id: "here",
            displayName: "@here",
            mentionLabel: "here",
            type: "here",
          });
        }
      }

      const lowerSearch = search.toLowerCase();

      return [...specialCandidates, ...userCandidates, ...roleCandidates]
        .filter((candidate) =>
          candidate.displayName.toLowerCase().includes(lowerSearch),
        )
        .slice(0, 8);
    }, [canMentionEveryone, channel.dmRecipientsList, search, space]);

    if (candidates.length === 0) return null;

    return (
      <Paper
        elevation={4}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "100%",
          marginBottom: 6,
          maxHeight: autocompleteMaxHeight,
          zIndex: 20,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <Box style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 }}>
          <Typography level="body-xs" textColor="muted">
            {search.length === 0
              ? t("mentions.members")
              : t("mentions.membersMatching", { query: search })}
          </Typography>
        </Box>
        <ScrollView keyboardShouldPersistTaps="handled">
          {candidates.map((candidate) => (
            <Pressable
              key={`${candidate.type}:${candidate.id}`}
              onPress={() =>
                onSelect(candidate.type, candidate.id, candidate.mentionLabel)
              }
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: pressed
                  ? `${theme.colors.neutral}22`
                  : "transparent",
              })}
            >
              {candidate.type === "user" && candidate.userId && (
                <UserAvatar
                  user={app.users.get(candidate.userId)}
                  size="sm"
                  style={{ width: avatarSize, height: avatarSize }}
                />
              )}
              <Typography level="body-sm" style={{ flex: 1 }} truncate="single">
                {candidate.displayName}
              </Typography>
              {candidate.type === "role" && (
                <Typography level="body-xs" textColor="muted">
                  {t("mentions.role")}
                </Typography>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </Paper>
    );
  },
);
