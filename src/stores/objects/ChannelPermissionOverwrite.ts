import {
  type APIChannelPermissionOverwrite,
  type Snowflake
} from "@mutualzz/types";
import { makeAutoObservable } from "mobx";
import {
  BitField,
  permissionFlags,
  type PermissionFlags
} from "@mutualzz/bitfield";
import type { AppStore } from "@stores/App.store";

export class ChannelPermissionOverwrite {
  channelId: Snowflake;
  spaceId: Snowflake;

  roleId?: Snowflake | null;
  userId?: Snowflake | null;

  allow: BitField<PermissionFlags>;
  deny: BitField<PermissionFlags>;

  createdAt: Date;
  updatedAt: Date;

  constructor(
    private readonly app: AppStore,
    overwrite: APIChannelPermissionOverwrite
  ) {
    this.channelId = overwrite.channelId;
    this.spaceId = overwrite.spaceId;
    this.roleId = overwrite.roleId;
    this.userId = overwrite.userId;

    this.allow = BitField.fromString(
      permissionFlags,
      overwrite.allow.toString()
    );
    this.deny = BitField.fromString(permissionFlags, overwrite.deny.toString());

    this.createdAt = new Date(overwrite.createdAt);
    this.updatedAt = new Date(overwrite.updatedAt);

    makeAutoObservable(this, {}, { autoBind: true });
  }

  get space() {
    return this.app.spaces.get(this.spaceId);
  }

  get role() {
    if (!this.roleId) return null;
    return this.space?.roles.get(this.roleId);
  }

  get user() {
    if (!this.userId) return null;
    return this.app.users.get(this.userId);
  }

  get member() {
    if (!this.userId) return null;
    return this.space?.members.get(this.userId);
  }

  get channel() {
    return (
      this.app.channels.get(this.channelId) ??
      this.space?.channels.find((ch) => ch.id === this.channelId)
    );
  }

  update(overwrite: APIChannelPermissionOverwrite) {
    this.channelId = overwrite.channelId;
    this.spaceId = overwrite.spaceId;

    this.roleId = overwrite.roleId;
    this.userId = overwrite.userId;

    this.allow = BitField.fromString(
      permissionFlags,
      overwrite.allow.toString()
    );
    this.deny = BitField.fromString(permissionFlags, overwrite.deny.toString());

    this.createdAt = new Date(overwrite.createdAt);
    this.updatedAt = new Date(overwrite.updatedAt);
  }
}
