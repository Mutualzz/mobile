import { Button } from "@components/Button";
import { Box, ButtonGroup, Sheet, Typography } from "@mutualzz/ui-native";
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
    const { t } = useTranslation("space");
    const { t: tCommon } = useTranslation("common");
    const { mutate: deleteCategory, isPending } = useMutation({
      mutationKey: ["delete-category", channel.id],
      mutationFn: (parentOnly: boolean) => channel.delete(parentOnly),
      onSuccess: onClose,
    });

    return (
      <Sheet
        open={visible}
        onClose={onClose}
        showCloseButton={false}
      enableDynamicSizing
      >
        <View style={{ width: "100%", padding: 16, gap: 12 }}>
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
        </View>
      </Sheet>
    );
  },
);
