export interface MentionEntity {
  start: number;
  end: number;
  type: "user" | "role";
  id: string;
}

interface EditRange {
  start: number;
  oldEnd: number;
  newEnd: number;
}

function computeEditRange(prev: string, next: string): EditRange | null {
  if (prev === next) return null;

  const maxLen = Math.min(prev.length, next.length);
  let prefix = 0;
  while (prefix < maxLen && prev[prefix] === next[prefix]) prefix++;

  const maxSuffix = maxLen - prefix;
  let suffix = 0;
  while (
    suffix < maxSuffix &&
    prev[prev.length - 1 - suffix] === next[next.length - 1 - suffix]
  )
    suffix++;

  return {
    start: prefix,
    oldEnd: prev.length - suffix,
    newEnd: next.length - suffix,
  };
}

export function shiftEntitiesForEdit(
  entities: MentionEntity[],
  prev: string,
  next: string,
): MentionEntity[] {
  if (entities.length === 0) return entities;

  const edit = computeEditRange(prev, next);
  if (!edit) return entities;

  const delta = edit.newEnd - edit.oldEnd;
  const result: MentionEntity[] = [];

  for (const entity of entities) {
    if (entity.end <= edit.start) {
      result.push(entity);
    } else if (entity.start >= edit.oldEnd) {
      result.push({
        ...entity,
        start: entity.start + delta,
        end: entity.end + delta,
      });
    }
  }

  return result;
}

export function entitiesToRawMarkdown(
  text: string,
  entities: MentionEntity[],
): string {
  if (entities.length === 0) return text;

  const sorted = [...entities].sort((a, b) => a.start - b.start);
  let result = "";
  let cursor = 0;

  for (const entity of sorted) {
    if (entity.start < cursor || entity.end > text.length) continue;
    result += text.slice(cursor, entity.start);
    result += entity.type === "role" ? `<@&${entity.id}>` : `<@${entity.id}>`;
    cursor = entity.end;
  }

  result += text.slice(cursor);
  return result;
}

const RAW_MENTION_REGEX = /<@!?(\d+)>|<@&(\d+)>/g;

export function rawMarkdownToFriendly(
  raw: string,
  resolveUserLabel: (id: string) => string | undefined,
  resolveRoleLabel: (id: string) => string | undefined,
): { text: string; entities: MentionEntity[] } {
  const entities: MentionEntity[] = [];
  let result = "";
  let cursor = 0;

  RAW_MENTION_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = RAW_MENTION_REGEX.exec(raw))) {
    const [full, userId, roleId] = match;
    result += raw.slice(cursor, match.index);

    if (userId) {
      const label = `@${resolveUserLabel(userId) ?? userId}`;
      entities.push({
        start: result.length,
        end: result.length + label.length,
        type: "user",
        id: userId,
      });
      result += label;
    } else if (roleId) {
      const label = `@${resolveRoleLabel(roleId) ?? roleId}`;
      entities.push({
        start: result.length,
        end: result.length + label.length,
        type: "role",
        id: roleId,
      });
      result += label;
    }

    cursor = match.index + full.length;
  }

  result += raw.slice(cursor);
  return { text: result, entities };
}
