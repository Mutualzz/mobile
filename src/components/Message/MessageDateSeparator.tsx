import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

interface Props {
  date: Date;
}

export const MessageDateSeparator = ({ date }: Props) => {
  const { t } = useTranslation("chat");
  const { theme } = useTheme();

  const label = (() => {
    const d = dayjs(date);
    if (d.isSame(dayjs(), "day")) return t("dateSeparator.today");
    if (d.isSame(dayjs().subtract(1, "day"), "day"))
      return t("dateSeparator.yesterday");
    return d.format("MMMM D, YYYY");
  })();

  const lineColor = theme.typography.colors.muted;

  return (
    <Box
      accessibilityLabel={label}
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "stretch",
        minWidth: 0,
        marginHorizontal: 16,
        marginVertical: 10,
        gap: 10,
      }}
    >
      <Box
        style={{
          flex: 1,
          minWidth: 0,
          height: StyleSheet.hairlineWidth,
          backgroundColor: lineColor,
          opacity: 0.45,
        }}
      />
      <Typography
        level="body-sm"
        textColor="accent"
        style={{ flexShrink: 0, opacity: 0.85 }}
      >
        {label}
      </Typography>
      <Box
        style={{
          flex: 1,
          minWidth: 0,
          height: StyleSheet.hairlineWidth,
          backgroundColor: lineColor,
          opacity: 0.45,
        }}
      />
    </Box>
  );
};
