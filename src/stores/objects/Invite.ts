import type { Snowflake } from "@mutualzz/types";
import { type APIInvite, type InviteType } from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import type { Channel } from "./Channel";
import type { Space } from "./Space";
import type { User } from "./User";

const prefixUrl =
    process.env.NODE_ENV === "development"
        ? "http://localhost:1420/invite"
        : "https://mutualzz.com/invite";

export class Invite {
    code: string;
    type: InviteType;

    spaceId?: Snowflake | null;
    space?: Space | null;

    channelId?: Snowflake | null;
    channel?: Channel | null;

    inviterId: Snowflake;
    inviter?: User | null;

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
        if (invite.space) this.space = this.app.spaces.add(invite.space);

        this.channelId = invite.channelId;
        if (invite.channel)
            this.channel = this.app.channels.add(invite.channel);

        this.inviterId = invite.inviterId;
        if (invite.inviter) this.inviter = this.app.users.add(invite.inviter);

        this.maxUses = invite.maxUses;
        this.uses = invite.uses;

        this.createdAt = new Date(invite.createdAt);
        this.updatedAt = new Date(invite.updatedAt);
        this.expiresAt = invite.expiresAt ? new Date(invite.expiresAt) : null;

        this.raw = invite;
    }

    update(invite: APIInvite) {
        Object.assign(this, invite);
    }

    delete() {
        return this.app.rest.delete(
            `/spaces/${this.spaceId}/invites/${this.code}`,
        );
    }

    get url() {
        return Invite.constructUrl(this.code);
    }

    static constructUrl(code: string) {
        return `${prefixUrl}/${code}`;
    }
}
