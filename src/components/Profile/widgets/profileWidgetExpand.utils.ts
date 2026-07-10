import type { APIMobileProfileBlock, ProfileBlockSize } from "@mutualzz/types";
import { isWidgetMaximizable } from "./profileWidget.constants";

const TEXT_LINE_CLAMP: Record<ProfileBlockSize, number> = { s: 2, m: 4, l: 8 };
const LINKS_VISIBLE: Record<ProfileBlockSize, number> = { s: 1, m: 3, l: 5 };

function isMarkdownTruncated(content: string, maxLines: number) {
  const trimmed = content.trim();
  if (!trimmed) return false;

  if (trimmed.split(/\r?\n/).length > maxLines) return true;

  // Rough wrap estimate for long single-paragraph markdown in narrow tiles.
  return Math.ceil(trimmed.length / 42) > maxLines;
}

export function shouldShowWidgetExpand(
  block: APIMobileProfileBlock,
  size: ProfileBlockSize,
  overflowCount = 0,
) {
  if (!isWidgetMaximizable(block.type)) return false;

  switch (block.type) {
    case "text":
      return isMarkdownTruncated(block.content ?? "", TEXT_LINE_CLAMP[size]);
    case "quote":
      return isMarkdownTruncated(block.content ?? "", TEXT_LINE_CLAMP[size]);
    case "links": {
      const links = (block.links ?? []).filter(
        (link) => link.label.trim() && link.url.trim(),
      );
      return links.length > LINKS_VISIBLE[size];
    }
    case "image":
      return Boolean(block.src);
    case "draw":
      return Boolean(block.svgData);
    case "roles":
    case "mutual":
    case "activity":
      return overflowCount > 0;
    default:
      return false;
  }
}
