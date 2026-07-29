import { VirtualizedEmojiList } from "@components/Expression/VirtualizedEmojiList";
import {
  buildEmojiPickerList,
  buildEmojiSearchList,
  getGridColumnCount,
  type EmojiCell,
} from "@components/Expression/emojiListModel";
import { useAppStore } from "@hooks/useStores";
import { ExpressionType } from "@mutualzz/types";
import { Box, Input, Typography } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import type { Expression } from "@stores/objects/Expression";
import { canUseSticker } from "@utils/expressions";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useWindowDimensions } from "react-native";

const STICKER_CELL_SIZE = 80;
const STICKER_IMAGE_SIZE = 72;

interface Props {
  channel?: Channel | null;
  active?: boolean;
  onSelectSticker: (sticker: Expression) => void;
  /** Profile editor: show the current user's stickers without channel context. */
  profileMode?: boolean;
}

export const StickerPickerContent = observer(
  ({ channel, active = true, onSelectSticker, profileMode = false }: Props) => {
    const { t } = useTranslation("chat");
    const app = useAppStore();
    const { width } = useWindowDimensions();
    const columns = getGridColumnCount(width, STICKER_CELL_SIZE);
    const [search, setSearch] = useState("");
    const meId = app.account?.id ?? "";
    const me = channel?.spaceId
      ? app.spaces.get(channel.spaceId)?.members.me
      : null;

    const myStickers = app.expressions.stickers.filter(
      (sticker) =>
        !sticker.spaceId &&
        sticker.authorId === meId &&
        (profileMode || canUseSticker(meId, sticker, me, channel)),
    );

    const spaceStickerGroups = app.spaces.all
      .map((space) => ({
        space,
        stickers: Array.from(space.expressions.values()).filter(
          (expression) =>
            expression.type === ExpressionType.Sticker &&
            (profileMode ||
              canUseSticker(meId, expression, me, channel)),
        ),
      }))
      .filter((group) => group.stickers.length > 0);

    const allStickers = [
      ...myStickers,
      ...spaceStickerGroups.flatMap((group) => group.stickers),
    ];

    const searchResults = search.trim()
      ? allStickers.filter((sticker) =>
          sticker.name.toLowerCase().includes(search.toLowerCase().trim()),
        )
      : [];

    const { items } = useMemo(() => {
      const toCells = (stickers: Expression[]): EmojiCell[] =>
        stickers.map((sticker) => ({
          kind: "custom",
          emoji: sticker,
        }));

      if (search.trim()) {
        return buildEmojiSearchList(toCells(searchResults), columns);
      }

      return buildEmojiPickerList(
        [
          {
            sectionId: "my-stickers",
            title: t("picker.yourStickers"),
            cells: toCells(myStickers),
          },
          ...spaceStickerGroups.map(({ space, stickers }) => ({
            sectionId: `space-${space.id}`,
            title: space.name,
            space,
            cells: toCells(stickers),
          })),
        ],
        columns,
      );
    }, [columns, myStickers, search.trim(), searchResults, spaceStickerGroups, t]);

    const emptyLabel =
      allStickers.length === 0 && !search.trim() ? (
        <Typography
          level="body-sm"
          textColor="muted"
          style={{ textAlign: "center" }}
        >
          {t("picker.emptyStickers")}
        </Typography>
      ) : search.trim() && searchResults.length === 0 ? (
        <Typography
          level="body-sm"
          textColor="muted"
          style={{ textAlign: "center" }}
        >
          {t("picker.noResults")}
        </Typography>
      ) : null;

    return (
      <Box style={{ flex: 1, minHeight: 0 }}>
        <Box style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder={t("picker.searchStickers")}
            variant="soft"
            color="neutral"
            style={{ borderRadius: 8 }}
          />
        </Box>

        <VirtualizedEmojiList
          items={items}
          skinTone={null}
          onSelectEmoji={() => {
            return;
          }}
          onSelectCustomEmoji={onSelectSticker}
          ListEmptyComponent={emptyLabel}
          cellSize={STICKER_CELL_SIZE}
          imageSize={STICKER_IMAGE_SIZE}
        />
      </Box>
    );
  },
);
