import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import type { SheetProps } from "@mutualzz/ui-native";
import type { PropsWithChildren } from "react";
import { View } from "react-native";

export const EXPRESSION_PREVIEW_SHEET_PROPS: Partial<SheetProps> = {
  showCloseButton: false,
  enableDynamicSizing: true,
};

interface Props extends PropsWithChildren {
  onClose: () => void;
}

export const ExpressionPreviewSheetLayout = ({ children, onClose }: Props) => {
  const app = useAppStore();

  return (
    <View style={{ width: "100%" }}>
      <View onStartShouldSetResponder={() => true}>
        <Paper
          elevation={app.settings?.preferEmbossed ? 4 : 2}
          style={{
            marginHorizontal: 12,
            marginBottom: 0,
            borderRadius: 16,
            padding: 12,
            gap: 12,
          }}
        >
          {children}
        </Paper>
      </View>
    </View>
  );
};
