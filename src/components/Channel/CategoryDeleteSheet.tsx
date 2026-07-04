import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { Box, ButtonGroup, Typography } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { Modal } from "react-native";

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
      <Modal visible={visible} animationType="fade" transparent>
        <Box
          style={{
            flex: 1,
            justifyContent: "center",
            padding: 24,
            backgroundColor: "rgba(0,0,0,0.45)",
          }}
        >
          <Paper
            elevation={app.settings?.preferEmbossed ? 4 : 2}
            style={{ padding: 20, borderRadius: 12, gap: 16 }}
          >
            <Typography level="body-md" weight="bold">
              Delete category "{channel.name}"?
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
        </Box>
      </Modal>
    );
  },
);
