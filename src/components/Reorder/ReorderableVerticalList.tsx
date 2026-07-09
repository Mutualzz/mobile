import { useTheme } from "@mutualzz/ui-native";
import { DotsSixVerticalIcon } from "phosphor-react-native";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from "react-native";
import { Gesture, GestureDetector, ScrollView } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";

export interface ReorderableItem {
  id: string;
}

type DragTarget = "handle" | "row";

interface RenderItemMeta {
  isDragging: boolean;
}

interface Props<T extends ReorderableItem> {
  items: T[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  renderItem: (item: T, index: number, meta: RenderItemMeta) => ReactNode;
  rowGap?: number;
  estimatedRowHeight?: number;
  enabled?: boolean;
  dragTarget?: DragTarget;
  isItemDraggable?: (item: T, index: number) => boolean;
  activateAfterLongPressMs?: number;
  scrollable?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

function computeTargetIndex(
  rowHeights: number[],
  rowGap: number,
  fromIndex: number,
  translationY: number,
): number {
  if (rowHeights.length === 0) return 0;

  const offsets = rowHeights.map((_, index) => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += rowHeights[i] + rowGap;
    }
    return offset;
  });

  const fromHeight = rowHeights[fromIndex] ?? 0;
  const centerY = offsets[fromIndex] + fromHeight / 2 + translationY;

  for (let i = 0; i < rowHeights.length; i++) {
    const top = offsets[i];
    const bottom = top + rowHeights[i];
    if (centerY >= top && centerY <= bottom + rowGap / 2) {
      return i;
    }
  }

  let best = fromIndex;
  let bestDistance = Infinity;
  for (let i = 0; i < rowHeights.length; i++) {
    const mid = offsets[i] + rowHeights[i] / 2;
    const distance = Math.abs(centerY - mid);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }

  return best;
}

const LONG_PRESS_DRAG_MS = 250;

export function ReorderableVerticalList<T extends ReorderableItem>({
  items,
  onReorder,
  renderItem,
  rowGap = 8,
  estimatedRowHeight = 48,
  enabled = true,
  dragTarget = "handle",
  isItemDraggable,
  activateAfterLongPressMs = LONG_PRESS_DRAG_MS,
  scrollable = false,
  contentContainerStyle,
  style,
}: Props<T>) {
  const { theme } = useTheme();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [rowHeights, setRowHeights] = useState<number[]>([]);

  const onReorderRef = useRef(onReorder);
  const rowGapRef = useRef(rowGap);

  useEffect(() => {
    onReorderRef.current = onReorder;
  }, [onReorder]);

  rowGapRef.current = rowGap;

  const heights = useMemo(
    () =>
      items.map((_, index) => rowHeights[index] ?? estimatedRowHeight),
    [estimatedRowHeight, items, rowHeights],
  );

  const heightsRef = useRef(heights);
  heightsRef.current = heights;

  const handleRowLayout = useCallback((index: number, event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    setRowHeights((prev) => {
      if (prev[index] === height) return prev;
      const next = [...prev];
      next[index] = height;
      return next;
    });
  }, []);

  const finishDrag = useCallback((fromIndex: number, translationY: number) => {
    const toIndex = computeTargetIndex(
      heightsRef.current,
      rowGapRef.current,
      fromIndex,
      translationY,
    );

    if (toIndex !== fromIndex) {
      onReorderRef.current(fromIndex, toIndex);
    }

    setDraggingId(null);
    setDragOffset(0);
  }, []);

  const handleColor = theme.typography.colors.muted;

  const rows = items.map((item, index) => {
    const itemId = String(item.id);
    const rowIndex = index;
    const isDragging = draggingId === itemId;
    const isLast = index === items.length - 1;
    const canDrag = enabled && (isItemDraggable?.(item, index) ?? true);

    const panGesture = (() => {
      let gesture = Gesture.Pan()
        .enabled(canDrag)
        .onStart(() => {
          scheduleOnRN(setDraggingId, itemId);
        })
        .onUpdate((event) => {
          scheduleOnRN(setDragOffset, event.translationY);
        })
        .onEnd((event) => {
          scheduleOnRN(finishDrag, rowIndex, event.translationY);
        });

      if (dragTarget === "row") {
        gesture = gesture.activateAfterLongPress(activateAfterLongPressMs);
      } else {
        gesture = gesture.activeOffsetY([-4, 4]).failOffsetX([-12, 12]);
      }

      return gesture;
    })();

    const handle =
      canDrag && dragTarget === "handle" ? (
        <GestureDetector gesture={panGesture}>
          <View
            accessibilityRole="button"
            accessibilityLabel="Reorder"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              justifyContent: "center",
              paddingRight: 8,
              flexShrink: 0,
            }}
          >
            <DotsSixVerticalIcon size={16} color={handleColor} weight="bold" />
          </View>
        </GestureDetector>
      ) : null;

    const rowInner = (
      <View
        style={{
          flexDirection: dragTarget === "handle" ? "row" : undefined,
          alignItems: dragTarget === "handle" ? "center" : undefined,
          minWidth: 0,
        }}
      >
        {handle}
        <View style={{ flex: dragTarget === "handle" ? 1 : undefined, minWidth: 0 }}>
          {renderItem(item, index, { isDragging })}
        </View>
      </View>
    );

    const rowBody = (
      <View
        key={itemId}
        onLayout={(event) => handleRowLayout(index, event)}
        style={{
          position: "relative",
          marginBottom: isLast ? 0 : rowGap,
          ...(isDragging ? { transform: [{ translateY: dragOffset }] } : {}),
          zIndex: isDragging ? 10 : 0,
          opacity: isDragging ? 0.92 : 1,
        }}
      >
        {canDrag && dragTarget === "row" ? (
          <GestureDetector gesture={panGesture}>{rowInner}</GestureDetector>
        ) : (
          rowInner
        )}
      </View>
    );

    return rowBody;
  });

  if (scrollable) {
    return (
      <ScrollView
        style={style}
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
      >
        {rows}
      </ScrollView>
    );
  }

  return <View style={style}>{rows}</View>;
}
