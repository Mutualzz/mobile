import { KeyboardAwareView } from "@components/Keyboard/KeyboardAwareView";
import { Paper } from "@components/Paper";
import { MODAL_SHEET_WRAPPER_STYLE } from "@utils/modalSheet";
import { Box, Modal, Typography } from "@mutualzz/ui-native";
import type { PropsWithChildren, ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

type BottomSheetPanelProps = PropsWithChildren<{
  title?: string;
  headerRight?: ReactNode;
  height?: number;
  maxHeight?: number | `${number}%`;
  sheetStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
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

export function BottomSheetPanel({
  title,
  headerRight,
  children,
  height,
  maxHeight = "85%",
  sheetStyle,
  scrollable = false,
  elevation = 4,
  keyboard = "scroll",
}: BottomSheetPanelProps) {
  /** Only stretch body when the sheet has a fixed height (e.g. comments). */
  const fillHeight = height != null || scrollable;
  const boundedScroll = !fillHeight && maxHeight != null;

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
        return <View>{children}</View>;
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
            : boundedScroll
              ? { flexShrink: 1 }
              : undefined
        }
        contentContainerStyle={{
          gap: 12,
          flexGrow: fillHeight ? 1 : undefined,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {children}
      </KeyboardAwareScrollView>
    );
  })();

  return (
    <View pointerEvents="box-none" style={MODAL_SHEET_WRAPPER_STYLE}>
      <View style={{ flex: 1, justifyContent: "flex-end", width: "100%" }}>
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
                : { maxHeight }),
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
