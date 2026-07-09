import { AppKeyboardAvoidingView } from "@components/Keyboard/AppKeyboardAvoidingView";
import { UserAvatar } from "@components/User/UserAvatar";
import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { Box, InputDefault, Modal, Typography } from "@mutualzz/ui-native";
import {
  MODAL_SHEET_KEYBOARD_STYLE,
  MODAL_SHEET_WRAPPER_STYLE,
  useModalSheetMaxHeight,
} from "@utils/modalSheet";
import { useScaledModalListMaxHeight } from "@utils/accessibilityLayout";
import type { User } from "@stores/objects/User";
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
}

export const DMChannelCreateSheet = observer(({ visible, onClose }: Props) => {
  const app = useAppStore();
  const { navigate } = useAppNavigation();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<User[]>([]);
  const [groupName, setGroupName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const maxSheetHeight = useModalSheetMaxHeight(0.85);
  const listMaxHeight = useScaledModalListMaxHeight();

  const suggestions = useMemo(() => {
    const all = app.getSuggestedGroupDMRecipients();
    const query = search.trim().toLowerCase();
    if (!query) return all;
    return all.filter(
      (user) =>
        user.username.toLowerCase().includes(query) ||
        user.displayName.toLowerCase().includes(query),
    );
  }, [app, search]);

  const toggleUser = (user: User) => {
    setSelected((prev) => {
      if (prev.some((entry) => entry.id === user.id)) {
        return prev.filter((entry) => entry.id !== user.id);
      }
      if (prev.length >= 9) return prev;
      return [...prev, user];
    });
  };

  const create = async () => {
    if (selected.length === 0 || saving) return;
    setSaving(true);
    setError(null);
    try {
      const recipientIds = selected.map((user) => user.id);
      const channel =
        selected.length === 1
          ? await app.channels.openDM(recipientIds[0])
          : await app.channels.openGroupDM({
              recipientIds,
              name: groupName.trim() || undefined,
            });
      onClose();
      navigate(`/@me/${channel.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create DM");
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
              New Message
            </Typography>
            <InputDefault
              fullWidth
              placeholder="Search people"
              accessibilityLabel="Search people"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {selected.length > 1 && (
              <InputDefault
                fullWidth
                placeholder="Group name (optional)"
                accessibilityLabel="Group name"
                value={groupName}
                onChangeText={setGroupName}
              />
            )}
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: listMaxHeight }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = selected.some(
                  (entry) => entry.id === item.id,
                );
                return (
                  <Pressable
                    onPress={() => toggleUser(item)}
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
                        {isSelected ? "Selected" : ""}
                      </Typography>
                    </Box>
                  </Pressable>
                );
              }}
            />
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
              <Button variant="plain" onPress={onClose}>
                Cancel
              </Button>
              <Button
                disabled={selected.length === 0 || saving}
                onPress={() => void create()}
              >
                Create
              </Button>
            </Box>
          </Paper>
        </AppKeyboardAvoidingView>
      </View>
    </Modal>
  );
});
