import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { ChannelType, type HttpException } from "@mutualzz/types";
import { Box, InputDefault, Modal, Typography } from "@mutualzz/ui-native";
import type { Space } from "@stores/objects/Space";
import { useMutation } from "@tanstack/react-query";
import { FolderSimpleIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { View } from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  space: Space;
}

export const CategoryCreateSheet = observer(
  ({ visible, onClose, space }: Props) => {
    const app = useAppStore();
    const [name, setName] = useState("");
    const [error, setError] = useState<string | null>(null);

    const { mutate: createCategory, isPending } = useMutation({
      mutationKey: ["create-category", space.id, name],
      mutationFn: async () => {
        const formData = new FormData();
        formData.append("name", name.trim());
        formData.append("type", ChannelType.Category.toString());
        formData.append("spaceId", space.id);
        return app.rest.postFormData("channels", formData);
      },
      onSuccess: () => {
        setName("");
        setError(null);
        onClose();
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
        <View pointerEvents="box-none" style={{ flex: 1, justifyContent: "flex-end", width: "100%" }}>
          <Paper
            variant="elevation"
            elevation={app.settings?.preferEmbossed ? 4 : 2}
            style={{
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 20,
              gap: 16,
            }}
          >
            <Typography level="body-lg" weight="bold">
              Create Category
            </Typography>
            <InputDefault
              fullWidth
              placeholder="Category name"
              value={name}
              onChangeText={setName}
              startDecorator={<FolderSimpleIcon size={18} weight="fill" />}
            />
            {error && (
              <Typography color="danger" level="body-sm">
                {error}
              </Typography>
            )}
            <Box
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <Button color="danger" expand variant="soft" onPress={onClose}>
                Cancel
              </Button>
              <Button
                expand
                color="success"
                disabled={isPending || !name.trim()}
                onPress={() => createCategory()}
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
