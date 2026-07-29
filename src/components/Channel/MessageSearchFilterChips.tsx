import { useAppStore } from "@hooks/useStores";
import { Typography, useTheme } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import {
  MESSAGE_SEARCH_HAS_FILTERS,
  hasMessageSearchHasFilter,
  parseMessageSearchQuery,
  setMessageSearchModifier,
  toggleMessageSearchHasFilter,
  type MessageSearchHasFilter,
} from "@mutualzz/validators";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

interface Props {
  query: string;
  onQueryChange: (query: string) => void;
  channel: Channel;
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active
            ? "rgba(88, 101, 242, 0.2)"
            : pressed
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(255, 255, 255, 0.06)",
          borderColor: active
            ? "rgba(88, 101, 242, 0.55)"
            : "rgba(255, 255, 255, 0.08)",
        },
      ]}
    >
      <Typography
        level="body-xs"
        weight={active ? 700 : 500}
        style={{ color: active ? theme.typography.colors.primary : theme.typography.colors.muted }}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

export const MessageSearchFilterChips = observer(
  ({ query, onQueryChange, channel }: Props) => {
    const app = useAppStore();
    const { t } = useTranslation("chat");
    const parsed = parseMessageSearchQuery(query);

    const people = useMemo(() => {
      if (channel.isDM || channel.isGroupDM) {
        const list = [...channel.dmRecipientsList];
        const me = app.account ? app.users.get(app.account.id) : undefined;
        if (me && !list.some((user) => user.id === me.id)) {
          list.unshift(me);
        }
        return list.slice(0, 6);
      }

      const space = channel.space;
      if (!space) return [];
      return space.members.all
        .map((member) => member.user)
        .filter(Boolean)
        .slice(0, 6);
    }, [channel, app.account]);

    const toggleHas = (filter: MessageSearchHasFilter) => {
      onQueryChange(toggleMessageSearchHasFilter(query, filter));
    };

    return (
      <View style={styles.root}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.row}
        >
          <FilterChip
            label={t("search.filterPinned")}
            active={Boolean(parsed.pinned)}
            onPress={() =>
              onQueryChange(
                setMessageSearchModifier(
                  query,
                  "pinned",
                  parsed.pinned ? undefined : true,
                ),
              )
            }
          />
          {MESSAGE_SEARCH_HAS_FILTERS.map((filter) => (
            <FilterChip
              key={filter}
              label={t(`search.has.${filter}`)}
              active={hasMessageSearchHasFilter(query, filter)}
              onPress={() => toggleHas(filter)}
            />
          ))}
          {people.map((user) => {
            if (!user) return null;
            const active =
              parsed.from?.toLowerCase() === user.username.toLowerCase() ||
              (parsed.from === "me" && user.id === app.account?.id);
            return (
              <FilterChip
                key={user.id}
                label={`@${user.username}`}
                active={active}
                onPress={() =>
                  onQueryChange(
                    setMessageSearchModifier(
                      query,
                      "from",
                      active ? undefined : user.username,
                    ),
                  )
                }
              />
            );
          })}
        </ScrollView>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  root: {
    marginTop: -4,
  },
  row: {
    gap: 6,
    paddingVertical: 2,
  },
  chip: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
