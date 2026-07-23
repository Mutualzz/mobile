import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { UserCircleDashedIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";

interface Props {
  onBack?: () => void;
}

export function ProfileNotFoundState({ onBack }: Props) {
  const { t } = useTranslation("settings");
  const { theme } = useTheme();

  return (
    <Box
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Paper
        style={{
          width: "100%",
          maxWidth: 360,
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 20,
          paddingVertical: 28,
          borderRadius: 16,
        }}
      >
        <UserCircleDashedIcon size={40} color={theme.typography.colors.muted} />
        <Typography level="title-md" style={{ textAlign: "center" }}>
          {t("profile.viewer.userNotFoundTitle")}
        </Typography>
        <Typography level="body-sm" textColor="muted" style={{ textAlign: "center" }}>
          {t("profile.viewer.userNotFoundDescription")}
        </Typography>
        {onBack ? (
          <Button color="primary" onPress={onBack}>
            {t("profile.viewer.userNotFoundAction")}
          </Button>
        ) : null}
      </Paper>
    </Box>
  );
}
