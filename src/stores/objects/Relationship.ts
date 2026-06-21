import { AppStore } from "@stores/App.store";
import { APIRelationship, RelationshipType, Snowflake } from "@mutualzz/types";
import { makeAutoObservable } from "mobx";
import { User } from "@stores/objects/User";

export class Relationship {
  id: Snowflake;
  userId: Snowflake;
  otherUserId: Snowflake;
  type: RelationshipType;
  createdAt: Date;
  updatedAt: Date;
  raw: APIRelationship;

  constructor(
    private readonly app: AppStore,
    data: APIRelationship
  ) {
    this.id = data.id;
    this.userId = data.userId;
    this.otherUserId = data.otherUserId;
    this.type = data.type;
    this.createdAt = new Date(data.createdAt);
    this.updatedAt = new Date(data.updatedAt);

    this.raw = data;

    makeAutoObservable(this, {}, { autoBind: true });
  }

  get me() {
    return this.app.account?.id;
  }

  get isMine() {
    return (
      this.me != null &&
      (this.userId === this.me || this.otherUserId === this.me)
    );
  }

  get otherUserIdForMe(): Snowflake | null {
    if (!this.me) return null;
    if (this.userId === this.me) return this.otherUserId;
    if (this.otherUserId === this.me) return this.userId;
    return null;
  }

  get otherUser(): User | undefined {
    const otherId = this.otherUserIdForMe;
    if (!otherId) return undefined;
    return this.app.users.get(otherId);
  }

  get isFriend() {
    return this.type === RelationshipType.Friend;
  }

  get isBlocked() {
    return this.type === RelationshipType.Blocked;
  }

  get isIncomingRequest() {
    return this.type === RelationshipType.IncomingRequest;
  }

  get isOutgoingRequest() {
    return this.type === RelationshipType.OutgoingRequest;
  }

  get displayType() {
    return this.type;
  }

  update(data: APIRelationship) {
    this.id = data.id;
    this.userId = data.userId;
    this.otherUserId = data.otherUserId;
    this.type = data.type;
    this.createdAt = new Date(data.createdAt);
    this.updatedAt = new Date(data.updatedAt);
    this.raw = data;
    return this;
  }

  toJSON() {
    return this.raw;
  }
}
