import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { Box, ButtonGroup, Modal, Typography } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { View } from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  channel: Channel;
}

export const CategoryDeleteSheet = observer(
  ({ visible, onClose, channel }: Props) => {
    const app = useAppStore();
    const { mutate: deleteCategory, isPending } = useMutation({
      mutationKey: ["delete-category", channel.id],
      mutationFn: (parentOnly: boolean) => channel.delete(parentOnly),
      onSuccess: onClose,
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
        <View pointerEvents="box-none" style={{ flex: 1, justifyContent: "flex-end", width: "100%" }}>
          <Paper
            elevation={app.settings?.preferEmbossed ? 4 : 2}
            style={{
              padding: 24,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              gap: 16,
            }}
          >
            <Typography level="body-md" weight="bold">
              Delete category &quot;{channel.name}&quot;?
            </Typography>
            <Typography textColor="muted" level="body-sm">
              Choose whether to keep channels inside this category.
            </Typography>
            <ButtonGroup orientation="vertical" spacing={8}>
              <Button
                color="danger"
                disabled={isPending}
                onPress={() => deleteCategory(true)}
              >
                Delete category only
              </Button>
              <Button
                color="danger"
                variant="soft"
                disabled={isPending}
                onPress={() => deleteCategory(false)}
              >
                Delete category and channels
              </Button>
              <Button variant="plain" onPress={onClose}>
                Cancel
              </Button>
            </ButtonGroup>
          </Paper>
        </View>
      </Modal>
    );
  },
);
