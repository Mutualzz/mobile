import { Button } from "@components/Button";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { Box, ButtonGroup, Divider, Sheet, Typography } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import { useMutation } from "@tanstack/react-query";
import {
  CheckCircleIcon,
  GearIcon,
  SignOutIcon,
  TrashIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

interface Props {
  channel: Channel;
  visible: boolean;
  onClose: () => void;
  onOpenManage: () => void;
}

export const GroupDMActionSheet = observer(
  ({ channel, visible, onClose, onOpenManage }: Props) => {
    const app = useAppStore();
    const { t } = useTranslation("chat");
    const { navigate } = useAppNavigation();

    const readState = app.readStates.get(channel.id);
    const isOwner = !!channel.ownerId && channel.ownerId === app.account?.id;

    const onLeft = () => {
      onClose();
      navigate("/@me", { replace: true });
    };

    const { mutate: leaveGroup, isPending: isLeaving } = useMutation({
      mutationKey: ["leave-group-dm", channel.id],
      mutationFn: () => app.channels.leaveGroupDM(channel.id),
      onSuccess: onLeft});

    const { mutate: deleteGroup, isPending: isDeleting } = useMutation({
      mutationKey: ["delete-group-dm", channel.id],
      mutationFn: () => app.channels.deleteGroupDM(channel.id),
      onSuccess: onLeft});

    const isPending = isLeaving || isDeleting;
    const title =
      channel.name ??
      (channel.dmRecipientsList
        .map((user) => user.displayName)
        .filter(Boolean)
        .join(", ") ||
        t("groupDm.title"));

    return (
      <Sheet
        open={visible}
        onClose={onClose}
        showCloseButton={false}
      enableDynamicSizing
      >
        <View style={{ width: "100%" }}>
          <View onStartShouldSetResponder={() => true}>
            <Box
              style={{
                width: "100%",
                padding: 16,
                gap: 8}}
            >
              <Box style={{ gap: 8 }}>
                <Box
                  style={{ alignItems: "center", paddingVertical: 4, gap: 2 }}
                >
                  <Typography level="body-md" weight={700} truncate="double">
                    {title}
                  </Typography>
                </Box>

                <Divider lineColor="muted" />

                <ButtonGroup
                  orientation="vertical"
                  variant="plain"
                  fullWidth
                  horizontalAlign="left"
                  spacing={0.5}
                >
                  {readState?.isUnread && (
                    <Button
                      fullWidth
                      padding={12}
                      startDecorator={
                        <CheckCircleIcon size={20} weight="fill" />
                      }
                      onPress={() => {
                        void readState.ack();
                        onClose();
                      }}
                    >
                      {t("contextMenu.markAsRead")}
                    </Button>
                  )}

                  {isOwner && (
                    <Button
                      fullWidth
                      padding={12}
                      startDecorator={<GearIcon size={20} weight="fill" />}
                      onPress={() => {
                        onClose();
                        onOpenManage();
                      }}
                    >
                      {t("groupDm.manage.title")}
                    </Button>
                  )}

                  <Button
                    fullWidth
                    padding={12}
                    startDecorator={<SignOutIcon size={20} weight="fill" />}
                    disabled={isPending}
                    onPress={() => leaveGroup()}
                  >
                    {t("groupDm.leave")}
                  </Button>

                  {isOwner && (
                    <Button
                      fullWidth
                      padding={12}
                      color="danger"
                      startDecorator={<TrashIcon size={20} weight="fill" />}
                      disabled={isPending}
                      onPress={() => deleteGroup()}
                    >
                      {t("groupDm.delete")}
                    </Button>
                  )}
                </ButtonGroup>
              </Box>
            </Box>
          </View>
        </View>
      </Sheet>
    );
  },
);
