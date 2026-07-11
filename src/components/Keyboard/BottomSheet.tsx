import { KeyboardAwareView } from "@components/Keyboard/KeyboardAwareView";
import { Paper } from "@components/Paper";
import {
  MODAL_SHEET_WRAPPER_STYLE,
  useModalSheetMaxHeight,
} from "@utils/modalSheet";
import { Box, Modal, Typography } from "@mutualzz/ui-native";
import type { PropsWithChildren, ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

type BottomSheetPanelProps = PropsWithChildren<{
  title?: string;
  headerRight?: ReactNode;
  /** Fixed pixel height — only then does the body fill (e.g. comments). */
  height?: number;
  maxHeight?: number | `${number}%`;
  sheetStyle?: StyleProp<ViewStyle>;
  elevation?: number;
  /**
   * - `scroll` — form fields in a KeyboardAwareScrollView (default)
   * - `lift` — whole sheet lifts once (lists / mixed content)
   * - `none` — child handles keyboard (KeyboardComposer)
   */
  keyboard?: "scroll" | "lift" | "none";
}>;

type Props = BottomSheetPanelProps & {
  open: boolean;
  onClose: () => void;
  /** Panel only — parent Modal (e.g. ModalRoot) handles presentation. */
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
  elevation = 4,
  keyboard = "scroll",
}: BottomSheetPanelProps) {
  const ratioHeight = useModalSheetMaxHeight(resolveMaxHeightRatio(maxHeight));
  const sheetMaxHeight =
    typeof maxHeight === "number" ? maxHeight : ratioHeight;
  // Only fixed-height sheets fill. Content sheets size to children — never
  // flex:1 the scroll body or it collapses to a thin strip.
  const fillHeight = height != null;
  const bodyMaxHeight = Math.max(120, sheetMaxHeight - 72);

  const body = (() => {
    if (keyboard === "none") {
      return (
        <View style={fillHeight ? { flex: 1, minHeight: 0 } : undefined}>
          {children}
        </View>
      );
    }

    if (keyboard === "lift") {
      if (!fillHeight) {
        return (
          <View style={{ gap: 12, maxHeight: bodyMaxHeight }}>{children}</View>
        );
      }

      return (
        <KeyboardAwareView style={{ flex: 1, minHeight: 0 }}>
          <View style={{ flex: 1, minHeight: 0 }}>{children}</View>
        </KeyboardAwareView>
      );
    }

    return (
      <KeyboardAwareScrollView
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
      </KeyboardAwareScrollView>
    );
  })();

  return (
    <View pointerEvents="box-none" style={MODAL_SHEET_WRAPPER_STYLE}>
      <Paper
        style={[
          {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 16,
            gap: 12,
            flexDirection: "column",
            width: "100%",
            alignSelf: "stretch",
            ...(height != null
              ? { height, maxHeight: height }
              : { maxHeight: sheetMaxHeight }),
          },
          sheetStyle,
        ]}
        elevation={elevation}
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
      </Paper>
    </View>
  );
}

export function BottomSheet({
  open,
  onClose,
  embedded = false,
  ...panelProps
}: Props) {
  if (embedded) {
    return <BottomSheetPanel {...panelProps} />;
  }

  return (
    <Modal
      open={open}
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
      <BottomSheetPanel {...panelProps} />
    </Modal>
  );
}
