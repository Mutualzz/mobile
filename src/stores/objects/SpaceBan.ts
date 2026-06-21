import { APISpaceBan, Snowflake } from "@mutualzz/types";
import { AppStore } from "@stores/App.store";
import { User } from "@stores/objects/User";

export class SpaceBan {
  spaceId: Snowflake;
  userId: Snowflake;
  bannedById: Snowflake;
  reason: string;
  createdAt: Date;

  constructor(
    private readonly app: AppStore,
    data: APISpaceBan
  ) {
    this.spaceId = data.spaceId;
    this.userId = data.userId;
    this.bannedById = data.bannedById;
    this.reason = data.reason;
    this.createdAt = new Date(data.createdAt);

    if (data.bannedBy) {
      const existing = this.app.users.get(data.userId);
      if (existing) {
        this._user = existing;
      } else this._user = this.app.users.add(data.bannedBy);
    }

    if (data.bannedBy) {
      const existing = this.app.users.get(data.bannedById);
      if (existing) {
        this._bannedBy = existing;
      } else this._bannedBy = this.app.users.add(data.bannedBy);
    }
  }

  private readonly _user?: User | null;

  get user() {
    return this.app.users.get(this.userId) ?? this._user;
  }

  private readonly _bannedBy?: User | null;

  get bannedBy() {
    return this.app.users.get(this.bannedById) ?? this._bannedBy;
  }
}
