import { SpaceIcon } from "@components/Space/SpaceIcon";
import { UnicodeEmoji } from "@components/emojis/UnicodeEmoji";
import { Typography, useTheme } from "@mutualzz/ui-native";
import type { Expression } from "@stores/objects/Expression";
import type { PickerEmoji, SkinTone } from "@utils/emojis/emojiPickerData";
import { unifiedToEmoji } from "@utils/emojis/unified";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { memo, useCallback, useMemo, type ReactNode, type Ref } from "react";
import { Image, Pressable, View } from "react-native";
import {
  EMOJI_CELL_GAP,
  EMOJI_CELL_SIZE,
  EMOJI_HEADER_HEIGHT,
  EMOJI_SPACE_HEADER_HEIGHT,
  getEmojiColumnCount,
  type EmojiCell,
  type EmojiListItem,
} from "./emojiListModel";
import type { Space } from "@stores/objects/Space";

const EmojiCellButton = memo(
  ({
    cell,
    skinTone,
    onSelectEmoji,
    onSelectCustomEmoji,
    cellSize,
    imageSize,
  }: {
    cell: EmojiCell;
    skinTone: SkinTone;
    onSelectEmoji: (emoji: PickerEmoji, skinTone: SkinTone) => void;
    onSelectCustomEmoji: (expression: Expression) => void;
    cellSize: number;
    imageSize: number;
  }) => {
    const { theme } = useTheme();

    const cellStyle = useCallback(
      ({ pressed }: { pressed: boolean }) => ({
        width: cellSize,
        height: cellSize,
        borderRadius: 6,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        backgroundColor: pressed ? `${theme.colors.neutral}22` : "transparent",
      }),
      [cellSize, theme.colors.neutral],
    );

    if (cell.kind === "custom") {
      return (
        <Pressable
          onPress={() => onSelectCustomEmoji(cell.emoji)}
          style={cellStyle}
        >
          <Image
            source={{ uri: cell.emoji.url }}
            style={{
              width: imageSize,
              height: imageSize,
              borderRadius: 4,
            }}
            resizeMode="contain"
          />
        </Pressable>
      );
    }

    const unified =
      cell.unified ??
      (skinTone && cell.emoji.skinVariations?.[skinTone]?.unified) ??
      cell.emoji.unified;

    return (
      <Pressable
        onPress={() => onSelectEmoji(cell.emoji, skinTone)}
        style={cellStyle}
      >
        <UnicodeEmoji value={unifiedToEmoji(unified)} size={imageSize} />
      </Pressable>
    );
  },
);

const EmojiRow = memo(
  ({
    cells,
    skinTone,
    onSelectEmoji,
    onSelectCustomEmoji,
    cellSize,
    imageSize,
  }: {
    cells: EmojiCell[];
    skinTone: SkinTone;
    onSelectEmoji: (emoji: PickerEmoji, skinTone: SkinTone) => void;
    onSelectCustomEmoji: (expression: Expression) => void;
    cellSize: number;
    imageSize: number;
  }) => (
    <View
      style={{
        flexDirection: "row",
        gap: EMOJI_CELL_GAP,
        paddingBottom: EMOJI_CELL_GAP,
      }}
    >
      {cells.map((cell, index) => (
        <EmojiCellButton
          key={
            cell.kind === "custom"
              ? cell.emoji.id
              : `${cell.emoji.unified}-${index}`
          }
          cell={cell}
          skinTone={skinTone}
          onSelectEmoji={onSelectEmoji}
          onSelectCustomEmoji={onSelectCustomEmoji}
          cellSize={cellSize}
          imageSize={imageSize}
        />
      ))}
    </View>
  ),
);

const SectionHeader = memo(
  ({ title, space }: { title: string; space?: Space }) => {
    if (space) {
      return (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 8,
            height: EMOJI_SPACE_HEADER_HEIGHT,
          }}
        >
          <SpaceIcon space={space} size={16} />
          <Typography
            level="body-xs"
            textColor="muted"
            style={{ textTransform: "uppercase", letterSpacing: 0.5 }}
          >
            {title}
          </Typography>
        </View>
      );
    }

    return (
      <Typography
        level="body-xs"
        textColor="muted"
        style={{
          paddingHorizontal: 8,
          height: EMOJI_HEADER_HEIGHT,
          lineHeight: EMOJI_HEADER_HEIGHT,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {title}
      </Typography>
    );
  },
);

interface Props {
  items: EmojiListItem[];
  skinTone: SkinTone;
  onSelectEmoji: (emoji: PickerEmoji, skinTone: SkinTone) => void;
  onSelectCustomEmoji: (expression: Expression) => void;
  listRef?: Ref<FlashListRef<EmojiListItem>>;
  ListEmptyComponent?: ReactNode;
  contentPaddingBottom?: number;
  cellSize?: number;
  imageSize?: number;
}

export const VirtualizedEmojiList = ({
  items,
  skinTone,
  onSelectEmoji,
  onSelectCustomEmoji,
  listRef,
  ListEmptyComponent,
  contentPaddingBottom = 16,
  cellSize = EMOJI_CELL_SIZE,
  imageSize = 28,
}: Props) => {
  const renderItem = useCallback(
    ({ item }: { item: EmojiListItem }) => {
      if (item.type === "header") {
        return <SectionHeader title={item.title} space={item.space} />;
      }

      return (
        <EmojiRow
          cells={item.cells}
          skinTone={skinTone}
          onSelectEmoji={onSelectEmoji}
          onSelectCustomEmoji={onSelectCustomEmoji}
          cellSize={cellSize}
          imageSize={imageSize}
        />
      );
    },
    [cellSize, imageSize, onSelectCustomEmoji, onSelectEmoji, skinTone],
  );

  const getItemType = useCallback((item: EmojiListItem) => item.type, []);

  const overrideItemLayout = useCallback(
    (layout: { span?: number; size?: number }, item: EmojiListItem) => {
      if (item.type === "header") {
        layout.size = item.space
          ? EMOJI_SPACE_HEADER_HEIGHT
          : EMOJI_HEADER_HEIGHT;
        return;
      }

      layout.size = cellSize + EMOJI_CELL_GAP;
    },
    [cellSize],
  );

  const keyExtractor = useCallback((item: EmojiListItem) => item.id, []);

  const emptyComponent = useMemo(
    () =>
      ListEmptyComponent ? (
        <View style={{ padding: 24 }}>{ListEmptyComponent}</View>
      ) : null,
    [ListEmptyComponent],
  );

  return (
    <FlashList
      ref={listRef}
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemType={getItemType}
      overrideItemLayout={overrideItemLayout}
      extraData={`${skinTone}-${cellSize}`}
      drawDistance={cellSize * 8}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{
        paddingHorizontal: 4,
        paddingBottom: contentPaddingBottom,
      }}
      ListEmptyComponent={emptyComponent}
    />
  );
};

export { getEmojiColumnCount };
