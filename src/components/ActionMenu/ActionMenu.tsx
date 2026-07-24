import { formatColor } from "@mutualzz/ui-core";
import { Typography, useTheme } from "@mutualzz/ui-native";
import {
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";

interface AnchorLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ActionMenuProps {
  align?: "start" | "end";
  sideOffset?: number;
  renderTrigger: (open: () => void) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
}

export function ActionMenu({
  align = "end",
  sideOffset = 4,
  renderTrigger,
  children,
}: ActionMenuProps) {
  const { theme } = useTheme();
  const anchorRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<AnchorLayout | null>(null);

  const close = useCallback(() => setOpen(false), []);

  const openMenu = useCallback(() => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setOpen(true);
    });
  }, []);

  const borderColor = formatColor(theme.typography.colors.muted, {
    alpha: 0.2,
    format: "hexa",
  });
  const shadowColor = formatColor(theme.typography.colors.primary, {
    alpha: 0.18,
    format: "hexa",
  });

  const screenWidth = Dimensions.get("window").width;
  const panelStyle: ViewStyle = anchor
    ? {
        position: "absolute",
        top: anchor.y + anchor.height + sideOffset,
        ...(align === "end"
          ? { right: Math.max(8, screenWidth - anchor.x - anchor.width) }
          : { left: Math.max(8, anchor.x) }),
        minWidth: 220,
        maxWidth: 300,
        borderRadius: 6,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor,
        backgroundColor: theme.colors.surface,
        paddingVertical: 2,
        overflow: "hidden",
        shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 10,
      }
    : {};

  return (
    <>
      <View ref={anchorRef} collapsable={false}>
        {renderTrigger(openMenu)}
      </View>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
        statusBarTranslucent
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <View style={panelStyle}>
            {typeof children === "function" ? children(close) : children}
          </View>
        </View>
      </Modal>
    </>
  );
}

interface ActionMenuLabelProps {
  children: string;
}

export function ActionMenuLabel({ children }: ActionMenuLabelProps) {
  return (
    <View style={{ paddingHorizontal: 10, paddingTop: 6, paddingBottom: 2 }}>
      <Typography level="body-xs" weight={700} truncate="single">
        {children}
      </Typography>
    </View>
  );
}

export function ActionMenuSeparator() {
  const { theme } = useTheme();
  const lineColor = formatColor(theme.typography.colors.muted, {
    alpha: 0.25,
    format: "hexa",
  });

  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: lineColor,
        marginVertical: 2,
        marginHorizontal: 6,
      }}
    />
  );
}
