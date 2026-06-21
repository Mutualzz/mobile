import type { Snowflake } from "@mutualzz/types";
import { type APIInvite, type InviteType } from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import type { Channel } from "./Channel";
import type { Space } from "./Space";
import type { User } from "./User";
import { makeAutoObservable } from "mobx";

const prefixUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:1420/invite"
    : "https://mutualzz.com/invite";

export class Invite {
  code: string;
  type: InviteType;

  spaceId?: Snowflake | null;
  channelId?: Snowflake | null;
  inviterId: Snowflake;
  maxUses: number;
  uses: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date | null;
  raw: APIInvite;

  constructor(
    private readonly app: AppStore,
    invite: APIInvite,
  ) {
    this.code = invite.code;
    this.type = invite.type;

    this.spaceId = invite.spaceId;
    if (invite.space) this._space = this.app.spaces.add(invite.space);

    this.channelId = invite.channelId;
    if (invite.channel) this._channel = this.app.channels.add(invite.channel);

    this.inviterId = invite.inviterId;
    if (invite.inviter) this._inviter = this.app.users.add(invite.inviter);

    this.maxUses = invite.maxUses;
    this.uses = invite.uses;

    this.createdAt = new Date(invite.createdAt);
    this.updatedAt = new Date(invite.updatedAt);
    this.expiresAt = invite.expiresAt ? new Date(invite.expiresAt) : null;

    this.raw = invite;

    makeAutoObservable(this, {}, { autoBind: true });
  }

  _inviter?: User | null;

  get inviter() {
    return this.app.users.get(this.inviterId) || this._inviter;
  }

  _channel?: Channel | null;

  get channel() {
    if (!this.channelId) return null;
    return (
      this.app.channels.get(this.channelId) ||
      this.space?.channels.find((ch) => ch.id === this.channelId) ||
      this._channel
    );
  }

  _space?: Space | null;

  get space() {
    if (!this.spaceId) return null;
    return this.app.spaces.get(this.spaceId) || this._space;
  }

  get url() {
    return Invite.constructUrl(this.code);
  }

  static constructUrl(code: string) {
    return `${prefixUrl}/${code}`;
  }

  update(invite: APIInvite) {
    this.code = invite.code;
    this.type = invite.type;

    this.spaceId = invite.spaceId;
    this.channelId = invite.channelId;

    this.inviterId = invite.inviterId;

    this.maxUses = invite.maxUses;
    this.uses = invite.uses;

    this.createdAt = new Date(invite.createdAt);
    this.updatedAt = new Date(invite.updatedAt);
    this.expiresAt = invite.expiresAt ? new Date(invite.expiresAt) : null;

    if (invite.space) this._space = this.app.spaces.add(invite.space);
    if (invite.channel) this._channel = this.app.channels.add(invite.channel);
    if (invite.inviter) this._inviter = this.app.users.add(invite.inviter);

    this.raw = invite;
  }

  delete() {
    return this.app.rest.delete(`/spaces/${this.spaceId}/invites/${this.code}`);
  }
}
