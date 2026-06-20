import { type APIRole, type Snowflake } from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import type { Space } from "./Space";
import {
  BitField,
  permissionFlags,
  type PermissionFlags,
  roleFlags,
  type RoleFlags,
} from "@mutualzz/bitfield";
import { isLoadedRelation, omitBooleanRelations } from "@utils/apiRelations";
import { computed, makeAutoObservable, observable } from "mobx";

export class Role {
  id: Snowflake;
  name: string;
  spaceId: Snowflake;
  color: string;
  allow: BitField<PermissionFlags>;
  deny: BitField<PermissionFlags>;
  position: number;
  hoist: boolean;
  flags: BitField<RoleFlags>;
  mentionable: boolean;
  createdAt: Date;
  updatedAt: Date;
  raw: APIRole;

  _space!: Space | null;

  constructor(
    private readonly app: AppStore,
    data: APIRole,
  ) {
    this._space = null;

    this.id = data.id;
    this.name = data.name;
    this.spaceId = data.spaceId;
    if (isLoadedRelation(data.space)) {
      this._space = this.app.spaces.add(data.space);
    }

    this.color = data.color;

    const allowVal = data.allow ?? 0n;
    this.allow = BitField.fromString(permissionFlags, allowVal.toString());
    this.deny = BitField.fromString(
      permissionFlags,
      (data.deny ?? 0n).toString(),
    );

    this.position = data.position;
    this.hoist = data.hoist;
    this.flags = BitField.fromString(roleFlags, data.flags.toString());
    this.mentionable = data.mentionable;

    this.createdAt = new Date(data.createdAt);
    this.updatedAt = new Date(data.updatedAt);

    this.raw = omitBooleanRelations(data, ["space"]);

    makeAutoObservable(
      this,
      {
        _space: observable.ref,
        space: computed,
      },
      { autoBind: true },
    );
  }

  get space() {
    return this.app.spaces.get(this.spaceId) || this._space;
  }

  get isEveryone() {
    return this.flags.has("Everyone");
  }

  get members() {
    return this.space?.members.all.filter((member) =>
      member.roles.has(this.id),
    );
  }

  get permissions() {
    return this.allow;
  }

  update(data: APIRole) {
    this.id = data.id;
    this.spaceId = data.spaceId;

    if (isLoadedRelation(data.space)) {
      this._space = this.app.spaces.add(data.space);
    }

    this.name = data.name;
    this.color = data.color;
    this.position = data.position;
    this.hoist = data.hoist;
    this.mentionable = data.mentionable;

    const allowVal = data.allow ?? 0n;
    this.allow = BitField.fromString(permissionFlags, allowVal.toString());
    this.deny = BitField.fromString(
      permissionFlags,
      (data.deny ?? 0n).toString(),
    );

    this.flags = BitField.fromString(roleFlags, data.flags.toString());

    this.createdAt = new Date(data.createdAt);
    this.updatedAt = new Date(data.updatedAt);

    this.raw = omitBooleanRelations(data, ["space"]);
  }

  delete() {
    return this.app.rest.delete(`/spaces/${this.spaceId}/roles/${this.id}`).then(() => {
      this.space?.roles.remove(this.id);
    });
  }

  async addMembers(userIds: Snowflake[]) {
    const space = this.space;
    if (!space) throw new Error("Space not found");

    const touched = userIds
      .map((userId) => space.members.get(userId))
      .filter(Boolean);

    const snapshot = touched.map((member) => ({
      member: member!,
      hadRole: member!.roles.has(this.id),
    }));

    for (const { member, hadRole } of snapshot) {
      if (hadRole) continue;
      member.roles.add(this.id);
      member.invalidateChannelPermCache();
    }

    try {
      await this.app.rest.put(
        `/spaces/${this.spaceId}/members/roles/${this.id}`,
        { userIds },
      );
    } catch (error) {
      for (const { member, hadRole } of snapshot) {
        if (hadRole) continue;
        member.roles.delete(this.id);
        member.invalidateChannelPermCache();
      }
      throw error;
    }
  }

  toJSON() {
    return this.raw;
  }
}
