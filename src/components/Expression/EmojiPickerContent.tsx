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
import {
    ClockIcon,
    HashIcon,
    StarIcon,
    UserIcon,
} from "phosphor-react-native";
import type { FlashListRef } from "@shopify/flash-list";
import type { EmojiListItem } from "@components/Expression/emojiListModel";
import { observer } from "mobx-react-lite";
import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, useWindowDimensions } from "react-native";

const SKIN_TONES: SkinTone[] = [
    "1F3FB",
    "1F3FC",
    "1F3FD",
    "1F3FE",
    "1F3FF",
];

interface Props {
    channel: Channel;
    onSelectEmoji: (emoji: PickerEmoji, skinTone: SkinTone) => void;
    onSelectCustomEmoji: (expression: Expression) => void;
}

export const EmojiPickerContent = observer(
    ({ channel, onSelectEmoji, onSelectCustomEmoji }: Props) => {
        const app = useAppStore();
        const { theme } = useTheme();
        const { width } = useWindowDimensions();
        const columns = getEmojiColumnCount(width);
        const listRef = useRef<FlashListRef<EmojiListItem>>(null);
        const { recents, addRecentStandard, addRecentCustom } = useRecentEmojis();

        const [search, setSearch] = useState("");
        const [skinTone, setSkinTone] = useState<SkinTone>(null);
        const [activeCategoryId, setActiveCategoryId] = useState("recent");

        const me = channel.spaceId
            ? app.spaces.get(channel.spaceId)?.members.me
            : null;
        const meId = app.account?.id ?? "";

        const canUseEmoji = useCallback(
            (emoji: Expression) =>
                canUseCustomEmoji(meId, emoji, me, channel),
            [channel, me, meId],
        );

        const myEmojis = useMemo(
            () =>
                app.expressions.emojis
                    .filter((emoji) => !emoji.spaceId)
                    .filter((emoji) => emoji.authorId === meId)
                    .filter(canUseEmoji),
            [app.expressions.emojis, canUseEmoji, meId],
        );

        const spaceEmojiGroups = useMemo(
            () =>
                app.spaces.all
                    .map((space) => ({
                        space,
                        emojis: Array.from(space.expressions.values()).filter(
                            (emoji) =>
                                emoji.type === ExpressionType.Emoji &&
                                canUseEmoji(emoji),
                        ),
                    }))
                    .filter((group) => group.emojis.length > 0),
            [app.spaces.all, canUseEmoji],
        );

        const allCustom = useMemo(
            () => [...myEmojis, ...spaceEmojiGroups.flatMap((g) => g.emojis)],
            [myEmojis, spaceEmojiGroups],
        );

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
                                (tone &&
                                    emoji.skinVariations?.[tone]?.unified) ||
                                emoji.unified;
                            return {
                                kind: "standard" as const,
                                emoji,
                                unified,
                            };
                        }

                        if (recent.type === "custom" && recent.id) {
                            const emoji = allCustom.find(
                                (entry) => entry.id === recent.id,
                            );
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
                            const emoji = allCustom.find(
                                (entry) => entry.id === id,
                            );
                            return emoji
                                ? { kind: "custom" as const, emoji }
                                : null;
                        }

                        const [unified, skinToneKey] = key.split(":");
                        const tone = (skinToneKey || null) as SkinTone;
                        const emoji = ALL_EMOJIS.find(
                            (entry) => entry.unified === unified,
                        );
                        if (!emoji) return null;
                        const resolvedUnified =
                            (tone && emoji.skinVariations?.[tone]?.unified) ||
                            emoji.unified;
                        return {
                            kind: "standard" as const,
                            emoji,
                            unified: resolvedUnified,
                        };
                    })
                    .filter(Boolean),
            [allCustom, favoriteEmojiKeys],
        );

        const toCells = useCallback(
            (
                entries: Array<
                    | { kind: "standard"; emoji: PickerEmoji; unified?: string }
                    | { kind: "custom"; emoji: Expression }
                    | null
                >,
            ): EmojiCell[] =>
                entries
                    .filter(
                        (
                            entry,
                        ): entry is
                            | { kind: "standard"; emoji: PickerEmoji; unified?: string }
                            | { kind: "custom"; emoji: Expression } =>
                            entry != null,
                    )
                    .map((entry) =>
                        entry.kind === "custom"
                            ? { kind: "custom", emoji: entry.emoji }
                            : {
                                  kind: "standard",
                                  emoji: entry.emoji,
                                  unified: entry.unified,
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
                        sectionIndexById: {} as Record<string, number>,
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
                                title: "Custom",
                                cells: customCells,
                            },
                            {
                                sectionId: "search-standard",
                                title: "Standard",
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
                        title: "Favorites",
                        cells: toCells(favoriteEmojiItems),
                    },
                    {
                        sectionId: "recent",
                        title: "Recently used",
                        cells: toCells(recentItems),
                    },
                    {
                        sectionId: "my-emojis",
                        title: "Your emojis",
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
                        title: category.name,
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
            toCells,
        ]);

        const sidebarItems = useMemo(
            () => [
                ...(favoriteEmojiItems.length > 0
                    ? [{ id: "favorites", label: "Favorites", Icon: StarIcon }]
                    : []),
                ...(recentItems.length > 0
                    ? [{ id: "recent", label: "Recent", Icon: ClockIcon }]
                    : []),
                ...(myEmojis.length > 0
                    ? [{ id: "my-emojis", label: "Yours", Icon: UserIcon }]
                    : []),
                ...spaceEmojiGroups.map(({ space }) => ({
                    id: `space-${space.id}`,
                    label: space.name,
                    space,
                })),
                ...PICKER_CATEGORIES.map((category) => ({
                    id: category.id,
                    label: category.name,
                    Icon: HashIcon,
                })),
            ],
            [
                favoriteEmojiItems.length,
                myEmojis.length,
                recentItems.length,
                spaceEmojiGroups,
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
                tone === undefined
                    ? emoji.hasSkinTones
                        ? skinTone
                        : null
                    : tone;
            addRecentStandard(emoji.unified, resolvedTone);
            onSelectEmoji(emoji, resolvedTone);
        };

        const handleSelectCustomEmoji = (emoji: Expression) => {
            addRecentCustom(emoji.id, emoji.name, emoji.url, emoji.animated);
            onSelectCustomEmoji(emoji);
        };

        const emptyLabel =
            search &&
            customSearchResults.length === 0 &&
            standardSearchResults.length === 0 ? (
                <Typography
                    level="body-sm"
                    textColor="muted"
                    style={{ textAlign: "center" }}
                >
                    No emojis found
                </Typography>
            ) : null;

        return (
            <Box style={{ flex: 1, minHeight: 0 }}>
                <Box style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
                    <Input
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search emojis…"
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
                            padding: 4,
                            borderRadius: 6,
                            borderWidth: skinTone ? 0 : 1,
                            borderColor: theme.colors.primary,
                        }}
                    >
                        <UnicodeEmoji value="👍" size={22} />
                    </Pressable>
                    {SKIN_TONES.map((tone) => (
                        <Pressable
                            key={tone}
                            onPress={() => setSkinTone(tone)}
                            style={{
                                padding: 4,
                                borderRadius: 6,
                                borderWidth: skinTone === tone ? 1 : 0,
                                borderColor: theme.colors.primary,
                            }}
                        >
                            <UnicodeEmoji
                                value={unifiedToEmoji(`1F44D-${tone}`)}
                                size={22}
                            />
                        </Pressable>
                    ))}
                </Box>

                {!search && sidebarItems.length > 0 ? (
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
                                        backgroundColor: active
                                            ? `${theme.colors.primary}22`
                                            : `${theme.colors.neutral}18`,
                                    }}
                                >
                                    {"space" in item && item.space ? (
                                        <SpaceIcon
                                            space={item.space}
                                            size={18}
                                        />
                                    ) : "Icon" in item && item.Icon ? (
                                        <item.Icon
                                            size={16}
                                            color={
                                                active
                                                    ? theme.colors.primary
                                                    : theme.typography.colors
                                                          .muted
                                            }
                                            weight="fill"
                                        />
                                    ) : null}
                                    <Typography
                                        level="body-xs"
                                        style={{
                                            color: active
                                                ? theme.colors.primary
                                                : theme.typography.colors.muted,
                                        }}
                                        numberOfLines={1}
                                    >
                                        {item.label}
                                    </Typography>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                ) : null}

                <VirtualizedEmojiList
                    listRef={listRef}
                    items={items}
                    skinTone={skinTone}
                    onSelectEmoji={handleSelectEmoji}
                    onSelectCustomEmoji={handleSelectCustomEmoji}
                    ListEmptyComponent={emptyLabel}
                />
            </Box>
        );
    },
);
