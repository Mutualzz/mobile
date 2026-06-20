import type { APISpaceBan, Snowflake } from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import type { User } from "@stores/objects/User";

export class SpaceBan {
    spaceId: Snowflake;
    userId: Snowflake;
    bannedById: Snowflake;
    reason: string;
    createdAt: Date;

    private readonly _user?: User | null;
    private readonly _bannedBy?: User | null;

    constructor(
        private readonly app: AppStore,
        data: APISpaceBan,
    ) {
        this.spaceId = data.spaceId;
        this.userId = data.userId;
        this.bannedById = data.bannedById;
        this.reason = data.reason;
        this.createdAt = new Date(data.createdAt);

        if (data.user) {
            const existing = this.app.users.get(data.userId);
            this._user = existing ?? this.app.users.add(data.user);
        }

        if (data.bannedBy) {
            const existing = this.app.users.get(data.bannedById);
            this._bannedBy = existing ?? this.app.users.add(data.bannedBy);
        }
    }

    get user() {
        return this.app.users.get(this.userId) ?? this._user;
    }

    get bannedBy() {
        return this.app.users.get(this.bannedById) ?? this._bannedBy;
    }
}
