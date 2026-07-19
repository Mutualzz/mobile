import { SpaceIcon } from "@components/Space/SpaceIcon";
import { UnicodeEmoji } from "@components/emojis/UnicodeEmoji";
import { VirtualizedEmojiList } from "@components/Expression/VirtualizedEmojiList";
import {
  buildEmojiPickerList,
  buildEmojiSearchList,
  getEmojiColumnCount,
  type EmojiCell,
} from "@components/Expression/emojiListModel";
import { useRecentEmojis } from "@hooks/useRecentEmojis";
import { useAppStore } from "@hooks/useStores";
import { ExpressionType } from "@mutualzz/types";
import { Box, Input, Typography, useTheme } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import type { Expression } from "@stores/objects/Expression";
import { canUseCustomEmoji } from "@utils/expressions";
import {
  ALL_EMOJIS,
  PICKER_CATEGORIES,
  searchEmojis,
  type PickerEmoji,
  type SkinTone,
} from "@utils/emojis/emojiPickerData";
import { unifiedToEmoji } from "@utils/emojis/unified";
import { useScaledSquareSize } from "@utils/accessibilityLayout";
import { ClockIcon, HashIcon, StarIcon, UserIcon } from "phosphor-react-native";
import type { FlashListRef } from "@shopify/flash-list";
import type { EmojiListItem } from "@components/Expression/emojiListModel";
import { pickerCategoryKeys } from "@mutualzz/i18n";
import { observer } from "mobx-react-lite";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, useWindowDimensions } from "react-native";

const SKIN_TONES: SkinTone[] = ["1F3FB", "1F3FC", "1F3FD", "1F3FE", "1F3FF"];

const categoryLabel = (
  id: string,
  t: (key: string) => string,
  fallback: string,
) => {
  const key =
    pickerCategoryKeys[id as keyof typeof pickerCategoryKeys] ??
    pickerCategoryKeys[fallback as keyof typeof pickerCategoryKeys];
  return key ? t(key) : fallback;
};

interface Props {
  channel?: Channel | null;
  onSelectEmoji: (emoji: PickerEmoji, skinTone: SkinTone) => void;
  onSelectCustomEmoji: (expression: Expression) => void;
}

export const EmojiPickerContent = observer(
  ({ channel, onSelectEmoji, onSelectCustomEmoji }: Props) => {
    const { t } = useTranslation("chat");
    const app = useAppStore();
    const { theme } = useTheme();
    const { width } = useWindowDimensions();
    const skinToneButtonSize = useScaledSquareSize(28);
    const columns = getEmojiColumnCount(width);
    const listRef = useRef<FlashListRef<EmojiListItem>>(null);
    const { recents, addRecentStandard, addRecentCustom } = useRecentEmojis();

    const [search, setSearch] = useState("");
    const [skinTone, setSkinTone] = useState<SkinTone>(null);
    const [activeCategoryId, setActiveCategoryId] = useState("recent");

    const me = channel?.spaceId
      ? app.spaces.get(channel.spaceId)?.members.me
      : null;
    const meId = app.account?.id ?? "";

    const canUseEmoji = useCallback(
      (emoji: Expression) =>
        canUseCustomEmoji(
          meId,
          emoji,
          me,
          channel,
          app.spaces.all.map((space) => space.id),
        ),
      [app.spaces.all, channel, me, meId],
    );

    const myEmojis = app.expressions.emojis
      .filter((emoji) => !emoji.spaceId)
      .filter((emoji) => emoji.authorId === meId)
      .filter(canUseEmoji);

    const spaceEmojiGroups = app.spaces.all
      .map((space) => ({
        space,
        emojis: Array.from(space.expressions.values()).filter(
          (emoji) => emoji.type === ExpressionType.Emoji && canUseEmoji(emoji),
        ),
      }))
      .filter((group) => group.emojis.length > 0);

    const allCustom = [
      ...myEmojis,
      ...spaceEmojiGroups.flatMap((g) => g.emojis),
    ];

    const customSearchResults = search
      ? allCustom.filter((emoji) =>
          emoji.name.toLowerCase().includes(search.toLowerCase().trim()),
        )
      : [];

    const standardSearchResults = search ? searchEmojis(search) : [];

    const recentItems = useMemo(
      () =>
        recents
          .map((recent) => {
            if (recent.type === "standard" && recent.unified) {
              const emoji = ALL_EMOJIS.find(
                (entry) => entry.unified === recent.unified,
              );
              if (!emoji) return null;
              const tone = (recent.skinTone ?? null) as SkinTone;
              const unified =
                (tone && emoji.skinVariations?.[tone]?.unified) ||
                emoji.unified;
              return {
                kind: "standard" as const,
                emoji,
                unified,
                skinTone: tone,
              };
            }

            if (recent.type === "custom" && recent.id) {
              const emoji = allCustom.find((entry) => entry.id === recent.id);
              if (emoji) {
                return { kind: "custom" as const, emoji };
              }
            }

            return null;
          })
          .filter(Boolean),
      [allCustom, recents],
    );

    const favoriteEmojiKeys = app.settings?.favoriteEmojis ?? [];
    const favoriteEmojiItems = useMemo(
      () =>
        favoriteEmojiKeys
          .map((key) => {
            if (key.startsWith("custom:")) {
              const id = key.slice(7);
              const emoji = allCustom.find((entry) => entry.id === id);
              return emoji ? { kind: "custom" as const, emoji } : null;
            }

            const [unified, skinToneKey] = key.split(":");
            const tone = (skinToneKey || null) as SkinTone;
            const emoji = ALL_EMOJIS.find((entry) => entry.unified === unified);
            if (!emoji) return null;
            const resolvedUnified =
              (tone && emoji.skinVariations?.[tone]?.unified) || emoji.unified;
            return {
              kind: "standard" as const,
              emoji,
              unified: resolvedUnified,
              skinTone: tone,
            };
          })
          .filter(Boolean),
      [allCustom, favoriteEmojiKeys],
    );

    const toCells = useCallback(
      (
        entries: (
          | {
              kind: "standard";
              emoji: PickerEmoji;
              unified?: string;
              skinTone?: SkinTone;
            }
          | { kind: "custom"; emoji: Expression }
          | null
        )[],
      ): EmojiCell[] =>
        entries
          .filter(
            (
              entry,
            ): entry is
              | {
                  kind: "standard";
                  emoji: PickerEmoji;
                  unified?: string;
                  skinTone?: SkinTone;
                }
              | { kind: "custom"; emoji: Expression } => entry != null,
          )
          .map((entry) =>
            entry.kind === "custom"
              ? { kind: "custom", emoji: entry.emoji }
              : {
                  kind: "standard",
                  emoji: entry.emoji,
                  unified: entry.unified,
                  skinTone: entry.skinTone,
                },
          ),
      [],
    );

    const { items, sectionIndexById } = useMemo(() => {
      if (search) {
        const searchCells: EmojiCell[] = [
          ...customSearchResults.map((emoji) => ({
            kind: "custom" as const,
            emoji,
          })),
          ...standardSearchResults.map((emoji) => ({
            kind: "standard" as const,
            emoji,
          })),
        ];

        if (searchCells.length === 0) {
          return {
            items: [] as EmojiListItem[],
            sectionIndexById: {},
          };
        }

        const customCells = customSearchResults.map((emoji) => ({
          kind: "custom" as const,
          emoji,
        }));
        const standardCells = standardSearchResults.map((emoji) => ({
          kind: "standard" as const,
          emoji,
        }));

        if (customCells.length > 0 && standardCells.length > 0) {
          return buildEmojiPickerList(
            [
              {
                sectionId: "search-custom",
                title: t("picker.custom"),
                cells: customCells,
              },
              {
                sectionId: "search-standard",
                title: t("picker.standard"),
                cells: standardCells,
              },
            ],
            columns,
          );
        }

        return buildEmojiSearchList(searchCells, columns);
      }

      return buildEmojiPickerList(
        [
          {
            sectionId: "favorites",
            title: t("picker.favorites"),
            cells: toCells(favoriteEmojiItems),
          },
          {
            sectionId: "recent",
            title: t("picker.recentlyUsed"),
            cells: toCells(recentItems),
          },
          {
            sectionId: "my-emojis",
            title: t("picker.yourEmojis"),
            cells: myEmojis.map((emoji) => ({
              kind: "custom" as const,
              emoji,
            })),
          },
          ...spaceEmojiGroups.map(({ space, emojis }) => ({
            sectionId: `space-${space.id}`,
            title: space.name,
            space,
            cells: emojis.map((emoji) => ({
              kind: "custom" as const,
              emoji,
            })),
          })),
          ...PICKER_CATEGORIES.map((category) => ({
            sectionId: category.id,
            title: categoryLabel(category.id, t, category.name),
            cells: category.emojis.map((emoji) => ({
              kind: "standard" as const,
              emoji,
            })),
          })),
        ],
        columns,
      );
    }, [
      columns,
      customSearchResults,
      favoriteEmojiItems,
      myEmojis,
      recentItems,
      search,
      spaceEmojiGroups,
      standardSearchResults,
      t,
      toCells,
    ]);

    const sidebarItems = useMemo(
      () => [
        ...(favoriteEmojiItems.length > 0
          ? [{ id: "favorites", label: t("picker.favorites"), Icon: StarIcon }]
          : []),
        ...(recentItems.length > 0
          ? [{ id: "recent", label: t("picker.recent"), Icon: ClockIcon }]
          : []),
        ...(myEmojis.length > 0
          ? [{ id: "my-emojis", label: t("picker.yours"), Icon: UserIcon }]
          : []),
        ...spaceEmojiGroups.map(({ space }) => ({
          id: `space-${space.id}`,
          label: space.name,
          space,
        })),
        ...PICKER_CATEGORIES.map((category) => ({
          id: category.id,
          label: categoryLabel(category.id, t, category.name),
          Icon: HashIcon,
        })),
      ],
      [
        favoriteEmojiItems.length,
        myEmojis.length,
        recentItems.length,
        spaceEmojiGroups,
        t,
      ],
    );

    const scrollToCategory = (categoryId: string) => {
      setSearch("");
      setActiveCategoryId(categoryId);
      const index = sectionIndexById[categoryId];
      if (index != null) {
        listRef.current?.scrollToIndex({ index, animated: true });
      }
    };

    const handleSelectEmoji = (emoji: PickerEmoji, tone?: SkinTone) => {
      const resolvedTone =
        tone === undefined ? (emoji.hasSkinTones ? skinTone : null) : tone;
      addRecentStandard(emoji.unified, resolvedTone);
      onSelectEmoji(emoji, resolvedTone);
    };

    const handleSelectCustomEmoji = (emoji: Expression) => {
      addRecentCustom(emoji.id, emoji.name, emoji.url, emoji.animated);
      onSelectCustomEmoji(emoji);
    };

    return (
      <Box style={{ flex: 1, minHeight: 0 }}>
        <Box style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder={t("picker.searchEmojis")}
            variant="soft"
            color="neutral"
            style={{ borderRadius: 8 }}
          />
        </Box>

        <Box
          style={{
            flexDirection: "row",
            paddingHorizontal: 12,
            paddingBottom: 8,
            gap: 4,
          }}
        >
          <Pressable
            onPress={() => setSkinTone(null)}
            style={{
              width: skinToneButtonSize,
              height: skinToneButtonSize,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
              borderWidth: 2,
              borderColor: skinTone ? "transparent" : theme.colors.primary,
            }}
          >
            <UnicodeEmoji value="👍" size={20} />
          </Pressable>
          {SKIN_TONES.map((tone) => (
            <Pressable
              key={tone}
              onPress={() => setSkinTone(tone)}
              style={{
                width: skinToneButtonSize,
                height: skinToneButtonSize,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 6,
                borderWidth: 2,
                borderColor:
                  skinTone === tone ? theme.colors.primary : "transparent",
              }}
            >
              <UnicodeEmoji value={unifiedToEmoji(`1F44D-${tone}`)} size={20} />
            </Pressable>
          ))}
        </Box>

        {search && (
          <Typography
            level="body-xs"
            textColor="muted"
            style={{ paddingHorizontal: 12, paddingBottom: 8 }}
          >
            {customSearchResults.length + standardSearchResults.length === 0
              ? t("picker.noResults")
              : t("picker.results", {
                  count:
                    customSearchResults.length + standardSearchResults.length,
                })}
          </Typography>
        )}

        {!search && sidebarItems.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 12,
              paddingBottom: 8,
              gap: 6,
            }}
            style={{ flexGrow: 0 }}
          >
            {sidebarItems.map((item) => {
              const active = activeCategoryId === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => scrollToCategory(item.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: active ? 2 : 0,
                    borderColor: theme.colors.primary,
                    backgroundColor: active
                      ? `${theme.colors.primary}22`
                      : `${theme.colors.neutral}18`,
                  }}
                >
                  {"space" in item && item.space ? (
                    <SpaceIcon space={item.space} size={18} />
                  ) : (
                    "Icon" in item &&
                    item.Icon && (
                      <item.Icon
                        size={16}
                        color={
                          active
                            ? theme.colors.primary
                            : theme.typography.colors.muted
                        }
                        weight="fill"
                      />
                    )
                  )}
                  <Typography
                    level="body-xs"
                    style={{
                      color: active
                        ? theme.colors.primary
                        : theme.typography.colors.muted,
                    }}
                    truncate="single"
                  >
                    {item.label}
                  </Typography>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <VirtualizedEmojiList
          listRef={listRef}
          items={items}
          skinTone={skinTone}
          onSelectEmoji={handleSelectEmoji}
          onSelectCustomEmoji={handleSelectCustomEmoji}
        />
      </Box>
    );
  },
);
