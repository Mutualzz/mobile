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
import { Paper } from "@mutualzz/ui-native";
import { CaretDownIcon, CaretUpIcon, XIcon } from "phosphor-react-native";
import { useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
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
): number {
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
    const rectCenterX = rectLeftPx(rect, containerWidth) + rectWidthPx(rect, containerWidth) / 2;
    const dist = Math.hypot(centerX - rectCenterX, centerY - rectCenterY);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
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
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [containerWidth, setContainerWidth] = useState(0);

  const items = blocks.map((block) => {
    const size = clampWidgetSize(block.type, block.size);
    return { id: block.id, size, height: getWidgetTileHeight(block.type, size) };
  });
  const { rects, totalHeight } = computePackedLayout(items, ROW_GAP);

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const handleDragEnd = (index: number, translationX: number, translationY: number) => {
    if (containerWidth > 0) {
      const rect = rects[index];
      const centerX =
        rectLeftPx(rect, containerWidth) + rectWidthPx(rect, containerWidth) / 2 + translationX;
      const centerY = rect.top + rect.height / 2 + translationY;
      const targetIndex = findTargetIndex(rects, index, centerX, centerY, containerWidth);

      if (targetIndex !== index) {
        onChange(reorder(blocks, index, targetIndex));
      }
    }

    setDraggingId(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const toIndex = index + direction;
    if (toIndex < 0 || toIndex >= blocks.length) return;
    onChange(reorder(blocks, index, toIndex));
  };

  return (
    <View style={{ width: "100%", height: totalHeight }} onLayout={handleLayout}>
      {blocks.map((block, index) => {
        const size = clampWidgetSize(block.type, block.size);
        const rect = rects[index];
        const isDragging = draggingId === block.id;

        const tapGesture = Gesture.Tap()
          .maxDuration(LONG_PRESS_MS - 1)
          .onEnd(() => {
            scheduleOnRN(onEditContent, block);
          });

        const longPressGesture = Gesture.LongPress()
          .minDuration(LONG_PRESS_MS)
          .onStart(() => {
            scheduleOnRN(onEnterEditMode);
          });

        const panGesture = Gesture.Pan()
          .activateAfterLongPress(LONG_PRESS_MS)
          .onStart(() => {
            scheduleOnRN(setDraggingId, block.id);
          })
          .onUpdate((e) => {
            scheduleOnRN(setDragOffset, { x: e.translationX, y: e.translationY });
          })
          .onEnd((e) => {
            scheduleOnRN(handleDragEnd, index, e.translationX, e.translationY);
          });

        const dragGesture = Gesture.Simultaneous(longPressGesture, panGesture);
        const gesture = Gesture.Exclusive(dragGesture, tapGesture);

        return (
          <GestureDetector key={block.id} gesture={gesture}>
            <View
              style={{
                position: "absolute",
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
                transform: isDragging
                  ? [{ translateX: dragOffset.x }, { translateY: dragOffset.y }]
                  : undefined,
                zIndex: isDragging ? 10 : 0,
              }}
            >
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
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  <ProfileWidgetRenderer block={block} profile={profile} user={user} />
                </Paper>
              </View>

              {editMode ? (
                <EditModeOverlay
                  type={block.type}
                  size={size}
                  onDelete={() => onDelete(block.id)}
                  onChangeSize={(next) => onChangeSize(block.id, next)}
                  onMoveUp={index > 0 ? () => moveBlock(index, -1) : undefined}
                  onMoveDown={
                    index < blocks.length - 1 ? () => moveBlock(index, 1) : undefined
                  }
                />
              ) : null}
            </View>
          </GestureDetector>
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
      <View style={{ position: "absolute", top: 6, right: 6 + ROW_GAP / 2 }} pointerEvents="box-none">
        <ProfileWidgetSizePill type={type} size={size} onChange={onChangeSize} />
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
