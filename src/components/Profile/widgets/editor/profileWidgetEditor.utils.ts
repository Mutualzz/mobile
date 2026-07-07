import type {
  APIMobileProfileBlock,
  APIProfileBlock,
  ProfileBlockType,
} from "@mutualzz/types";
import Snowflake from "@utils/Snowflake";

type DistributiveOmit<T, K extends keyof T> = T extends unknown
  ? Omit<T, K>
  : never;

type MobileBlockContent = DistributiveOmit<
  APIMobileProfileBlock,
  "id" | "size" | "order"
>;

export function createDefaultMobileBlockContent(
  type: ProfileBlockType,
): MobileBlockContent {
  switch (type) {
    case "text":
      return { type, content: "New text" };
    case "image":
      return { type, src: "", objectFit: "cover" };
    case "header":
      return { type };
    case "music":
      return {
        type,
        title: "Favorite song",
        artists: null,
        image: null,
        previewUrl: null,
        trackUrl: null,
        track: null,
      };
    case "links":
      return {
        type,
        links: [{ label: "My link", url: "https://example.com" }],
      };
    case "activity":
      return { type, showCustomStatus: true };
    case "roles":
      return { type, maxRoles: 6 };
    case "mutual":
      return { type, mode: "spaces", maxItems: 6 };
    case "divider":
      return { type, style: "line" };
    case "quote":
      return {
        type,
        content: "Write a quote…",
        variant: "default",
        attribution: null,
      };
    case "draw":
      return { type, svgData: null, paths: null, backgroundColor: null };
  }
}

export function addMobileWidget(
  blocks: APIMobileProfileBlock[],
  type: ProfileBlockType,
): APIMobileProfileBlock[] {
  const content = createDefaultMobileBlockContent(type);
  const block = {
    ...content,
    id: Snowflake.generate(),
    size: "m",
    order: blocks.length,
  } as APIMobileProfileBlock;

  return [...blocks, block];
}

export function reorderMobileBlocks(
  blocks: APIMobileProfileBlock[],
  fromIndex: number,
  toIndex: number,
): APIMobileProfileBlock[] {
  const sorted = [...blocks].sort((a, b) => a.order - b.order);
  if (
    fromIndex < 0 ||
    fromIndex >= sorted.length ||
    toIndex < 0 ||
    toIndex >= sorted.length ||
    fromIndex === toIndex
  ) {
    return blocks;
  }

  const [moved] = sorted.splice(fromIndex, 1);
  sorted.splice(toIndex, 0, moved);

  return sorted.map((block, index) => ({ ...block, order: index }));
}

export function removeMobileWidget(
  blocks: APIMobileProfileBlock[],
  blockId: string,
): APIMobileProfileBlock[] {
  return blocks
    .filter((block) => block.id !== blockId)
    .sort((a, b) => a.order - b.order)
    .map((block, index) => ({ ...block, order: index }));
}

export function updateMobileWidget(
  blocks: APIMobileProfileBlock[],
  blockId: string,
  patch: Record<string, unknown>,
): APIMobileProfileBlock[] {
  return blocks.map((block) =>
    block.id === blockId ? { ...block, ...patch } : block,
  );
}

export function prepareMobileBlocksForSave(
  blocks: APIMobileProfileBlock[],
): APIMobileProfileBlock[] {
  return blocks.filter((block) => {
    if (block.type === "image") return block.src.trim() !== "";
    if (block.type === "links")
      return block.links.some((link) => link.url.trim() !== "");
    return true;
  });
}

export function validateMobileBlocksForSave(
  blocks: APIMobileProfileBlock[],
): string | null {
  const emptyImageCount = blocks.filter(
    (block) => block.type === "image" && block.src.trim() === "",
  ).length;
  if (emptyImageCount > 0) {
    return `Remove or upload images for ${emptyImageCount} image widget(s) before saving`;
  }

  const emptyLinksCount = blocks.filter(
    (block) =>
      block.type === "links" &&
      block.links.every(
        (link) => link.url.trim() === "" || link.label.trim() === "",
      ),
  ).length;
  if (emptyLinksCount > 0) {
    return `Add at least one link to ${emptyLinksCount} links widget(s) before saving`;
  }

  return null;
}

export function copyDesktopBlocksToMobile(
  blocks: APIProfileBlock[],
): APIMobileProfileBlock[] {
  return blocks.map((block, index) => {
    const {
      x: _x,
      y: _y,

      height: _h,
      zIndex: _z,
      ...content
    } = block;
    return {
      ...content,
      id: Snowflake.generate(),
      size: "m",
      order: index,
    };
  });
}
