import type { AppStore } from "@stores/App.store";
import type { Expression } from "@stores/objects/Expression";

export function parseCustomEmojiShortcode(shortcode: string) {
    if (!shortcode.startsWith("<") || !shortcode.endsWith(">")) return null;

    const inner = shortcode.slice(1, -1);
    const parts = inner.split(":");
    if (parts.length !== 3) return null;

    const [animatedFlag, name, id] = parts;
    if (!name || !id) return null;

    return {
        animated: animatedFlag === "a",
        name,
        id,
    };
}

export function findCustomEmoji(
    app: AppStore,
    shortcode: string,
): Expression | null {
    const parsed = parseCustomEmojiShortcode(shortcode);
    if (!parsed) return null;

    const { animated, name, id } = parsed;

    return (
        app.expressions.get(id) ??
        app.expressions.emojis.find(
            (e) => e.name === name && e.id === id && e.animated === animated,
        ) ??
        app.spaces.all
            .map((space) => space.expressions.get(id))
            .find(
                (exp) =>
                    exp &&
                    exp.name === name &&
                    exp.id === id &&
                    exp.animated === animated,
            ) ??
        null
    );
}
