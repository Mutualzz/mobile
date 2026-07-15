import { useSheetMaxHeight, SHEET_WRAPPER_STYLE } from "@utils/sheet";
import { Box, Sheet, Typography } from "@mutualzz/ui-native";
import type { PropsWithChildren, ReactNode } from "react";
import { ScrollView, View, type StyleProp, type ViewStyle } from "react-native";

type BottomSheetPanelProps = PropsWithChildren<{
  title?: string;
  headerRight?: ReactNode;
  height?: number;
  maxHeight?: number | `${number}%`;
  sheetStyle?: StyleProp<ViewStyle>;
  elevation?: number;
  keyboard?: "scroll" | "lift" | "none";
}>;

type Props = BottomSheetPanelProps & {
  open: boolean;
  onClose: () => void;
  embedded?: boolean;
};

function resolveMaxHeightRatio(
  maxHeight: number | `${number}%` | undefined,
): number {
  if (typeof maxHeight === "number") return 0.85;
  if (typeof maxHeight === "string" && maxHeight.endsWith("%")) {
    const parsed = Number.parseFloat(maxHeight);
    if (Number.isFinite(parsed) && parsed > 0) return parsed / 100;
  }
  return 0.85;
}

export function BottomSheetPanel({
  title,
  headerRight,
  children,
  height,
  maxHeight = "85%",
  sheetStyle,
  keyboard = "none",
}: BottomSheetPanelProps) {
  const ratioHeight = useSheetMaxHeight(resolveMaxHeightRatio(maxHeight));
  const sheetMaxHeight =
    typeof maxHeight === "number" ? maxHeight : ratioHeight;
  const fillHeight = height != null;
  const bodyMaxHeight = Math.max(120, sheetMaxHeight - 72);

  const body = (() => {
    if (keyboard === "scroll") {
      return (
        <ScrollView
          style={
            fillHeight
              ? { flex: 1, minHeight: 0 }
              : { maxHeight: bodyMaxHeight }
          }
          contentContainerStyle={{
            gap: 12,
            flexGrow: fillHeight ? 1 : undefined,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          bounces={false}
        >
          {children}
        </ScrollView>
      );
    }

    return (
      <View
        style={
          fillHeight
            ? { flex: 1, minHeight: 0, gap: 12 }
            : { gap: 12, maxHeight: bodyMaxHeight }
        }
      >
        {children}
      </View>
    );
  })();

  return (
    <View style={SHEET_WRAPPER_STYLE}>
      <View
        style={[
          {
            padding: 16,
            gap: 12,
            flexDirection: "column",
            width: "100%",
            alignSelf: "stretch",
            ...(height != null
              ? { height, maxHeight: height }
              : null),
          },
          sheetStyle,
        ]}
      >
        {(title || headerRight) && (
          <Box
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            {title ? (
              <Typography level="body-lg" weight={700}>
                {title}
              </Typography>
            ) : (
              <Box style={{ flex: 1 }} />
            )}
            {headerRight}
          </Box>
        )}

        {body}
      </View>
    </View>
  );
}

export function BottomSheet({
  open,
  onClose,
  embedded = false,
  keyboard = "none",
  ...panelProps
}: Props) {
  if (embedded) {
    return <BottomSheetPanel {...panelProps} keyboard={keyboard} />;
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      showCloseButton={false}
      enableDynamicSizing
    >
      <BottomSheetPanel {...panelProps} keyboard={keyboard} />
    </Sheet>
  );
}
