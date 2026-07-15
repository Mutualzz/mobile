import { IconButton } from "@components/IconButton";
import { Box, Sheet, Typography, useTheme } from "@mutualzz/ui-native";
import { FULL_SHEET_PROPS } from "@utils/sheet";
import { XIcon } from "phosphor-react-native";
import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";

interface Props {
  visible?: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  embedded?: boolean;
}

export function ProfileWidgetMaximizeSheet({
  visible = true,
  title,
  onClose,
  children,
  embedded = false}: Props) {
  const { theme } = useTheme();

  const panel = (
    <View
      style={{
        flex: 1,
        width: "100%",
        minHeight: 0,
        backgroundColor: theme.colors.background,
      }}
    >
      <Box
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 8}}
      >
        <Typography level="title-md" weight="bold">
          {title}
        </Typography>
        <IconButton padding={6} onPress={onClose}>
          <XIcon size={18} />
        </IconButton>
      </Box>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingTop: 4 }}
      >
        {children}
      </ScrollView>
    </View>
  );

  if (embedded) return panel;

  return (
    <Sheet
      open={visible}
      onClose={onClose}
      {...FULL_SHEET_PROPS}
    >
      {panel}
    </Sheet>
  );
}
