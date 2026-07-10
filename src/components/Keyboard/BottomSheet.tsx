import { KeyboardAwareView } from "@components/Keyboard/KeyboardAwareView";
import { Paper } from "@components/Paper";
import { MODAL_SHEET_WRAPPER_STYLE } from "@utils/modalSheet";
import { Box, Modal, Typography } from "@mutualzz/ui-native";
import type { PropsWithChildren, ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

type Props = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title?: string;
  headerRight?: ReactNode;
  height?: number;
  maxHeight?: number | `${number}%`;
  sheetStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  elevation?: number;
}>;

/**
 * Bottom sheet modal with keyboard lift. Uses padding lift on the sheet shell and
 * KeyboardAwareScrollView for scrollable bodies so focused inputs stay visible.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  headerRight,
  children,
  height,
  maxHeight = "85%",
  sheetStyle,
  scrollable = false,
  elevation = 4,
}: Props) {
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
      <View pointerEvents="box-none" style={MODAL_SHEET_WRAPPER_STYLE}>
        <KeyboardAwareView style={{ justifyContent: "flex-end", width: "100%" }}>
          <Paper
            style={[
              {
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: 16,
                gap: 12,
                flexDirection: "column",
                ...(height != null ? { height, maxHeight: height } : { maxHeight }),
              },
              sheetStyle,
            ]}
            elevation={elevation}
          >
            {title || headerRight ? (
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
            ) : null}

            {scrollable ? (
              <KeyboardAwareScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ gap: 12, flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {children}
              </KeyboardAwareScrollView>
            ) : (
              <View style={{ flex: 1, minHeight: 0 }}>{children}</View>
            )}
          </Paper>
        </KeyboardAwareView>
      </View>
    </Modal>
  );
}
