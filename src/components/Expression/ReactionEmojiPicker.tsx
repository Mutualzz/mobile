import { UnicodeEmoji } from "@components/emojis/UnicodeEmoji";
import { Paper } from "@components/Paper";
import { IconButton } from "@components/IconButton";
import { VirtualizedEmojiList } from "@components/Expression/VirtualizedEmojiList";
import {
    buildEmojiPickerList,
    buildEmojiSearchList,
    getEmojiColumnCount,
    type EmojiCell,
} from "@components/Expression/emojiListModel";
import { XIcon } from "phosphor-react-native";
import { useAppStore } from "@hooks/useStores";
import { Box, Input, Typography, useTheme } from "@mutualzz/ui-native";
import type { Expression } from "@stores/objects/Expression";
import {
    PICKER_CATEGORIES,
    searchEmojis,
    type PickerEmoji,
    type SkinTone,
} from "@utils/emojis/emojiPickerData";
import { unifiedToEmoji } from "@utils/emojis/unified";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    useWindowDimensions,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
    visible: boolean;
    onClose: () => void;
    onSelectEmoji: (emoji: PickerEmoji, skinTone: SkinTone) => void;
    onSelectCustomEmoji: (expression: Expression) => void;
}

const SKIN_TONES: SkinTone[] = [
    "1F3FB",
    "1F3FC",
    "1F3FD",
    "1F3FE",
    "1F3FF",
];

export const ReactionEmojiPicker = observer(
    ({ visible, onClose, onSelectEmoji, onSelectCustomEmoji }: Props) => {
        const app = useAppStore();
        const { theme } = useTheme();
        const insets = useSafeAreaInsets();
        const { height, width } = useWindowDimensions();
        const columns = getEmojiColumnCount(width);
        const [query, setQuery] = useState("");
        const [skinTone, setSkinTone] = useState<SkinTone>(null);

        const customEmojis = app.expressions.emojis;
        const searchResults = useMemo(
            () => (query.trim() ? searchEmojis(query) : null),
            [query],
        );

        const { items } = useMemo(() => {
            if (searchResults) {
                if (searchResults.length === 0) {
                    return { items: [] };
                }

                const cells: EmojiCell[] = searchResults.map((emoji) => ({
                    kind: "standard",
                    emoji,
                }));
                return buildEmojiSearchList(cells, columns);
            }

            const sections = [
                ...(customEmojis.length > 0
                    ? [
                          {
                              sectionId: "custom",
                              title: "Custom",
                              cells: customEmojis.map((emoji) => ({
                                  kind: "custom" as const,
                                  emoji,
                              })),
                          },
                      ]
                    : []),
                ...PICKER_CATEGORIES.map((category) => ({
                    sectionId: category.id,
                    title: category.name,
                    cells: category.emojis.map((emoji) => ({
                        kind: "standard" as const,
                        emoji,
                    })),
                })),
            ];

            return buildEmojiPickerList(sections, columns);
        }, [columns, customEmojis, searchResults]);

        const handleSelectEmoji = (emoji: PickerEmoji, tone: SkinTone) => {
            onSelectEmoji(emoji, tone);
            onClose();
        };

        const handleSelectCustomEmoji = (expression: Expression) => {
            onSelectCustomEmoji(expression);
            onClose();
        };

        const emptyLabel =
            searchResults && searchResults.length === 0 ? (
                <Typography
                    level="body-sm"
                    textColor="muted"
                    style={{ textAlign: "center" }}
                >
                    No emojis found
                </Typography>
            ) : null;

        return (
            <Modal
                visible={visible}
                transparent
                animationType="slide"
                onRequestClose={onClose}
            >
                <Pressable
                    style={{
                        flex: 1,
                        justifyContent: "flex-end",
                        backgroundColor: "rgba(0, 0, 0, 0.4)",
                    }}
                    onPress={onClose}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : undefined}
                    >
                        <View onStartShouldSetResponder={() => true}>
                            <Paper
                                elevation={app.settings?.preferEmbossed ? 5 : 2}
                                style={{
                                    height: height * 0.7,
                                    borderTopLeftRadius: 16,
                                    borderTopRightRadius: 16,
                                    paddingTop: 12,
                                    paddingBottom: insets.bottom + 12,
                                }}
                            >
                                <Box
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        paddingHorizontal: 16,
                                        paddingBottom: 12,
                                        gap: 8,
                                    }}
                                >
                                    <Typography
                                        level="body-md"
                                        weight="bold"
                                        style={{ flex: 1 }}
                                    >
                                        Add Reaction
                                    </Typography>
                                    <IconButton
                                        padding={6}
                                        color="neutral"
                                        onPress={onClose}
                                    >
                                        <XIcon size={20} />
                                    </IconButton>
                                </Box>

                                <Box
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingBottom: 8,
                                    }}
                                >
                                    <Input
                                        value={query}
                                        onChangeText={setQuery}
                                        placeholder="Search emojis"
                                    />
                                </Box>

                                <Box
                                    style={{
                                        flexDirection: "row",
                                        paddingHorizontal: 16,
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
                                                borderWidth:
                                                    skinTone === tone ? 1 : 0,
                                                borderColor:
                                                    theme.colors.primary,
                                            }}
                                        >
                                            <UnicodeEmoji
                                                value={unifiedToEmoji(
                                                    `1F44D-${tone}`,
                                                )}
                                                size={22}
                                            />
                                        </Pressable>
                                    ))}
                                </Box>

                                <Box style={{ flex: 1, minHeight: 0 }}>
                                    <VirtualizedEmojiList
                                        items={items}
                                        skinTone={skinTone}
                                        onSelectEmoji={handleSelectEmoji}
                                        onSelectCustomEmoji={
                                            handleSelectCustomEmoji
                                        }
                                        ListEmptyComponent={emptyLabel}
                                    />
                                </Box>
                            </Paper>
                        </View>
                    </KeyboardAvoidingView>
                </Pressable>
            </Modal>
        );
    },
);
