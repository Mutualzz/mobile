import emojiData from "emojibase-data/en/data.json";
import shortcodesCldrNative from "emojibase-data/en/shortcodes/cldr-native.json";
import shortcodesCldr from "emojibase-data/en/shortcodes/cldr.json";
import shortcodesEmojiBase from "emojibase-data/en/shortcodes/emojibase.json";
import shortcodesGithub from "emojibase-data/en/shortcodes/github.json";
import shortcodesIamcal from "emojibase-data/en/shortcodes/iamcal.json";
import shortcodesJoyPixels from "emojibase-data/en/shortcodes/joypixels.json";
import { joinShortcodes, type Emoji } from "emojibase";

const shortcodes = [
    shortcodesEmojiBase,
    shortcodesJoyPixels,
    shortcodesCldrNative,
    shortcodesGithub,
    shortcodesIamcal,
    shortcodesCldr,
];

const GROUP_LABELS: Record<number, string> = {
    0: "Smileys",
    1: "People",
    2: "Animals",
    3: "Food",
    4: "Travel",
    5: "Activities",
    6: "Objects",
    7: "Symbols",
    8: "Flags",
};

export type SkinTone =
    | "1F3FB"
    | "1F3FC"
    | "1F3FD"
    | "1F3FE"
    | "1F3FF"
    | null;

export interface PickerEmoji {
    unified: string;
    name: string;
    emoji: string;
    hasSkinTones: boolean;
    skinVariations?: Record<string, { unified: string }>;
}

export interface PickerCategory {
    id: string;
    name: string;
    emojis: PickerEmoji[];
}

const rawEmojis = joinShortcodes(emojiData, shortcodes);

function toPickerEmoji(entry: Emoji): PickerEmoji {
    const skinVariations = entry.skins?.length
        ? Object.fromEntries(
              entry.skins
                  .filter((skin) => skin.hexcode !== entry.hexcode)
                  .map((skin) => {
                      const tone = skin.hexcode.split("-").pop()!;
                      return [tone, { unified: skin.hexcode.toUpperCase() }];
                  }),
          )
        : undefined;

    return {
        unified: entry.hexcode.toUpperCase(),
        name: entry.label.toLowerCase(),
        emoji: entry.emoji,
        hasSkinTones: Boolean(entry.skins?.length),
        skinVariations:
            skinVariations && Object.keys(skinVariations).length > 0
                ? skinVariations
                : undefined,
    };
}

const byGroup = new Map<number, PickerEmoji[]>();

for (const entry of rawEmojis) {
    if (entry.group == null) continue;
    const picker = toPickerEmoji(entry);
    const list = byGroup.get(entry.group) ?? [];
    list.push(picker);
    byGroup.set(entry.group, list);
}

export const PICKER_CATEGORIES: PickerCategory[] = Object.entries(GROUP_LABELS)
    .map(([groupId, name]) => ({
        id: groupId,
        name,
        emojis: byGroup.get(Number(groupId)) ?? [],
    }))
    .filter((category) => category.emojis.length > 0);

export const ALL_EMOJIS: PickerEmoji[] = PICKER_CATEGORIES.flatMap(
    (category) => category.emojis,
);

export function searchEmojis(query: string): PickerEmoji[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    return ALL_EMOJIS.filter(
        (emoji) => emoji.name.includes(q) || emoji.emoji.includes(q),
    ).slice(0, 60);
}
