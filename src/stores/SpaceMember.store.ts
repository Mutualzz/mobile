import type {
  APISpaceMember,
  PresencePayload,
  Snowflake,
} from "@mutualzz/types";
import {
  MAX_REQUESTED_MEMBER_IDS,
  MAX_ROLE_MEMBER_RESULTS,
} from "@mutualzz/validators";
import { makeAutoObservable, observable, type ObservableMap } from "mobx";
import type { AppStore } from "./App.store";
import type { Space } from "./objects/Space";
import { SpaceMember } from "./objects/SpaceMember";

const FETCH_BATCH_DELAY_MS = 50;
const NOT_FOUND_TTL_MS = 5 * 60_000;
const REPEAT_QUERY_TTL_MS = 30_000;
const SEARCH_DEBOUNCE_MS = 250;
const IDLE_EVICTION_MS = 10 * 60_000;

export type FetchedSpaceMember = APISpaceMember & {
  presence?: PresencePayload | null;
};

export class SpaceMemberStore {
  private readonly members: ObservableMap<string, SpaceMember>;
  private readonly space: Space;
  private readonly pendingIds = new Set<Snowflake>();
  private readonly inFlightIds = new Set<Snowflake>();
  private readonly notFoundUntil = new Map<Snowflake, number>();
  private readonly lastAccessed = new Map<Snowflake, number>();
  private readonly recentRequests = new Map<string, number>();
  private fetchTimer: ReturnType<typeof setTimeout> | null = null;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly app: AppStore,
    space: Space,
  ) {
    this.space = space;
    this.members = observable.map();

    makeAutoObservable<
      SpaceMemberStore,
      | "pendingIds"
      | "inFlightIds"
      | "notFoundUntil"
      | "lastAccessed"
      | "recentRequests"
      | "fetchTimer"
      | "searchTimer"
    >(
      this,
      {
        pendingIds: false,
        inFlightIds: false,
        notFoundUntil: false,
        lastAccessed: false,
        recentRequests: false,
        fetchTimer: false,
        searchTimer: false,
      },
      { autoBind: true },
    );
  }

  add(member: APISpaceMember) {
    this.notFoundUntil.delete(member.userId);
    this.lastAccessed.set(member.userId, Date.now());

    const exists = this.members.get(member.userId);
    if (exists) return exists;
    const spaceMember = new SpaceMember(this.app, member);
    this.members.set(member.userId, spaceMember);
    return spaceMember;
  }

  addAll(members: APISpaceMember[]) {
    members.forEach((member) => this.add(member));
  }

  remove(id: string) {
    this.members.delete(id);
    this.lastAccessed.delete(id);
  }

  update(member: APISpaceMember) {
    if (!member.userId) {
      throw new Error("Member does not have a user");
    }
    return this.members.get(member.userId)?.update(member);
  }

  get(id: string) {
    const member = this.members.get(id);
    if (member) {
      this.lastAccessed.set(id, Date.now());
      return member;
    }

    this.requestMissing(id);
    return undefined;
  }

  peek(id: string) {
    return this.members.get(id);
  }

  has(id: string) {
    return this.members.has(id);
  }

  get all() {
    return Array.from(this.members.values());
  }

  get size() {
    return this.members.size;
  }

  get me() {
    const meId = this.app.account?.id;
    if (!meId) return null;
    return this.peek(meId);
  }

  forgetNonMember(id: Snowflake) {
    this.notFoundUntil.delete(id);
  }

  isKnownNonMember(id: Snowflake) {
    return (this.notFoundUntil.get(id) ?? 0) > Date.now();
  }

  receive(members: FetchedSpaceMember[], notFound: Snowflake[] = []) {
    const accountId = this.app.account?.id;

    for (const { presence, ...member } of members) {
      if (presence && member.userId !== accountId)
        this.app.presence.upsert(member.userId, presence);

      const existing = this.members.get(member.userId);
      if (existing) {
        existing.update(member);
        this.lastAccessed.set(member.userId, Date.now());
      } else {
        this.add(member);
      }
    }

    const notFoundExpiry = Date.now() + NOT_FOUND_TTL_MS;
    for (const userId of notFound) {
      this.notFoundUntil.set(userId, notFoundExpiry);
      this.members.delete(userId);
    }
  }

  search(query: string) {
    const normalizedQuery = query.trim().toLowerCase().slice(0, 32);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = null;
    if (!normalizedQuery) return;

    this.searchTimer = setTimeout(() => {
      this.searchTimer = null;
      if (!this.claimRequest(`query:${normalizedQuery}`)) return;

      void this.app.gateway
        .requestSpaceMembers(this.space.id, { query: normalizedQuery })
        .then((ack) => {
          if (ack.ok) this.receive(ack.members);
        });
    }, SEARCH_DEBOUNCE_MS);
  }

  requestSome(limit: number) {
    if (!this.claimRequest(`page:${limit}`)) return;

    void this.app.gateway
      .requestSpaceMembers(this.space.id, { roleId: this.space.id, limit })
      .then((ack) => {
        if (ack.ok) this.receive(ack.members);
      });
  }

  requestRole(roleId: Snowflake) {
    if (!this.claimRequest(`role:${roleId}`)) return;

    void this.app.gateway
      .requestSpaceMembers(this.space.id, {
        roleId,
        limit: MAX_ROLE_MEMBER_RESULTS,
      })
      .then((ack) => {
        if (ack.ok) this.receive(ack.members);
      });
  }

  sweep(keepUserIds: Set<Snowflake>) {
    const cutoff = Date.now() - IDLE_EVICTION_MS;
    const meId = this.app.account?.id;

    for (const userId of [...this.members.keys()]) {
      if (userId === meId || keepUserIds.has(userId)) continue;
      if ((this.lastAccessed.get(userId) ?? 0) > cutoff) continue;
      this.members.delete(userId);
      this.lastAccessed.delete(userId);
    }

    const now = Date.now();
    for (const [userId, expiry] of this.notFoundUntil)
      if (expiry <= now) this.notFoundUntil.delete(userId);
    for (const [key, expiry] of this.recentRequests)
      if (expiry <= now) this.recentRequests.delete(key);
  }

  private claimRequest(key: string) {
    const now = Date.now();
    if ((this.recentRequests.get(key) ?? 0) > now) return false;
    this.recentRequests.set(key, now + REPEAT_QUERY_TTL_MS);
    return true;
  }

  private requestMissing(id: Snowflake) {
    if (!id || this.pendingIds.has(id) || this.inFlightIds.has(id)) return;
    if (this.isKnownNonMember(id)) return;

    this.pendingIds.add(id);
    this.fetchTimer ??= setTimeout(this.flushMissing, FETCH_BATCH_DELAY_MS);
  }

  private flushMissing() {
    this.fetchTimer = null;
    const userIds = [...this.pendingIds];
    this.pendingIds.clear();

    for (let i = 0; i < userIds.length; i += MAX_REQUESTED_MEMBER_IDS) {
      const batch = userIds.slice(i, i + MAX_REQUESTED_MEMBER_IDS);
      for (const userId of batch) this.inFlightIds.add(userId);

      void this.app.gateway
        .requestSpaceMembers(this.space.id, { userIds: batch })
        .then((ack) => {
          for (const userId of batch) this.inFlightIds.delete(userId);
          if (ack.ok) this.receive(ack.members, ack.notFound);
        });
    }
  }
}
