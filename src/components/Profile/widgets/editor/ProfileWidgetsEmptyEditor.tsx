import { Button } from "@components/Button";
import { Typography, useTheme } from "@mutualzz/ui-native";
import { SquaresFourIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

interface Props {
  onCopyFromDesktop?: () => void;
}

export function ProfileWidgetsEmptyEditor({ onCopyFromDesktop }: Props) {
  const { t } = useTranslation("settings");
  const { theme } = useTheme();

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        paddingVertical: 28,
        paddingHorizontal: 24,
      }}
    >
      <SquaresFourIcon size={28} color={theme.typography.colors.muted} />
      <Typography
        level="body-sm"
        textColor="muted"
        style={{ textAlign: "center" }}
      >
        {t("profile.widgets.emptyEditor")}
      </Typography>
      {onCopyFromDesktop && (
        <Button variant="soft" color="neutral" onPress={onCopyFromDesktop}>
          {t("profile.widgets.copyFromDesktop")}
        </Button>
      )}
    </View>
  );
}
