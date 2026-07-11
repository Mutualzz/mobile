import { Typography, useTheme } from "@mutualzz/ui-native";
import { DeviceMobileIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export function ProfileWidgetsEmptyViewer() {
  const { t } = useTranslation("settings");
  const { theme } = useTheme();

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 32,
        paddingHorizontal: 24,
      }}
    >
      <DeviceMobileIcon size={28} color={theme.typography.colors.muted} />
      <Typography level="body-sm" textColor="muted" style={{ textAlign: "center" }}>
        {t("profile.viewer.emptyMobile")}
      </Typography>
    </View>
  );
}
