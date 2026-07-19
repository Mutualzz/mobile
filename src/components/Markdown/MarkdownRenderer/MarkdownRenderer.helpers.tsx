import { Blockquote } from "@components/Markdown/components/Blockquote";
import { CustomEmoji } from "@components/Markdown/components/CustomEmoji";
import { Emoji } from "@components/Markdown/components/Emoji";
import { DefaultMention } from "@components/Markdown/components/mention/DefaultMention";
import { RoleMention } from "@components/Markdown/components/mention/RoleMention";
import { UserMention } from "@components/Markdown/components/mention/UserMention";
import { Spoiler } from "@components/Markdown/components/Spoiler";
import type { Theme } from "@emotion/react";
import type { TypographyColor } from "@mutualzz/ui-core";
import type { ColorLike } from "@mutualzz/ui-core";
import type { Snowflake } from "@mutualzz/types";
import { Box, Typography } from "@mutualzz/ui-native";
import type { ReactElement, ReactNode } from "react";
import { isValidElement } from "react";
import { Linking, Text, type TextStyle } from "react-native";

const inlineRowStyle = {
  flexDirection: "row" as const,
  flexWrap: "wrap" as const,
  alignItems: "center" as const,
};

type RunSegment = string | ReactElement;

type FormatFrame = {
  segments: RunSegment[];
  textProps: {
    weight?: "bold";
    textColor?: TypographyColor | ColorLike | "inherit";
    style?: TextStyle;
  };
};

const isTypographyElement = (node: ReactNode) =>
  isValidElement(node) && node.type === Typography;

const createTextRunBuilder = (
  textProps: {
    level: "body-sm";
    textColor: TypographyColor | ColorLike | "inherit";
  },
  theme: Theme,
  flushTo: (node: ReactNode) => void,
) => {
  let segments: RunSegment[] = [];
  const formatStack: FormatFrame[] = [];
  let linkStack: { href: string; segments: RunSegment[] } | null = null;

  const activeSegments = () =>
    linkStack?.segments ??
    formatStack[formatStack.length - 1]?.segments ??
    segments;

  const flush = (key: string) => {
    if (segments.length === 0) return;
    flushTo(
      <Typography key={key} {...textProps}>
        {segments}
      </Typography>,
    );
    segments = [];
  };

  const pushFormatted = (
    key: string,
    frameSegments: RunSegment[],
    frameProps: FormatFrame["textProps"],
  ) => {
    activeSegments().push(
      <Typography key={key} {...textProps} {...frameProps}>
        {frameSegments}
      </Typography>,
    );
  };

  return {
    pushText(text: string) {
      if (text) activeSegments().push(text);
    },
    pushNewline() {
      activeSegments().push("\n");
    },
    pushEmoji(
      unicode: string | undefined,
      name: string | undefined,
      isEmojiOnly: boolean,
      key: string,
    ) {
      if (!unicode) return;
      activeSegments().push(
        <Emoji
          key={key}
          unicode={unicode}
          name={name}
          url=""
          inline={!isEmojiOnly}
          isEmojiOnly={isEmojiOnly}
        />,
      );
    },
    pushCustomEmoji(raw: string | undefined, key: string) {
      if (!raw) return;
      activeSegments().push(
        <CustomEmoji key={key} raw={raw} inline />,
      );
    },
    pushLink(content: string, href: string, key: string) {
      activeSegments().push(
        <Text
          key={key}
          style={{
            color: theme.colors.info,
            textDecorationLine: "underline",
          }}
          onPress={() => href && Linking.openURL(href)}
        >
          {content}
        </Text>,
      );
    },
    openStrong() {
      formatStack.push({ segments: [], textProps: { weight: "bold" } });
    },
    closeStrong(key: string) {
      const frame = formatStack.pop();
      if (!frame) return;
      pushFormatted(key, frame.segments, frame.textProps);
    },
    openEm() {
      formatStack.push({
        segments: [],
        textProps: { style: { fontStyle: "italic" } },
      });
    },
    closeEm(key: string) {
      const frame = formatStack.pop();
      if (!frame) return;
      pushFormatted(key, frame.segments, frame.textProps);
    },
    openUnderline() {
      formatStack.push({
        segments: [],
        textProps: { style: { textDecorationLine: "underline" } },
      });
    },
    closeUnderline(key: string) {
      const frame = formatStack.pop();
      if (!frame) return;
      pushFormatted(key, frame.segments, frame.textProps);
    },
    openStrike() {
      formatStack.push({
        segments: [],
        textProps: { style: { textDecorationLine: "line-through" } },
      });
    },
    closeStrike(key: string) {
      const frame = formatStack.pop();
      if (!frame) return;
      pushFormatted(key, frame.segments, frame.textProps);
    },
    openColor(hex: string) {
      formatStack.push({
        segments: [],
        textProps: { style: { color: hex } },
      });
    },
    closeColor(key: string) {
      const frame = formatStack.pop();
      if (!frame) return;
      pushFormatted(key, frame.segments, frame.textProps);
    },
    openLink(href: string) {
      linkStack = { href, segments: [] };
    },
    closeLink(key: string) {
      if (!linkStack) return;
      const { href, segments: linkSegments } = linkStack;
      linkStack = null;
      activeSegments().push(
        <Text
          key={key}
          style={{
            color: theme.colors.info,
            textDecorationLine: "underline",
          }}
          onPress={() => href && Linking.openURL(href)}
        >
          {linkSegments}
        </Text>,
      );
    },
    flush,
    hasContent: () => segments.length > 0,
  };
};

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

    case "bullet_list_open":
    case "ordered_list_open":
      return (
        <Box
          key={key}
          style={{
            gap: 4,
            paddingLeft: 8,
            alignSelf: "stretch",
            marginVertical: 4,
          }}
        >
          {children}
        </Box>
      );

    case "list_item_open": {
      const marker = openToken.markup === "." ? "–" : "•";
      return (
        <Box
          key={key}
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 8,
            alignSelf: "stretch",
          }}
        >
          <Typography level="body-sm" textColor={theme.typography.colors.primary}>
            {marker}
          </Typography>
          <Box style={{ flex: 1, gap: 2 }}>{children}</Box>
        </Box>
      );
    }

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
  };

  let flushTarget: (node: ReactNode) => void = (node) => {
    out.push(node);
  };

  const pushNode = (node: ReactNode) => {
    if (stack.length && stack[stack.length - 1].type !== "spoiler") {
      stack[stack.length - 1].children.push(node);
      return;
    }
    flushTarget(node);
  };

  const run = createTextRunBuilder(textProps, theme, pushNode);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === "emoji") {
      if (isEmojiOnly) {
        run.flush(`run-${i}`);
        pushNode(
          <Emoji
            key={`emoji-${i}`}
            name={token.attrGet?.("name")}
            url={token.attrGet?.("url")}
            unicode={token.attrGet?.("unicode")}
            isEmojiOnly
          />,
        );
      } else {
        run.pushEmoji(
          token.attrGet?.("unicode"),
          token.attrGet?.("name"),
          false,
          `emoji-${i}`,
        );
      }
      continue;
    }

    if (token.type === "customEmoji") {
      if (isEmojiOnly) {
        run.flush(`run-${i}`);
        pushNode(
          <CustomEmoji
            key={`custom-emoji-${i}`}
            raw={token.content}
            isEmojiOnly
          />,
        );
      } else {
        run.pushCustomEmoji(token.content, `custom-emoji-${i}`);
      }
      continue;
    }

    if (token.type === "mention") {
      run.flush(`run-${i}`);
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
          <DefaultMention key={`mention-default-${i}`} mentionId={id} />,
        );
      } else {
        run.pushText(token.content);
      }
      continue;
    }

    if (token.type === "link") {
      run.pushLink(
        token.content,
        token.attrGet?.("href") ?? token.content,
        `link-${i}`,
      );
      continue;
    }

    if (token.type === "spoiler") {
      run.flush(`run-${i}`);
      pushNode(<Spoiler key={`spoiler-${i}`}>{token.content}</Spoiler>);
      continue;
    }

    if (token.type === "text") {
      run.pushText(token.content);
      continue;
    }

    if (token.type === "softbreak" || token.type === "hardbreak") {
      run.pushNewline();
      continue;
    }

    if (token.type === "strikethrough") {
      run.openStrike();
      run.pushText(token.content);
      run.closeStrike(`strikethrough-${i}`);
      continue;
    }

    if (token.type === "link_open") {
      run.openLink(token.attrGet("href"));
      continue;
    }

    if (token.type === "link_close") {
      run.closeLink(`a-${i}`);
      continue;
    }

    if (token.type === "strong") {
      run.openStrong();
      run.pushText(token.content);
      run.closeStrong(`strong-${i}`);
      continue;
    }

    if (token.type === "em") {
      run.openEm();
      run.pushText(token.content);
      run.closeEm(`em-${i}`);
      continue;
    }

    if (token.type === "underline") {
      run.openUnderline();
      run.pushText(token.content);
      run.closeUnderline(`u-${i}`);
      continue;
    }

    if (token.type === "strong_open") {
      run.openStrong();
      continue;
    }
    if (token.type === "strong_close") {
      run.closeStrong(`strong-${i}`);
      continue;
    }

    if (token.type === "em_open") {
      run.openEm();
      continue;
    }
    if (token.type === "em_close") {
      run.closeEm(`em-${i}`);
      continue;
    }

    if (token.type === "underline_open") {
      run.openUnderline();
      continue;
    }
    if (token.type === "underline_close") {
      run.closeUnderline(`u-${i}`);
      continue;
    }

    if (token.type === "spoiler_open") {
      run.flush(`run-${i}`);
      const spoilerChildren: ReactNode[] = [];
      stack.push({ type: "spoiler", children: spoilerChildren });
      flushTarget = (node) => {
        spoilerChildren.push(node);
      };
      continue;
    }
    if (token.type === "spoiler_close") {
      run.flush(`run-${i}`);
      const node = stack.pop()!;
      flushTarget = (node) => {
        out.push(node);
      };
      pushNode(<Spoiler key={`spoiler-${i}`}>{node.children}</Spoiler>);
      continue;
    }

    if (token.type === "color_open") {
      const hex = token.attrGet("color");
      if (hex) run.openColor(hex);
      continue;
    }
    if (token.type === "color_close") {
      run.closeColor(`color-${i}`);
      continue;
    }

    if (token.type === "s_open") {
      run.openStrike();
      continue;
    }
    if (token.type === "s_close") {
      run.closeStrike(`del-${i}`);
      continue;
    }
  }

  run.flush("run-final");

  while (stack.length) {
    const node = stack.pop()!;
    pushNode(
      <Box key={`unclosed-${stack.length}`} style={inlineRowStyle}>
        {node.children}
      </Box>,
    );
  }

  const needsInlineRow = out.some((node) => !isTypographyElement(node));

  return (
    <Box
      key={`inline-${out.length}`}
      style={{
        ...(needsInlineRow ? inlineRowStyle : null),
        flexShrink: 1,
        alignSelf: "stretch",
      }}
    >
      {out}
    </Box>
  );
};
