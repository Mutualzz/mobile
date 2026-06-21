import { MarkdownInput } from "@components/Markdown/MarkdownInput/MarkdownInput";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import type { APIChannel } from "@mutualzz/types";
import { Box, Button, InputDefault, Typography } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Modal, ScrollView } from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  channel: Channel;
}

export const ChannelSettingsSheet = observer(
  ({ visible, onClose, channel }: Props) => {
    const app = useAppStore();
    const [name, setName] = useState(channel.name);
    const [topic, setTopic] = useState(channel.topic ?? "");
    const [selection, setSelection] = useState({ start: 0, end: 0 });

    const { mutate: save, isPending } = useMutation({
      mutationKey: ["channel-settings", channel.id],
      mutationFn: () =>
        app.rest.patch<APIChannel>(`/channels/${channel.id}`, {
          name: name?.trim(),
          topic,
        }),
      onSuccess: onClose,
    });

    const { mutate: deleteChannel, isPending: deleting } = useMutation({
      mutationKey: ["delete-channel", channel.id],
      mutationFn: () => channel.delete(false),
      onSuccess: onClose,
    });

    return (
      <Modal visible={visible} animationType="slide" transparent>
        <Box
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.45)",
          }}
        >
          <Paper
            style={{
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 20,
              gap: 12,
              maxHeight: "85%",
            }}
          >
            <Typography level="body-lg" weight="bold">
              Channel Settings
            </Typography>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Box style={{ gap: 12 }}>
                <InputDefault
                  fullWidth
                  value={name ?? ""}
                  onChangeText={setName}
                  placeholder="Channel name"
                />
                <MarkdownInput
                  value={topic}
                  onChange={setTopic}
                  selection={selection}
                  onChangeSelection={setSelection}
                  channelId={channel.id}
                  placeholder="Topic"
                  style={{ minHeight: 80 }}
                />
              </Box>
            </ScrollView>
            <Button
              disabled={isPending || !name?.trim()}
              onPress={() => save()}
            >
              Save
            </Button>
            <Button
              color="danger"
              variant="soft"
              disabled={deleting}
              onPress={() => deleteChannel()}
            >
              Delete channel
            </Button>
            <Button variant="plain" onPress={onClose}>
              Close
            </Button>
          </Paper>
        </Box>
      </Modal>
    );
  },
);
