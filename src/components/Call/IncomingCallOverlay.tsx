import { CallRingingAvatar } from "@components/Call/CallRingingAvatar";
import { IconButton } from "@components/IconButton";
import { useAppStore } from "@hooks/useStores";
import { dynamicElevation } from "@mutualzz/ui-core";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { PhoneIcon, PhoneSlashIcon } from "phosphor-react-native";
import { useEffect } from "react";
import { Modal, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const IncomingCallOverlay = observer(() => {
  const app = useAppStore();
  const { theme } = useTheme();
  const { t } = useTranslation("chat");
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const channelId = app.calls.getIncomingRingingChannelId();

  useEffect(() => {
    if (!channelId) return;
    app.sounds.unlock();
  }, [app, channelId]);

  if (!channelId) return null;

  if (String(app.channels.activeId) === channelId) return null;

  const call = app.calls.getCall(channelId);
  if (!call || call.status === "ended") return null;

  const initiator = app.users.get(String(call.initiatorId));

  const decline = () => {
    void app.calls.decline(channelId);
  };

  const accept = () => {
    void app.calls.accept(channelId);
    app.setDMDrawerOpen(false);
    router.replace(`/@me/${channelId}`);
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={decline}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.72)",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingHorizontal: 24
        }}
      >
        <Box
          style={{
            width: "100%",
            maxWidth: 360,
            borderRadius: 16,
            paddingTop: 32,
            paddingBottom: 28,
            paddingHorizontal: 28,
            alignItems: "center",
            gap: 20,
            backgroundColor: dynamicElevation(theme.colors.surface, 4)
          }}
        >
          <CallRingingAvatar user={initiator} size={112} pulsing dimmed />
          <Box style={{ alignItems: "center", gap: 4 }}>
            <Typography
              level="title-lg"
              textColor="primary"
              style={{ fontWeight: "700", textAlign: "center" }}
            >
              {initiator?.displayName ?? t("deletedUser")}
            </Typography>
            <Typography level="body-md" textColor="secondary">
              {t("call.incoming")}
            </Typography>
          </Box>
          <Box
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "center",
              gap: 40,
              paddingTop: 8
            }}
          >
            <Box style={{ alignItems: "center", gap: 8 }}>
              <IconButton
                padding={16}
                color="danger"
                variant="solid"
                accessibilityLabel={t("call.decline")}
                onPress={decline}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.colors.danger
                }}
              >
                <PhoneSlashIcon size={26} weight="fill" color="#fff" />
              </IconButton>
              <Typography level="label-sm" textColor="secondary">
                {t("call.decline")}
              </Typography>
            </Box>
            <Box style={{ alignItems: "center", gap: 8 }}>
              <IconButton
                padding={16}
                color="success"
                variant="solid"
                accessibilityLabel={t("call.accept")}
                onPress={accept}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.colors.success
                }}
              >
                <PhoneIcon size={26} weight="fill" color="#fff" />
              </IconButton>
              <Typography level="label-sm" textColor="secondary">
                {t("call.accept")}
              </Typography>
            </Box>
          </Box>
        </Box>
      </View>
    </Modal>
  );
});
