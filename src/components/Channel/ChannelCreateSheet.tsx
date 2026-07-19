import { Button } from "@components/Button";
import { ChannelIcon } from "@components/Channel/ChannelIcon";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import {
  type APIChannel,
  ChannelType,
  type HttpException,
} from "@mutualzz/types";
import { Box, ButtonGroup, InputDefault, Sheet, Typography } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import type { Space } from "@stores/objects/Space";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation("space");
    const { t: tCommon } = useTranslation("common");
    const { navigate } = useAppNavigation();
    const [name, setName] = useState("");
    const [type, setType] = useState<ChannelType>(ChannelType.Text);
    const [error, setError] = useState<string | null>(null);

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
          app.setSpacesDrawerOpen(false);
        }
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
              {t("channels.create.title")}
            </Typography>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Box style={{ gap: 12 }}>
                <InputDefault
                  fullWidth
                  placeholder={t("channels.create.namePlaceholder")}
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
                      {channelType === ChannelType.Text
                        ? t("channels.create.text")
                        : t("channels.create.voice")}
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
            <Box>
              <Button
                expand
                color="success"
                disabled={isPending || !name.trim()}
                onPress={() => createChannel()}
              >
                {tCommon("create")}
              </Button>
            </Box>
        </View>
      </Sheet>
    );
  },
);
