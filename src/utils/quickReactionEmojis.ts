import type { RecentEmoji } from "@hooks/useRecentEmojis";
import type { APIMessageReactionEmoji } from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import type { Expression } from "@stores/objects/Expression";
import {
    buildUnifiedWithSkinTone,
    unifiedToEmoji,
} from "@utils/emojis/unified";
import { expressionToReactionEmoji } from "@utils/reactions";

export type QuickReactionItem =
    | {
          key: string;
          kind: "standard";
          title: string;
          unicode: string;
          toReaction: () => APIMessageReactionEmoji;
      }
    | {
          key: string;
          kind: "custom";
          title: string;
          url: string;
          expression: Expression;
          toReaction: () => APIMessageReactionEmoji;
      };

const resolveFavoriteKey = (
    key: string,
    app: AppStore,
): QuickReactionItem | null => {
    if (key.startsWith("custom:")) {
        const id = key.slice(7);
        const expression = app.expressions.get(id);
        if (!expression) return null;

        return {
            key: `custom:${id}`,
            kind: "custom",
            expression,
            title: expression.name,
            url: expression.url,
            toReaction: () => expressionToReactionEmoji(expression),
        };
    }

    const [unified, skinTone] = key.split(":");
    if (!unified) return null;

    const fullUnified = buildUnifiedWithSkinTone(unified, skinTone || null);
    const unicode = unifiedToEmoji(fullUnified);

    return {
        key,
        kind: "standard",
        title: unicode,
        unicode,
        toReaction: () => ({ type: "unicode", value: unicode }),
    };
};

const resolveRecent = (
    recent: RecentEmoji,
    app: AppStore,
): QuickReactionItem | null => {
    if (recent.type === "standard" && recent.unified) {
        const fullUnified = buildUnifiedWithSkinTone(
            recent.unified,
            recent.skinTone ?? null,
        );
        const unicode = unifiedToEmoji(fullUnified);
        const key = `${recent.unified}:${recent.skinTone ?? ""}`;

        return {
            key,
            kind: "standard",
            title: unicode,
            unicode,
            toReaction: () => ({ type: "unicode", value: unicode }),
        };
    }

    if (recent.type === "custom" && recent.id) {
        const expression = app.expressions.get(recent.id);
        if (!expression) return null;

        return {
            key: `custom:${recent.id}`,
            kind: "custom",
            expression,
            title: expression.name,
            url: expression.url,
            toReaction: () => expressionToReactionEmoji(expression),
        };
    }

    return null;
};

export const getQuickReactionItems = (
    app: AppStore,
    recents: RecentEmoji[],
    limit = 3,
): QuickReactionItem[] => {
    const items: QuickReactionItem[] = [];
    const seen = new Set<string>();

    for (const key of app.settings?.favoriteEmojis ?? []) {
        if (items.length >= limit) break;

        const item = resolveFavoriteKey(key, app);
        if (!item || seen.has(item.key)) continue;

        seen.add(item.key);
        items.push(item);
    }

    for (const recent of recents) {
        if (items.length >= limit) break;

        const item = resolveRecent(recent, app);
        if (!item || seen.has(item.key)) continue;

        seen.add(item.key);
        items.push(item);
    }

    return items;
};
