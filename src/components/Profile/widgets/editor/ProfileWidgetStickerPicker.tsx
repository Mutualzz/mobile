import { StickerPickerContent } from "@components/Expression/StickerPickerContent";
import { IconButton } from "@components/IconButton";
import { BottomSheet } from "@components/Keyboard/BottomSheet";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { Expression } from "@stores/objects/Expression";
import { useSheetMaxHeight } from "@utils/sheet";
import { XIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (sticker: Expression) => void;
  presentation?: "modal" | "overlay";
}

export function ProfileWidgetStickerPicker({
  visible,
  onClose,
  onSelect,
  presentation = "modal",
}: Props) {
  const { t } = useTranslation("settings");
  const { t: tCommon } = useTranslation("common");
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const sheetHeight = useSheetMaxHeight(0.8);
  const title = t("profile.inspector.chooseSticker");

  const handleSelect = (sticker: Expression) => {
    onSelect(sticker);
    onClose();
  };

  if (presentation === "overlay") {
    if (!visible) return null;

    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            zIndex: 200,
            backgroundColor: theme.colors.background,
            paddingTop: insets.top,
          },
        ]}
      >
        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        >
          <Typography level="title-md" weight="bold">
            {title}
          </Typography>
          <IconButton
            variant="plain"
            padding={4}
            accessibilityLabel={tCommon("close")}
            onPress={onClose}
          >
            <XIcon size={18} />
          </IconButton>
        </Box>

        <View style={{ flex: 1, minHeight: 0 }}>
          <StickerPickerContent
            active={visible}
            profileMode
            onSelectSticker={handleSelect}
          />
        </View>
      </View>
    );
  }

  return (
    <BottomSheet
      open={visible}
      onClose={onClose}
      title={title}
      height={sheetHeight}
      keyboard="none"
      headerRight={
        <IconButton
          variant="plain"
          padding={4}
          accessibilityLabel={tCommon("close")}
          onPress={onClose}
        >
          <XIcon size={18} />
        </IconButton>
      }
    >
      <StickerPickerContent
        active={visible}
        profileMode
        onSelectSticker={handleSelect}
      />
    </BottomSheet>
  );
}
