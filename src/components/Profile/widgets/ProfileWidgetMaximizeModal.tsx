import { IconButton } from "@components/IconButton";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { XIcon } from "phosphor-react-native";
import type { ReactNode } from "react";
import { Modal, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function ProfileWidgetMaximizeModal({
  visible,
  title,
  onClose,
  children,
}: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Box
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
      >
        <Box
          style={{
            backgroundColor: theme.colors.background,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: "80%",
            paddingBottom: insets.bottom + 16,
          }}
        >
          <Box
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 8,
            }}
          >
            <Typography level="title-md" weight="bold">
              {title}
            </Typography>
            <IconButton padding={6} onPress={onClose}>
              <XIcon size={18} />
            </IconButton>
          </Box>
          <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4 }}>
            {children}
          </ScrollView>
        </Box>
      </Box>
    </Modal>
  );
}
