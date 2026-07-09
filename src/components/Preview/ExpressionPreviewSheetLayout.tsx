import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import type { PropsWithChildren } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const EXPRESSION_PREVIEW_MODAL_PROPS = {
  layout: "fullscreen" as const,
  showCloseButton: false,
  style: {
    justifyContent: "flex-end" as const,
    alignItems: "stretch" as const,
    backgroundColor: "transparent",
    paddingVertical: 0,
  },
};

interface Props extends PropsWithChildren {
  onClose: () => void;
}

export const ExpressionPreviewSheetLayout = ({ children, onClose }: Props) => {
  const app = useAppStore();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "flex-end",
        width: "100%",
      }}
    >
      <Pressable
        style={{ flex: 1 }}
        onPress={onClose}
        accessibilityRole="button"
      />
      <View onStartShouldSetResponder={() => true}>
        <Paper
          style={{
            marginHorizontal: 12,
            marginBottom: insets.bottom + 8,
            padding: 16,
            gap: 12,
            borderRadius: 16,
          }}
          elevation={app.settings?.preferEmbossed ? 3 : 1}
        >
          {children}
        </Paper>
      </View>
    </View>
  );
};
