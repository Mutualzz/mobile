import type { Expression } from "@stores/objects/Expression";
import type { Space } from "@stores/objects/Space";
import type { PickerEmoji, SkinTone } from "@utils/emojis/emojiPickerData";

export const EMOJI_CELL_SIZE = 34;
export const EMOJI_HEADER_HEIGHT = 24;
export const EMOJI_SPACE_HEADER_HEIGHT = 28;
export const EMOJI_CELL_GAP = 2;

export type EmojiCell =
  | { kind: "standard"; emoji: PickerEmoji; unified?: string; skinTone?: SkinTone }
  | { kind: "custom"; emoji: Expression };

export interface EmojiListHeader {
  type: "header";
  id: string;
  sectionId: string;
  title: string;
  space?: Space;
}

export interface EmojiListRow {
  type: "row";
  id: string;
  cells: EmojiCell[];
}

export type EmojiListItem = EmojiListHeader | EmojiListRow;

export function getGridColumnCount(width: number, cellSize: number) {
  const available = width - 8 + EMOJI_CELL_GAP;
  return Math.max(3, Math.floor(available / (cellSize + EMOJI_CELL_GAP)));
}

export function getEmojiColumnCount(width: number) {
  return getGridColumnCount(width, EMOJI_CELL_SIZE);
}

export function chunkEmojiCells(
  cells: EmojiCell[],
  columns: number,
  rowKeyPrefix: string,
): EmojiListRow[] {
  const rows: EmojiListRow[] = [];

  for (let index = 0; index < cells.length; index += columns) {
    rows.push({
      type: "row",
      id: `${rowKeyPrefix}-row-${index}`,
      cells: cells.slice(index, index + columns),
    });
  }

  return rows;
}

export function buildEmojiSection(
  sectionId: string,
  title: string,
  cells: EmojiCell[],
  columns: number,
  space?: Space,
): EmojiListItem[] {
  if (cells.length === 0) return [];

  return [
    {
      type: "header",
      id: `header-${sectionId}`,
      sectionId,
      title,
      space,
    },
    ...chunkEmojiCells(cells, columns, sectionId),
  ];
}

export function buildEmojiPickerList(
  sections: {
    sectionId: string;
    title: string;
    cells: EmojiCell[];
    space?: Space;
  }[],
  columns: number,
) {
  const items: EmojiListItem[] = [];
  const sectionIndexById: Record<string, number> = {};

  for (const section of sections) {
    if (section.cells.length === 0) continue;

    sectionIndexById[section.sectionId] = items.length;
    items.push(
      ...buildEmojiSection(
        section.sectionId,
        section.title,
        section.cells,
        columns,
        section.space,
      ),
    );
  }

  return { items, sectionIndexById };
}

export function buildEmojiSearchList(cells: EmojiCell[], columns: number) {
  if (cells.length === 0) {
    return {
      items: [] as EmojiListItem[],
      sectionIndexById: {} as Record<string, number>,
    };
  }

  const items = chunkEmojiCells(cells, columns, "search");
  return { items, sectionIndexById: {} as Record<string, number> };
}
