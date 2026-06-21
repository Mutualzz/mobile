import { type APISpaceMember, type Snowflake } from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import { makeAutoObservable, observable, ObservableMap } from "mobx";
import { Role } from "./Role";
import type { Channel } from "./Channel";
import {
  ALL_BITS,
  BitField,
  memberFlags,
  type MemberFlags,
  type PermissionFlag,
  permissionFlags,
  type PermissionFlags,
  resolveBaseBits,
  resolveEffectiveChannelBits
} from "@mutualzz/bitfield";
import type { User } from "@stores/objects/User";

export class SpaceMember {
  id: Snowflake;

  spaceId: Snowflake;

  userId: Snowflake;
  flags: BitField<MemberFlags>;
  nickname?: string | null;
  avatar?: string | null;
  banner?: string | null;
  roles = observable.set<string>();
  joinedAt: Date;
  updatedAt: Date;
  private channelPermCache: ObservableMap<string, bigint> = observable.map();

  constructor(
    private readonly app: AppStore,
    member: APISpaceMember
  ) {
    this.id = member.userId;

    this.spaceId = member.spaceId;
    this.userId = member.userId;

    this.roles.add(member.spaceId); // @everyone

    if (member.roles && Array.isArray(member.roles)) {
      for (const mr of member.roles) this.roles.add(mr.roleId);
    }

    this.flags = BitField.fromString(memberFlags, member.flags.toString());

    this.nickname = member.nickname;
    this.avatar = member.avatar;
    this.banner = member.banner;

    this.joinedAt = new Date(member.joinedAt);
    this.updatedAt = new Date(member.updatedAt);

    if (member.user) {
      const existing = this.app.users.get(member.userId);
      if (existing) {
        this._user = existing;
      } else this._user = this.app.users.add(member.user);
    }

    makeAutoObservable(this, {}, { autoBind: true });
  }

  private _user?: User | null;

  get user() {
    return this.app.users.get(this.userId) ?? this._user;
  }

  get displayName() {
    return this.nickname ?? this.user?.displayName ?? "Deleted User";
  }

  get space() {
    return this.app.spaces.get(this.spaceId);
  }

  get highestRole() {
    const space = this.space;
    if (!space) return null;

    let highest: Role | null = null;
    const everyoneId = space.id;

    for (const rid of this.roles) {
      if (rid === everyoneId) continue;

      const role = space.roles.get(rid);
      if (!role) continue;

      if (!highest) {
        highest = role;
        continue;
      }

      if (role.position > highest.position) highest = role;
      else if (
        role.position === highest.position &&
        BigInt(role.id) > BigInt(highest.id)
      )
        highest = role;
    }

    return highest;
  }

  get memberRoleIds(): string[] {
    return Array.from(this.roles);
  }

  get baseBits(): bigint {
    const space = this.space;
    if (!space) return 0n;

    if (space.ownerId === this.userId) return ALL_BITS;

    if (space.roles.all.length === 0) return 0n;

    // Pass allow + deny for each role so resolveBaseBits can apply denies
    const roles = space.roles.all.map((r) => ({
      id: r.id,
      allow: r.allow.bits,
      deny: r.deny.bits,
      // Keep permissions for backwards compat with engine RoleLike type
      permissions: r.allow.bits
    }));

    return resolveBaseBits(space.id, roles, this.memberRoleIds);
  }

  get basePermissions(): BitField<PermissionFlags> {
    const bits = this.baseBits;

    if (
      (bits & permissionFlags.Administrator) ===
      permissionFlags.Administrator
    )
      return BitField.fromBits(permissionFlags, ALL_BITS);

    return BitField.fromBits(permissionFlags, bits);
  }

  get resolvedRoles(): Role[] {
    const space = this.space;
    if (!space) return [];
    return Array.from(this.roles)
      .map((id) => space.roles.get(id))
      .filter(Boolean) as Role[];
  }

  get voiceState() {
    return this.app.voiceStates.get(this.userId);
  }

  update(member: APISpaceMember) {
    const uid = member.userId ?? this.userId;

    this.userId = uid;
    this.id = uid;

    this.spaceId = member.spaceId ?? this.spaceId;

    this.nickname = member.nickname ?? null;
    this.avatar = member.avatar ?? null;
    this.banner = member.banner ?? null;

    this.flags = BitField.fromString(memberFlags, member.flags.toString());

    this.joinedAt = new Date(member.joinedAt);
    this.updatedAt = new Date(member.updatedAt);

    if (this.space) {
      this.roles.clear();
      this.roles.add(this.space.id);
      if (member.roles)
        for (const mr of member.roles) this.roles.add(mr.roleId);
    }

    if (member.user) {
      const existing = this.app.users.get(member.userId ?? this.userId);
      if (existing) this._user = existing.update(member.user);
      else this._user = this.app.users.add(member.user);
    }

    this.invalidateChannelPermCache();

    return this;
  }

  invalidateChannelPermCache() {
    this.channelPermCache.clear();
  }

  hasPermission(flag: PermissionFlag, channel?: Channel | null) {
    if (!channel) return this.basePermissions.has(flag);

    const permissions = this.resolveChannelPermissions(channel);

    if (!permissions.has("ViewChannel")) return false;

    return permissions.has(flag);
  }

  hasAllPermissions(flags: PermissionFlag[], channel?: Channel) {
    if (channel) {
      const channelPerms = this.resolveChannelPermissions(channel);
      return flags.every((flag) => channelPerms.has(flag));
    }
    return flags.every((flag) => this.basePermissions.has(flag));
  }

  hasAnyPermission(flags: PermissionFlag[], channel?: Channel) {
    if (channel) {
      const channelPerms = this.resolveChannelPermissions(channel);
      return flags.some((flag) => channelPerms.has(flag));
    }
    return flags.some((flag) => this.basePermissions.has(flag));
  }

  resolveChannelPermissions(channel: Channel): BitField<PermissionFlags> {
    const space = this.space;
    if (!space) return BitField.fromString(permissionFlags, "0");

    if (space.roles.all.length === 0)
      return BitField.fromBits(permissionFlags, 0n);

    const cached = this.channelPermCache.get(channel.id);
    if (cached != null) return BitField.fromBits(permissionFlags, cached);

    const baseBits = this.baseBits;

    // Admin shortcut
    if (
      (baseBits & permissionFlags.Administrator) ===
      permissionFlags.Administrator
    ) {
      const bits = ALL_BITS;
      this.channelPermCache.set(channel.id, bits);
      return BitField.fromBits(permissionFlags, bits);
    }

    const parent = channel.parent;

    const parentOverwrites = parent
      ? parent.overwrites.map((o) => ({
          roleId: o.roleId ?? null,
          userId: o.userId ?? null,
          allow: o.allow.bits,
          deny: o.deny.bits
        }))
      : null;

    const channelOverwrites = channel.overwrites.map((o) => ({
      roleId: o.roleId ?? null,
      userId: o.userId ?? null,
      allow: o.allow.bits,
      deny: o.deny.bits
    }));

    const effectiveBits = resolveEffectiveChannelBits({
      baseBits,
      userId: this.userId,
      everyoneRoleId: space.id,
      memberRoleIds: this.memberRoleIds,
      parentOverwrites,
      channelOverwrites
    });

    this.channelPermCache.set(channel.id, effectiveBits);
    return BitField.fromBits(permissionFlags, effectiveBits);
  }

  canViewChannel(channel: Channel) {
    return this.resolveChannelPermissions(channel).has("ViewChannel");
  }

  canManageChannel(channel: Channel) {
    return this.resolveChannelPermissions(channel).has("ManageChannels");
  }

  canInviteToChannel(channel: Channel) {
    return this.resolveChannelPermissions(channel).has("CreateInvites");
  }

  canSendMessages(channel?: Channel | null) {
    if (!channel) return false;
    const permissions = this.resolveChannelPermissions(channel);
    return permissions.has("ViewChannel") && permissions.has("SendMessages");
  }

  canConnectToVoice(channel: Channel) {
    const permissions = this.resolveChannelPermissions(channel);
    return this.canViewChannel(channel) && permissions.has("Connect");
  }

  compareRoleHierarchy(other: SpaceMember): number {
    // returns: 1 if this > other, 0 tie, -1 if this < other
    const a = this.highestRole;
    const b = other.highestRole;

    if (!a && !b) return 0;
    if (a && !b) return 1;
    if (!a && b) return -1;

    // both exist
    if (a!.position !== b!.position) return a!.position > b!.position ? 1 : -1;

    const aid = BigInt(a!.id);
    const bid = BigInt(b!.id);
    if (aid === bid) return 0;
    return aid > bid ? 1 : -1;
  }

  canManageMember(target: SpaceMember, permission: PermissionFlag): boolean {
    const space = this.space;
    if (!space) return false;

    if (!this.hasPermission(permission)) return false;

    const actorIsOwner = space.ownerId === this.userId;
    if (actorIsOwner) return true;

    const targetIsOwner = space.ownerId === target.userId;
    if (targetIsOwner) return false;

    return this.compareRoleHierarchy(target) === 1;
  }

  async addRole(role: Role) {
    const rid = role.id;
    this.roles.add(rid);
    this.invalidateChannelPermCache();

    try {
      return this.app.rest.put(
        `/spaces/${this.spaceId}/members/${this.userId}/roles/${role.id}`
      );
    } catch (e) {
      this.roles.delete(rid);
      this.invalidateChannelPermCache();
      throw e;
    }
  }

  async removeRole(role: Role) {
    const rid = role.id;
    this.roles.delete(rid);
    this.invalidateChannelPermCache();

    try {
      return this.app.rest.delete(
        `/spaces/${this.spaceId}/members/${this.userId}/roles/${role.id}`
      );
    } catch (e) {
      this.roles.add(rid);
      this.invalidateChannelPermCache();
      throw e;
    }
  }
}
