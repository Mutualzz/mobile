import { Blockquote } from "@components/Markdown/components/Blockquote";
import { CustomEmoji } from "@components/Markdown/components/CustomEmoji";
import { Emoji } from "@components/Markdown/components/Emoji";
import { DefaultMention } from "@components/Markdown/components/mention/DefaultMention";
import { RoleMention } from "@components/Markdown/components/mention/RoleMention";
import { UserMention } from "@components/Markdown/components/mention/UserMention";
import { Spoiler } from "@components/Markdown/components/Spoiler";
import { Theme } from "@emotion/react";
import type { TypographyColor } from "@mutualzz/ui-core";
import type { ColorLike } from "@mutualzz/ui-core";
import type { Snowflake } from "@mutualzz/types";
import { Box, Typography } from "@mutualzz/ui-native";
import { ReactNode } from "react";
import { Linking } from "react-native";

export const renderBlocks = (
    theme: Theme,
    tokens: any[],
    isEmojiOnly: boolean,
    spaceId?: Snowflake | null,
    textColor: TypographyColor | ColorLike | "inherit" = "primary",
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
            const inline = renderInline(
                theme,
                t.children ?? [],
                isEmojiOnly,
                spaceId,
                textColor,
            );
            if (stack.length) stack[stack.length - 1].children.push(inline);
            else out.push(inline);
            continue;
        }

        const leaf = renderInline(theme, [t], isEmojiOnly, spaceId, textColor);
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
                <Box key={key} style={{ flexShrink: 1, alignSelf: "stretch" }}>
                    {children}
                </Box>
            );

        case "heading_open": {
            return (
                <Box
                    key={key}
                    style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    {children}
                </Box>
            );
        }

        case "blockquote_open":
            return (
                <Blockquote key={key}>
                    <Box
                        style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            alignItems: "center",
                        }}
                    >
                        {children}
                    </Box>
                </Blockquote>
            );

        default:
            return (
                <Box
                    key={key}
                    style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    {children}
                </Box>
            );
    }
};

export const renderInline = (
    theme: Theme,
    tokens: any[],
    isEmojiOnly: boolean,
    spaceId?: Snowflake | null,
    textColor: TypographyColor | ColorLike | "inherit" = "primary",
) => {
    const out: ReactNode[] = [];
    const stack: { type: string; attrs?: any; children: ReactNode[] }[] = [];

    const textProps = {
        level: "body-sm" as const,
        textColor,
        style: { flexShrink: 1 },
    };

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

        if (token.type === "customEmoji") {
            pushNode(
                <CustomEmoji
                    key={`custom-emoji-${i}`}
                    raw={token.content}
                    isEmojiOnly={isEmojiOnly}
                />,
            );
            continue;
        }

        if (token.type === "mention") {
            const type = token.attrGet?.("type");
            const id = token.attrGet?.("id") ?? "";

            if (type === "user") {
                pushNode(
                    <UserMention
                        key={`mention-user-${i}`}
                        userId={id}
                        spaceId={spaceId}
                    />,
                );
            } else if (type === "role") {
                pushNode(
                    <RoleMention
                        key={`mention-role-${i}`}
                        roleId={id}
                        spaceId={spaceId}
                    />,
                );
            } else if (type === "everyone" || type === "here") {
                pushNode(
                    <DefaultMention
                        key={`mention-default-${i}`}
                        mentionId={id}
                    />,
                );
            } else {
                pushNode(
                    <Typography key={`mention-fallback-${i}`} {...textProps}>
                        {token.content}
                    </Typography>,
                );
            }
            continue;
        }

        if (token.type === "link") {
            const href = token.attrGet?.("href") ?? token.content;
            pushNode(
                <Typography
                    key={`link-${i}`}
                    level="body-sm"
                    style={{
                        color: theme.colors.info,
                        textDecorationLine: "underline",
                    }}
                    onPress={() => href && Linking.openURL(href)}
                >
                    {token.content}
                </Typography>,
            );
            continue;
        }

        if (token.type === "spoiler") {
            pushNode(<Spoiler key={`spoiler-${i}`}>{token.content}</Spoiler>);
            continue;
        }

        if (token.type === "text") {
            pushNode(
                <Typography key={`text-${i}`} {...textProps}>
                    {token.content}
                </Typography>,
            );
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
                    level="body-sm"
                    style={{
                        color: theme.colors.info,
                        textDecorationLine: "underline",
                    }}
                    onPress={() => href && Linking.openURL(href)}
                >
                    {node.children}
                </Typography>,
            );
            continue;
        }

        if (token.type === "strong") {
            pushNode(
                <Typography
                    key={`strong-${i}`}
                    {...textProps}
                    weight="bold"
                >
                    {token.content}
                </Typography>,
            );
            continue;
        }

        if (token.type === "em") {
            pushNode(
                <Typography
                    key={`em-${i}`}
                    {...textProps}
                    style={{ ...textProps.style, fontStyle: "italic" }}
                >
                    {token.content}
                </Typography>,
            );
            continue;
        }

        if (token.type === "underline") {
            pushNode(
                <Typography
                    key={`u-${i}`}
                    {...textProps}
                    style={{
                        ...textProps.style,
                        textDecorationLine: "underline",
                    }}
                >
                    {token.content}
                </Typography>,
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
                <Typography
                    key={`del-${i}`}
                    {...textProps}
                    style={{
                        ...textProps.style,
                        textDecorationLine: "line-through",
                    }}
                >
                    {node.children}
                </Typography>,
            );
            continue;
        }
    }

    while (stack.length) {
        const node = stack.pop()!;
        out.push(
            <Typography key={`unclosed-${stack.length}`} {...textProps}>
                {node.children}
            </Typography>,
        );
    }

    return (
        <Box
            key={`inline-${out.length}`}
            style={{
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "center",
                flexShrink: 1,
                alignSelf: "stretch",
            }}
        >
            {out}
        </Box>
    );
};
