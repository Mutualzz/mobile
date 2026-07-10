import { IconButton } from "@components/IconButton";
import { ProfileWidgetRenderer } from "@components/Profile/widgets/ProfileWidgetRenderer";
import { ProfileWidgetSizePill } from "@components/Profile/widgets/editor/ProfileWidgetSizePill";
import {
  clampWidgetSize,
  computePackedLayout,
  getWidgetTileHeight,
  type PackedRect,
} from "@components/Profile/widgets/profileWidget.constants";
import type { AccountStore } from "@stores/Account.store";
import type { User } from "@stores/objects/User";
import type { UserProfile } from "@stores/objects/UserProfile";
import type { APIMobileProfileBlock, ProfileBlockSize } from "@mutualzz/types";
import { resolveProfileBlockCornerRadius } from "@mutualzz/ui-core";
import { Paper } from "@mutualzz/ui-native";
import { CaretDownIcon, CaretUpIcon, XIcon } from "phosphor-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const ROW_GAP = 10;
const LONG_PRESS_MS = 350;

interface Props {
  blocks: APIMobileProfileBlock[];
  profile: UserProfile;
  user: User | AccountStore;
  editMode: boolean;
  onEnterEditMode: () => void;
  onChange: (blocks: APIMobileProfileBlock[]) => void;
  onEditContent: (block: APIMobileProfileBlock) => void;
  onDelete: (blockId: string) => void;
  onChangeSize: (blockId: string, size: ProfileBlockSize) => void;
  reorder: (
    blocks: APIMobileProfileBlock[],
    fromIndex: number,
    toIndex: number,
  ) => APIMobileProfileBlock[];
}

const rectLeftPx = (rect: PackedRect, containerWidth: number) =>
  rect.left === "50%" ? containerWidth / 2 : 0;

const rectWidthPx = (rect: PackedRect, containerWidth: number) =>
  rect.width === "50%" ? containerWidth / 2 : containerWidth;

function findTargetIndex(
  rects: PackedRect[],
  draggedIndex: number,
  centerX: number,
  centerY: number,
  containerWidth: number,
) {
  for (let i = 0; i < rects.length; i++) {
    if (i === draggedIndex) continue;
    const rect = rects[i];
    const left = rectLeftPx(rect, containerWidth);
    const width = rectWidthPx(rect, containerWidth);
    if (
      centerX >= left &&
      centerX <= left + width &&
      centerY >= rect.top &&
      centerY <= rect.top + rect.height
    ) {
      return i;
    }
  }

  let best = draggedIndex;
  let bestDist = Infinity;
  for (let i = 0; i < rects.length; i++) {
    if (i === draggedIndex) continue;
    const rect = rects[i];
    const rectCenterY = rect.top + rect.height / 2;
    const rectCenterX =
      rectLeftPx(rect, containerWidth) + rectWidthPx(rect, containerWidth) / 2;
    const dist = Math.hypot(centerX - rectCenterX, centerY - rectCenterY);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

function WidgetTileContent({
  block,
  profile,
  user,
  isDragging,
}: {
  block: APIMobileProfileBlock;
  profile: UserProfile;
  user: User | AccountStore;
  isDragging?: boolean;
}) {
  const cornerRadius = resolveProfileBlockCornerRadius(block, "mobile");

  return (
    <View
      pointerEvents="none"
      style={{
        flex: 1,
        marginHorizontal: ROW_GAP / 2,
        opacity: isDragging ? 0.9 : 1,
      }}
    >
      <Paper
        elevation={1}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: cornerRadius,
          overflow: "hidden",
        }}
      >
        <ProfileWidgetRenderer block={block} profile={profile} user={user} />
      </Paper>
    </View>
  );
}

function DraggableWidgetTile({
  block,
  index,
  rect,
  profile,
  user,
  editMode,
  size,
  onDragEnd,
  onEditContent,
  onEnterEditMode,
  onDelete,
  onChangeSize,
  onMoveUp,
  onMoveDown,
}: {
  block: APIMobileProfileBlock;
  index: number;
  rect: PackedRect;
  profile: UserProfile;
  user: User | AccountStore;
  editMode: boolean;
  size: ProfileBlockSize;
  onDragEnd: (
    index: number,
    translationX: number,
    translationY: number,
  ) => void;
  onEditContent: (block: APIMobileProfileBlock) => void;
  onEnterEditMode: () => void;
  onDelete: () => void;
  onChangeSize: (size: ProfileBlockSize) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const dragging = useSharedValue(0);

  const baseStyle: ViewStyle = {
    position: "absolute",
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(editMode)
        .onBegin(() => {
          dragging.value = 1;
        })
        .onUpdate((e) => {
          translateX.value = e.translationX;
          translateY.value = e.translationY;
        })
        .onFinalize((e) => {
          if (editMode) {
            scheduleOnRN(onDragEnd, index, e.translationX, e.translationY);
          }
          translateX.value = 0;
          translateY.value = 0;
          dragging.value = 0;
        }),
    [dragging, editMode, index, onDragEnd, translateX, translateY],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    zIndex: dragging.value > 0 ? 10 : 0,
    opacity: dragging.value > 0 ? 0.9 : 1,
  }));

  const content = (
    <>
      <WidgetTileContent block={block} profile={profile} user={user} />

      {!editMode && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => onEditContent(block)}
          onLongPress={onEnterEditMode}
          delayLongPress={LONG_PRESS_MS}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${block.type} widget`}
          accessibilityHint="Opens the widget editor. Long press to rearrange widgets."
        />
      )}

      {editMode && (
        <EditModeOverlay
          type={block.type}
          size={size}
          onDelete={onDelete}
          onChangeSize={onChangeSize}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />
      )}
    </>
  );

  if (!editMode) {
    return <View style={baseStyle}>{content}</View>;
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[baseStyle, animatedStyle]}>
        {content}
      </Animated.View>
    </GestureDetector>
  );
}

export function ProfileWidgetEditableList({
  blocks,
  profile,
  user,
  editMode,
  onEnterEditMode,
  onChange,
  onEditContent,
  onDelete,
  onChangeSize,
  reorder,
}: Props) {
  const [containerWidth, setContainerWidth] = useState(0);

  const items = blocks.map((block) => {
    const size = clampWidgetSize(block.type, block.size);
    return {
      id: block.id,
      size,
      height: getWidgetTileHeight(block.type, size),
    };
  });
  const { rects, totalHeight } = computePackedLayout(items, ROW_GAP);

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const handleDragEnd = useCallback(
    (index: number, translationX: number, translationY: number) => {
      if (containerWidth > 0) {
        const rect = rects[index];
        const centerX =
          rectLeftPx(rect, containerWidth) +
          rectWidthPx(rect, containerWidth) / 2 +
          translationX;
        const centerY = rect.top + rect.height / 2 + translationY;
        const targetIndex = findTargetIndex(
          rects,
          index,
          centerX,
          centerY,
          containerWidth,
        );

        if (targetIndex !== index) {
          onChange(reorder(blocks, index, targetIndex));
        }
      }
    },
    [blocks, containerWidth, onChange, rects, reorder],
  );

  const moveBlock = (index: number, direction: -1 | 1) => {
    const toIndex = index + direction;
    if (toIndex < 0 || toIndex >= blocks.length) return;
    onChange(reorder(blocks, index, toIndex));
  };

  return (
    <View
      style={{ width: "100%", height: totalHeight }}
      onLayout={handleLayout}
    >
      {blocks.map((block, index) => {
        const size = clampWidgetSize(block.type, block.size);
        const rect = rects[index];

        return (
          <DraggableWidgetTile
            key={block.id}
            block={block}
            index={index}
            rect={rect}
            profile={profile}
            user={user}
            editMode={editMode}
            size={size}
            onDragEnd={handleDragEnd}
            onEditContent={onEditContent}
            onEnterEditMode={onEnterEditMode}
            onDelete={() => onDelete(block.id)}
            onChangeSize={(next) => onChangeSize(block.id, next)}
            onMoveUp={index > 0 ? () => moveBlock(index, -1) : undefined}
            onMoveDown={
              index < blocks.length - 1 ? () => moveBlock(index, 1) : undefined
            }
          />
        );
      })}
    </View>
  );
}

function EditModeOverlay({
  type,
  size,
  onDelete,
  onChangeSize,
  onMoveUp,
  onMoveDown,
}: {
  type: APIMobileProfileBlock["type"];
  size: ProfileBlockSize;
  onDelete: () => void;
  onChangeSize: (size: ProfileBlockSize) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  return (
    <>
      <View
        style={{ position: "absolute", top: 6, right: 6 + ROW_GAP / 2 }}
        pointerEvents="box-none"
      >
        <ProfileWidgetSizePill
          type={type}
          size={size}
          onChange={onChangeSize}
        />
      </View>
      <View
        style={{
          position: "absolute",
          top: 6,
          left: 6 + ROW_GAP / 2,
          flexDirection: "row",
          gap: 6,
        }}
        pointerEvents="box-none"
      >
        <IconButton
          variant="solid"
          color="danger"
          accessibilityLabel="Delete widget"
          padding={4}
          onPress={onDelete}
        >
          <XIcon size={14} color="#fff" />
        </IconButton>
        <IconButton
          variant="solid"
          color="neutral"
          accessibilityLabel="Move widget up"
          disabled={!onMoveUp}
          padding={4}
          onPress={onMoveUp}
        >
          <CaretUpIcon size={14} color="#fff" />
        </IconButton>
        <IconButton
          variant="solid"
          color="neutral"
          accessibilityLabel="Move widget down"
          disabled={!onMoveDown}
          padding={4}
          onPress={onMoveDown}
        >
          <CaretDownIcon size={14} color="#fff" />
        </IconButton>
      </View>
    </>
  );
}
