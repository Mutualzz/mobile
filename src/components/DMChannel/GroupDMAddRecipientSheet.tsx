import { BottomSheet } from "@components/Keyboard";
import { Button } from "@components/Button";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppStore } from "@hooks/useStores";
import { Box, InputDefault, Typography } from "@mutualzz/ui-native";
import { useScaledModalListMaxHeight } from "@utils/accessibilityLayout";
import type { Snowflake } from "@mutualzz/types";
import type { Channel } from "@stores/objects/Channel";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable } from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  channel: Channel;
}

export const GroupDMAddRecipientSheet = observer(
  ({ visible, onClose, channel }: Props) => {
    const { t } = useTranslation("common");
    const { t: tChat } = useTranslation("chat");
    const { t: tSpace } = useTranslation("space");
    const app = useAppStore();
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Snowflake | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const existingIds = new Set(channel.recipientIds ?? []);
    const currentCount = channel.recipientIds?.length ?? 0;
    const maxCount = 10;
    const isFull = currentCount >= maxCount;
    const spotsRemaining = maxCount - currentCount;
    const listMaxHeight = useScaledModalListMaxHeight();

    const suggestions = useMemo(() => {
      const query = search.trim().toLowerCase();

      return app
        .getSuggestedGroupDMRecipients()
        .filter((user) => !existingIds.has(user.id))
        .filter((user) =>
          !query
            ? true
            : user.username.toLowerCase().includes(query) ||
              user.displayName.toLowerCase().includes(query),
        );
    }, [app, existingIds, search]);

    const addRecipient = async () => {
      if (!selected || saving || isFull) return;
      setSaving(true);
      setError(null);
      try {
        await app.channels.addGroupDMRecipient(channel.id, selected);
        setSelected(null);
        setSearch("");
        onClose();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : tChat("groupDm.addRecipientFailed"),
        );
      } finally {
        setSaving(false);
      }
    };

    return (
      <BottomSheet
        open={visible}
        onClose={onClose}
        title={tChat("header.dm.addToGroup")}
        maxHeight="85%"
        keyboard="lift"
        elevation={app.settings?.preferEmbossed ? 4 : 2}
      >
        <Typography
          level="body-sm"
          variant={isFull ? "plain" : "none"}
          color={isFull ? "danger" : undefined}
          textColor={isFull ? undefined : "muted"}
        >
          {isFull
            ? tChat("groupDm.groupFullCount", {
                current: currentCount,
                max: maxCount,
              })
            : tChat("groupDm.spotsRemaining", { count: spotsRemaining })}
        </Typography>

        {!isFull && (
          <>
            <InputDefault
              fullWidth
              placeholder={tSpace("invites.modal.searchFriends")}
              accessibilityLabel={tSpace("invites.modal.searchFriends")}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: listMaxHeight }}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Typography level="body-sm" textColor="muted">
                  {search.trim()
                    ? tSpace("invites.modal.noResults")
                    : tChat("groupDm.noFriendsToAdd")}
                </Typography>
              }
              renderItem={({ item }) => {
                const isSelected = selected === item.id;
                return (
                  <Pressable
                    onPress={() =>
                      setSelected((prev) => (prev === item.id ? null : item.id))
                    }
                    accessibilityRole="checkbox"
                    accessibilityLabel={`${item.displayName}, @${item.username}`}
                    accessibilityState={{ checked: isSelected }}
                  >
                    <Box
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        paddingVertical: 10,
                      }}
                    >
                      <UserAvatar user={item} size={36} />
                      <Box style={{ flex: 1 }}>
                        <Typography weight={600}>{item.displayName}</Typography>
                        <Typography level="body-sm" textColor="muted">
                          @{item.username}
                        </Typography>
                      </Box>
                      <Typography color="primary">
                        {isSelected ? tChat("dm.selected") : ""}
                      </Typography>
                    </Box>
                  </Pressable>
                );
              }}
            />
          </>
        )}

        {error && (
          <Typography
            color="danger"
            level="body-sm"
            accessibilityLiveRegion="polite"
          >
            {error}
          </Typography>
        )}

        <Box style={{ flexDirection: "row", gap: 8 }}>
          <Button variant="plain" color="neutral" onPress={onClose}>
            {t("cancel")}
          </Button>
          <Button
            disabled={!selected || saving || isFull}
            onPress={() => void addRecipient()}
          >
            {tChat("header.dm.addToGroup")}
          </Button>
        </Box>
      </BottomSheet>
    );
  },
);
