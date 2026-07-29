import { useAppStore } from "@hooks/useStores";
import type { Space } from "@stores/objects/Space";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { LockSimpleIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

interface Props {
  space: Space;
  showMessage?: boolean;
  headerClearance?: number;
}

export const SpaceLockdownOverlay = observer(
  ({ space, showMessage = true, headerClearance = 0 }: Props) => {
    const { t } = useTranslation("space");
    const app = useAppStore();
    const { theme } = useTheme();
    const isOwner = space.ownerId === app.account?.id;

    if (!space.isInLockdown) return null;

    return (
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
        }}
      >
        <Pressable
          style={{
            position: "absolute",
            top: headerClearance,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {showMessage && (
            <Box
              style={{
                maxWidth: 320,
                marginHorizontal: 24,
                paddingHorizontal: 20,
                paddingVertical: 18,
                borderRadius: 12,
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.warning,
                alignItems: "center",
                gap: 8,
              }}
            >
              <LockSimpleIcon size={28} color={theme.colors.warning} />
              <Typography
                style={{ fontWeight: "700", textAlign: "center" }}
                textColor="primary"
              >
                {t("lockdown.title")}
              </Typography>
              <Typography
                style={{ textAlign: "center" }}
                textColor="secondary"
                level="body-sm"
              >
                {isOwner
                  ? t("lockdown.ownerMessage")
                  : t("lockdown.memberMessage")}
              </Typography>
            </Box>
          )}
        </Pressable>
      </View>
    );
  },
);
