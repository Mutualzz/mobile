import { GifPickerContent } from "@components/Expression/GifPicker";
import { IconButton } from "@components/IconButton";
import { BottomSheet } from "@components/Keyboard/BottomSheet";
import { resolveGifImageBlockSrc } from "@mutualzz/ui-core";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { GifResult } from "@utils/gifs";
import { XIcon } from "phosphor-react-native";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (src: string) => void;
  presentation?: "modal" | "overlay";
}

export function ProfileWidgetGifPicker({
  visible,
  onClose,
  onSelect,
  presentation = "modal",
}: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const handleSelect = (gif: GifResult) => {
    onSelect(resolveGifImageBlockSrc(gif));
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
            Choose a GIF
          </Typography>
          <IconButton
            variant="plain"
            color="neutral"
            padding={4}
            accessibilityLabel="Close"
            onPress={onClose}
          >
            <XIcon size={18} />
          </IconButton>
        </Box>

        <View style={{ flex: 1, minHeight: 0 }}>
          <GifPickerContent active={visible} onSelectGif={handleSelect} />
        </View>
      </View>
    );
  }

  return (
    <BottomSheet
      open={visible}
      onClose={onClose}
      title="Choose a GIF"
      maxHeight="80%"
      scrollable={false}
      headerRight={
        <IconButton
          variant="plain"
          color="neutral"
          padding={4}
          accessibilityLabel="Close"
          onPress={onClose}
        >
          <XIcon size={18} />
        </IconButton>
      }
    >
      <GifPickerContent active={visible} onSelectGif={handleSelect} />
    </BottomSheet>
  );
}
