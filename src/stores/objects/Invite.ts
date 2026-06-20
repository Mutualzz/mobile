import type { Snowflake } from "@mutualzz/types";
import { type APIInvite, type InviteType } from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import type { Channel } from "./Channel";
import type { Space } from "./Space";
import type { User } from "./User";
import { isLoadedRelation, omitBooleanRelations } from "@utils/apiRelations";
import { computed, makeAutoObservable, observable } from "mobx";

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

    _inviter!: User | null;
    _channel!: Channel | null;
    _space!: Space | null;

    constructor(
        private readonly app: AppStore,
        invite: APIInvite,
    ) {
        this._inviter = null;
        this._channel = null;
        this._space = null;

        this.code = invite.code;
        this.type = invite.type;

        this.spaceId = invite.spaceId;
        if (isLoadedRelation(invite.space)) {
            this._space = this.app.spaces.add(invite.space);
        }

        this.channelId = invite.channelId;
        if (isLoadedRelation(invite.channel)) {
            this._channel = this.app.channels.add(invite.channel);
        }

        this.inviterId = invite.inviterId;
        if (isLoadedRelation(invite.inviter)) {
            this._inviter = this.app.users.add(invite.inviter);
        }

        this.maxUses = invite.maxUses;
        this.uses = invite.uses;

        this.createdAt = new Date(invite.createdAt);
        this.updatedAt = new Date(invite.updatedAt);
        this.expiresAt = invite.expiresAt ? new Date(invite.expiresAt) : null;

        this.raw = omitBooleanRelations(invite, ["space", "channel", "inviter"]);

        makeAutoObservable(
            this,
            {
                _inviter: observable.ref,
                _channel: observable.ref,
                _space: observable.ref,
                inviter: computed,
                channel: computed,
                space: computed,
            },
            { autoBind: true },
        );
    }

    get inviter() {
        return this.app.users.get(this.inviterId) || this._inviter;
    }

    get channel() {
        if (!this.channelId) return null;
        return (
            this.app.channels.get(this.channelId) ||
            this.space?.channels.find((ch) => ch.id === this.channelId) ||
            this._channel
        );
    }

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

        if (isLoadedRelation(invite.space)) {
            this._space = this.app.spaces.add(invite.space);
        }
        if (isLoadedRelation(invite.channel)) {
            this._channel = this.app.channels.add(invite.channel);
        }
        if (isLoadedRelation(invite.inviter)) {
            this._inviter = this.app.users.add(invite.inviter);
        }

        this.raw = omitBooleanRelations(invite, ["space", "channel", "inviter"]);
    }

  async delete() {
    const result = await this.app.rest.delete(
      `/spaces/${this.spaceId}/invites/${this.code}`,
    );
    if (this.spaceId) {
      this.app.spaces.get(this.spaceId)?.removeInvite(this.code);
    }
    return result;
  }
}
