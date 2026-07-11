import { IconButton } from "@components/IconButton";
import { Box, Modal, Typography, useTheme } from "@mutualzz/ui-native";
import { MODAL_SHEET_WRAPPER_STYLE } from "@utils/modalSheet";
import { XIcon } from "phosphor-react-native";
import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  visible?: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Panel only — use with ModalRoot to avoid nested RN Modals. */
  embedded?: boolean;
}

export function ProfileWidgetMaximizeModal({
  visible = true,
  title,
  onClose,
  children,
  embedded = false,
}: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const panel = (
    <View pointerEvents="box-none" style={MODAL_SHEET_WRAPPER_STYLE}>
      <Box
        style={{
          backgroundColor: theme.colors.background,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: "80%",
          paddingBottom: insets.bottom + 16,
          width: "100%",
          alignSelf: "stretch",
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
    </View>
  );

  if (embedded) return panel;

  return (
    <Modal
      open={visible}
      onClose={onClose}
      layout="fullscreen"
      showCloseButton={false}
      style={{
        justifyContent: "flex-end",
        alignItems: "stretch",
        backgroundColor: "transparent",
        paddingVertical: 0,
      }}
    >
      {panel}
    </Modal>
  );
}
