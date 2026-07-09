import { Button } from "@components/Button";
import { ChannelIcon } from "@components/Channel/ChannelIcon";
import { Paper } from "@components/Paper";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import {
  type APIChannel,
  ChannelType,
  type HttpException,
} from "@mutualzz/types";
import {
  Box,
  ButtonGroup,
  InputDefault,
  Modal,
  Typography,
} from "@mutualzz/ui-native";
import { MODAL_SHEET_WRAPPER_STYLE, useModalSheetMaxHeight } from "@utils/modalSheet";
import type { Channel } from "@stores/objects/Channel";
import type { Space } from "@stores/objects/Space";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { ScrollView, View } from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  space: Space;
  parent?: Channel;
}

export const ChannelCreateSheet = observer(
  ({ visible, onClose, space, parent }: Props) => {
    const app = useAppStore();
    const { navigate } = useAppNavigation();
    const [name, setName] = useState("");
    const [type, setType] = useState<ChannelType>(ChannelType.Text);
    const [error, setError] = useState<string | null>(null);
    const maxSheetHeight = useModalSheetMaxHeight(0.85);

    const { mutate: createChannel, isPending } = useMutation({
      mutationKey: ["create-channel", space.id, name, type],
      mutationFn: async () => {
        const formData = new FormData();
        formData.append("name", name.trim());
        formData.append("type", String(type));
        formData.append("spaceId", space.id);
        if (parent) formData.append("parentId", parent.id);
        return app.rest.postFormData<APIChannel>("channels", formData);
      },
      onSuccess: (newChannel) => {
        setName("");
        setError(null);
        onClose();
        if (newChannel.type === ChannelType.Text) {
          navigate(`/spaces/channel/${newChannel.id}`);
        }
      },
      onError: (err: HttpException) => {
        setError(err.errors?.[0]?.message ?? err.message);
      },
    });

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
          <Paper
            elevation={app.settings?.preferEmbossed ? 4 : 2}
            style={{
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 20,
              gap: 16,
              maxHeight: maxSheetHeight,
            }}
          >
            <Typography level="body-lg" weight="bold">
              Create Channel
            </Typography>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Box style={{ gap: 12 }}>
                <InputDefault
                  fullWidth
                  placeholder="Channel name"
                  value={name}
                  onChangeText={setName}
                  autoFocus
                />
                <ButtonGroup orientation="vertical" spacing={8}>
                  {[ChannelType.Text, ChannelType.Voice].map((channelType) => (
                    <Button
                      key={channelType}
                      variant={type === channelType ? "soft" : "plain"}
                      onPress={() => setType(channelType)}
                      startDecorator={<ChannelIcon type={channelType} />}
                    >
                      {channelType === ChannelType.Text ? "Text" : "Voice"}
                    </Button>
                  ))}
                </ButtonGroup>
                {error && (
                  <Typography color="danger" level="body-sm">
                    {error}
                  </Typography>
                )}
              </Box>
            </ScrollView>
            <Box
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Button
                variant="soft"
                color="danger"
                onPress={onClose}
                disabled={isPending}
                expand
              >
                Cancel
              </Button>
              <Button
                expand
                color="success"
                disabled={isPending || !name.trim()}
                onPress={() => createChannel()}
              >
                Create
              </Button>
            </Box>
          </Paper>
        </View>
      </Modal>
    );
  },
);
