import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { Box, ButtonGroup, Modal, Typography } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  channel: Channel;
}

export const CategoryDeleteSheet = observer(
  ({ visible, onClose, channel }: Props) => {
    const app = useAppStore();
    const { t } = useTranslation("space");
    const { t: tCommon } = useTranslation("common");
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
              {t("channels.deleteCategory.title", { name: channel.name })}
            </Typography>
            <Typography textColor="muted" level="body-sm">
              {t("channels.deleteCategory.body")}
            </Typography>
            <ButtonGroup orientation="vertical" spacing={8}>
              <Button
                color="danger"
                disabled={isPending}
                onPress={() => deleteCategory(true)}
              >
                {t("channels.deleteCategory.categoryOnly")}
              </Button>
              <Button
                color="danger"
                variant="soft"
                disabled={isPending}
                onPress={() => deleteCategory(false)}
              >
                {t("channels.deleteCategory.categoryAndChannels")}
              </Button>
              <Button variant="plain" onPress={onClose}>
                {tCommon("cancel")}
              </Button>
            </ButtonGroup>
          </Paper>
        </View>
      </Modal>
    );
  },
);
