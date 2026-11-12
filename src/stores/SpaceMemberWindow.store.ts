import type {
  APISpaceMember,
  PresencePayload,
  Snowflake,
} from "@mutualzz/types";
import { MEMBER_LIST_CHUNK_SIZE } from "@mutualzz/validators";
import type { AppStore } from "@stores/App.store";
import type { Space } from "@stores/objects/Space";
import type { SpaceMember } from "@stores/objects/SpaceMember";
import { makeAutoObservable, observable } from "mobx";
import i18n from "../i18n";

export interface MemberListGroupSummary {
  id: string;
  name: string;
  count: number;
}

type MemberListWindowItem =
  | { group: MemberListGroupSummary }
  | { member: APISpaceMember & { presence?: PresencePayload | null } }
  | null;

type MemberListWindowOp =
  | { op: "INSERT"; index: number; item?: MemberListWindowItem }
  | { op: "DELETE"; index: number }
  | { op: "UPDATE"; index: number; item: MemberListWindowItem }
  | { op: "SYNC"; range: [number, number]; items: MemberListWindowItem[] };

export interface MemberListWindowPayload {
  spaceId: Snowflake;
  listId: string;
  channelId: Snowflake;
  memberCount: number;
  groups: MemberListGroupSummary[];
  chunks: number[];
  reset: boolean;
  ops: MemberListWindowOp[];
}

export type MemberListWindowRow =
  | { type: "group"; id: string }
  | { type: "member"; member: SpaceMember };

export class SpaceMemberWindowStore {
  listId: string | null = null;
  channelId: Snowflake | null = null;
  memberCount = 0;
  groups: MemberListGroupSummary[] = [];
  chunks: number[] = [];
  rows: (MemberListWindowRow | undefined)[] = [];
  received = false;

  constructor(
    private readonly app: AppStore,
    private readonly space: Space,
  ) {
    makeAutoObservable(
      this,
      { rows: observable.ref, groups: observable.ref, chunks: observable.ref },
      { autoBind: true },
    );
  }

  get onlineCount() {
    return this.groups
      .filter((group) => group.id !== "offline")
      .reduce((total, group) => total + group.count, 0);
  }

  groupName(group: MemberListGroupSummary) {
    if (group.id === "online") return i18n.t("online", { ns: "chat" });
    if (group.id === "offline") return i18n.t("offline", { ns: "chat" });
    return group.name;
  }

  apply(payload: MemberListWindowPayload) {
    const rows = payload.reset ? [] : this.rows.slice();

    for (const operation of payload.ops) {
      if (operation.op === "INSERT") {
        if (operation.index > rows.length) rows.length = operation.index;
        rows.splice(operation.index, 0, this.toRow(operation.item));
      } else if (operation.op === "DELETE") {
        rows.splice(operation.index, 1);
      } else if (operation.op === "UPDATE") {
        rows[operation.index] = this.toRow(operation.item);
      } else {
        const [start] = operation.range;
        operation.items.forEach((item, offset) => {
          rows[start + offset] = this.toRow(item);
        });
      }
    }

    const windowed = new Array<MemberListWindowRow | undefined>(
      payload.memberCount,
    );
    for (const chunk of payload.chunks) {
      const end = Math.min(
        (chunk + 1) * MEMBER_LIST_CHUNK_SIZE,
        payload.memberCount,
      );
      for (let index = chunk * MEMBER_LIST_CHUNK_SIZE; index < end; index++)
        windowed[index] = rows[index];
    }

    this.listId = payload.listId;
    this.channelId = payload.channelId;
    this.memberCount = payload.memberCount;
    this.groups = payload.groups;
    this.chunks = payload.chunks;
    this.rows = windowed;
    this.received = true;
  }

  private toRow(
    item: MemberListWindowItem | undefined,
  ): MemberListWindowRow | undefined {
    if (!item) return undefined;
    if ("group" in item) return { type: "group", id: item.group.id };

    const { presence, ...member } = item.member;
    if (presence && member.userId !== this.app.account?.id)
      this.app.presence.upsert(member.userId, presence);

    const existing = this.space.members.get(member.userId);
    if (existing) {
      existing.update(member);
      return { type: "member", member: existing };
    }

    return { type: "member", member: this.space.members.add(member) };
  }
}
