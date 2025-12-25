import { Blockquote } from "@components/Markdown/components/Blockquote";
import { Emoji } from "@components/Markdown/components/Emoji";
import { Spoiler } from "@components/Markdown/components/Spoiler";
import { Theme } from "@emotion/react";
import { Typography } from "@mutualzz/ui-native";
import { ReactNode } from "react";
import { Linking, Text } from "react-native";

export const renderBlocks = (
    theme: Theme,
    tokens: any[],
    isEmojiOnly: boolean,
) => {
    const out: ReactNode[] = [];
    const stack: any[] = [];

    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];

        if (t.type.endsWith("_open")) {
            stack.push({ token: t, children: [] as ReactNode[] });
            continue;
        }
        if (t.type.endsWith("_close")) {
            const node = stack.pop();
            const el = renderBlockNode(theme, node.token, node.children, i);
            if (stack.length) stack[stack.length - 1].children.push(el);
            else out.push(el);
            continue;
        }

        if (t.type === "inline") {
            const inline = renderInline(t.children ?? [], isEmojiOnly);
            if (stack.length) stack[stack.length - 1].children.push(inline);
            else out.push(inline);
            continue;
        }

        const leaf = renderInline([t], isEmojiOnly);
        if (stack.length) stack[stack.length - 1].children.push(leaf);
        else out.push(leaf);
    }

    return out;
};

export const renderBlockNode = (
    theme: Theme,
    openToken: any,
    children: ReactNode[],
    key: number,
) => {
    switch (openToken.type) {
        case "paragraph_open":
            return (
                <Typography key={key} style={{ flexWrap: "wrap" }}>
                    {children}
                </Typography>
            );

        case "heading_open": {
            const level = openToken.tag || "h3";
            return (
                <Typography level={level} key={key}>
                    {children}
                </Typography>
            );
        }

        case "blockquote_open":
            return (
                <Blockquote key={key}>
                    <Typography>{children}</Typography>
                </Blockquote>
            );

        default:
            return (
                <Typography
                    key={key}
                    style={{
                        includeFontPadding: false,
                        flexWrap: "wrap",
                    }}
                >
                    {children}
                </Typography>
            );
    }
};

export const renderInline = (tokens: any[], isEmojiOnly: boolean) => {
    const out: ReactNode[] = [];
    const stack: { type: string; attrs?: any; children: ReactNode[] }[] = [];

    const pushNode = (node: ReactNode) => {
        if (stack.length) stack[stack.length - 1].children.push(node);
        else out.push(node);
    };

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type === "emoji") {
            pushNode(
                <Emoji
                    key={`emoji-${i}`}
                    name={token.attrGet?.("name")}
                    url={token.attrGet?.("url")}
                    unicode={token.attrGet?.("unicode")}
                    isEmojiOnly={isEmojiOnly}
                />,
            );
            continue;
        }

        if (token.type === "spoiler") {
            pushNode(<Spoiler key={`spoiler-${i}`}>{token.content}</Spoiler>);
            continue;
        }

        if (token.type === "text") {
            pushNode(<Text key={`text-${i}`}>{token.content}</Text>);
            continue;
        }

        if (token.type === "link_open") {
            stack.push({
                type: "link",
                attrs: { href: token.attrGet("href") },
                children: [],
            });
            continue;
        }

        if (token.type === "link_close") {
            const node = stack.pop()!;
            const href = node.attrs?.href;
            pushNode(
                <Typography
                    key={`a-${i}`}
                    style={{ textDecorationLine: "underline" }}
                    textColor="primary"
                    onPress={() => href && Linking.openURL(href)}
                >
                    {node.children}
                </Typography>,
            );
            continue;
        }

        if (token.type === "strong") {
            pushNode(
                <Text key={`strong-${i}`} style={{ fontWeight: "700" }}>
                    {token.content}
                </Text>,
            );
            continue;
        }

        if (token.type === "em") {
            pushNode(
                <Text key={`em-${i}`} style={{ fontStyle: "italic" }}>
                    {token.content}
                </Text>,
            );
            continue;
        }

        if (token.type === "underline") {
            pushNode(
                <Text
                    key={`u-${i}`}
                    style={{ textDecorationLine: "underline" }}
                >
                    {token.content}
                </Text>,
            );
            continue;
        }

        if (token.type === "s_open") {
            stack.push({ type: "del", children: [] });
            continue;
        }
        if (token.type === "s_close") {
            const node = stack.pop()!;
            pushNode(
                <Text
                    key={`del-${i}`}
                    style={{ textDecorationLine: "line-through" }}
                >
                    {node.children}
                </Text>,
            );
            continue;
        }
    }

    while (stack.length) {
        const node = stack.pop()!;
        out.push(<Text key={`unclosed-${stack.length}`}>{node.children}</Text>);
    }

    return <Typography key={`inline-${Math.random()}`}>{out}</Typography>;
};
