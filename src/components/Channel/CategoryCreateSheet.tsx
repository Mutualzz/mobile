import { Button } from "@components/Button";
import { useAppStore } from "@hooks/useStores";
import { ChannelType, type HttpException } from "@mutualzz/types";
import { Box, InputDefault, Sheet, Typography } from "@mutualzz/ui-native";
import type { Space } from "@stores/objects/Space";
import { useMutation } from "@tanstack/react-query";
import { FolderSimpleIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  space: Space;
}

export const CategoryCreateSheet = observer(
  ({ visible, onClose, space }: Props) => {
    const app = useAppStore();
    const { t } = useTranslation("space");
    const { t: tCommon } = useTranslation("common");
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
      <Sheet
          open={visible}
          onClose={onClose}
          showCloseButton={false}
          enableDynamicSizing
        >
        <View style={{ width: "100%", padding: 16, gap: 12 }}>
            <Typography level="body-lg" weight="bold">
              {t("channels.createCategory.title")}
            </Typography>
            <InputDefault
              fullWidth
              placeholder={t("channels.createCategory.namePlaceholder")}
              value={name}
              onChangeText={setName}
              startDecorator={<FolderSimpleIcon size={18} weight="fill" />}
            />
            {error && (
              <Typography color="danger" level="body-sm">
                {error}
              </Typography>
            )}
            <Box>
              <Button
                expand
                color="success"
                disabled={isPending || !name.trim()}
                onPress={() => createCategory()}
              >
                {tCommon("create")}
              </Button>
            </Box>
        </View>
      </Sheet>
    );
  },
);
