import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { ArrowLeftIcon, XIcon } from "phosphor-react-native";
import { Pressable } from "react-native";
import { useTranslation } from "react-i18next";

interface Props {
  title: string;
  onClose: () => void;
  variant?: "close" | "back";
}

export function SpaceSheetModalHeader({
  title,
  onClose,
  variant = "close",
}: Props) {
  const { t } = useTranslation("common");
  const { theme } = useTheme();
  const iconColor = theme.typography.colors.primary;
  const Icon = variant === "back" ? ArrowLeftIcon : XIcon;
  const a11yLabel = variant === "back" ? t("back") : t("close");

  return (
    <Box
      style={{
        flexDirection: "row",
        alignItems: "center",
        minHeight: 44,
        paddingHorizontal: 4,
      }}
    >
      <Pressable
        onPress={onClose}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        style={{ width: 40, alignItems: "flex-start" }}
      >
        <Icon size={22} weight="bold" color={iconColor} />
      </Pressable>
      <Typography
        level="body-md"
        weight={700}
        truncate="single"
        style={{ flex: 1, textAlign: "center" }}
      >
        {title}
      </Typography>
      <Box style={{ width: 40 }} />
    </Box>
  );
}
