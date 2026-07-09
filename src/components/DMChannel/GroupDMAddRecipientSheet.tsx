import { AppKeyboardAvoidingView } from "@components/Keyboard/AppKeyboardAvoidingView";
import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppStore } from "@hooks/useStores";
import { Box, InputDefault, Modal, Typography } from "@mutualzz/ui-native";
import {
  MODAL_SHEET_KEYBOARD_STYLE,
  MODAL_SHEET_WRAPPER_STYLE,
  useModalSheetMaxHeight,
} from "@utils/modalSheet";
import { useScaledModalListMaxHeight } from "@utils/accessibilityLayout";
import type { Snowflake } from "@mutualzz/types";
import type { Channel } from "@stores/objects/Channel";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  View,
} from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  channel: Channel;
}

export const GroupDMAddRecipientSheet = observer(
  ({ visible, onClose, channel }: Props) => {
    const app = useAppStore();
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Snowflake | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const existingIds = new Set(channel.recipientIds ?? []);
    const isFull = (channel.recipientIds?.length ?? 0) >= 10;
    const maxSheetHeight = useModalSheetMaxHeight(0.85);
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
        setError(e instanceof Error ? e.message : "Failed to add recipient");
      } finally {
        setSaving(false);
      }
    };

    return (
      <Modal
        open={visible}
        onClose={onClose}
        layout="fullscreen"
        showCloseButton={false}
        style={{
          justifyContent: "flex-end",
          alignItems: "stretch",
          backgroundColor: "transparent",
          paddingVertical: 0,
        }}
      >
        <View pointerEvents="box-none" style={MODAL_SHEET_WRAPPER_STYLE}>
          <AppKeyboardAvoidingView style={MODAL_SHEET_KEYBOARD_STYLE}>
            <Paper
              elevation={app.settings?.preferEmbossed ? 4 : 2}
              style={{
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: 20,
                gap: 12,
                maxHeight: maxSheetHeight,
              }}
            >
              <Typography level="body-lg" weight="bold">
                Add to Group
              </Typography>
              <Typography
                level="body-sm"
                variant={isFull ? "plain" : "none"}
                color={isFull ? "danger" : undefined}
                textColor={isFull ? undefined : "muted"}
              >
                {isFull
                  ? "This group is full (10/10)."
                  : `${10 - (channel.recipientIds?.length ?? 0)} spot${10 - (channel.recipientIds?.length ?? 0) === 1 ? "" : "s"} remaining`}
              </Typography>

              {!isFull ? (
                <>
                  <InputDefault
                    fullWidth
                    placeholder="Search friends"
                    accessibilityLabel="Search friends"
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
                        {search.trim() ? "No results." : "No friends to add."}
                      </Typography>
                    }
                    renderItem={({ item }) => {
                      const isSelected = selected === item.id;
                      return (
                        <Pressable
                          onPress={() =>
                            setSelected((prev) =>
                              prev === item.id ? null : item.id,
                            )
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
                              <Typography weight={600}>
                                {item.displayName}
                              </Typography>
                              <Typography level="body-sm" textColor="muted">
                                @{item.username}
                              </Typography>
                            </Box>
                            <Typography color="primary">
                              {isSelected ? "Selected" : ""}
                            </Typography>
                          </Box>
                        </Pressable>
                      );
                    }}
                  />
                </>
              ) : null}

              {error ? (
                <Typography
                  color="danger"
                  level="body-sm"
                  accessibilityLiveRegion="polite"
                >
                  {error}
                </Typography>
              ) : null}

              <Box style={{ flexDirection: "row", gap: 8 }}>
                <Button variant="plain" color="neutral" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  disabled={!selected || saving || isFull}
                  onPress={() => void addRecipient()}
                >
                  Add to Group
                </Button>
              </Box>
            </Paper>
          </AppKeyboardAvoidingView>
        </View>
      </Modal>
    );
  },
);
