// stores/objects/ReadState.ts
import { type APIReadState, ReadStateType, Snowflake } from "@mutualzz/types";
import { makeAutoObservable } from "mobx";
import type { AppStore } from "@stores/App.store";
import { BitField, readStateFlags, ReadStateFlags } from "@mutualzz/bitfield";

export class ReadState {
  id: Snowflake;
  lastMessageId: Snowflake | null;
  lastAckedId: Snowflake | null;
  notificationsCursor: Snowflake | null;
  mentionCount: number;
  badgeCount: number;
  lastPinTimestamp?: Date | null;
  flags: BitField<ReadStateFlags>;
  type: ReadStateType;

  constructor(
    private readonly app: AppStore,
    data: APIReadState
  ) {
    this.id = data.id;
    this.lastMessageId = data.lastMessageId;
    this.lastAckedId = data.lastAckedId;
    this.notificationsCursor = data.notificationsCursor;
    this.mentionCount = data.mentionCount;
    this.badgeCount = data.badgeCount;
    if (data.lastPinTimestamp)
      this.lastPinTimestamp = new Date(data.lastPinTimestamp);
    this.flags = BitField.fromString(readStateFlags, data.flags.toString());
    this.type = data.type;

    makeAutoObservable(this, {}, { autoBind: true });
  }

  get channel() {
    return this.app.channels.get(this.id) ?? null;
  }

  get isUnread(): boolean {
    const lastChannelMessageId = this.channel?.lastMessage?.id;
    if (!lastChannelMessageId) return false;
    if (!this.lastMessageId && !this.lastAckedId) return false;
    if (!this.lastMessageId) return true;

    return BigInt(lastChannelMessageId) > BigInt(this.lastMessageId);
  }

  get hasMentions(): boolean {
    return this.mentionCount > 0;
  }

  incrementMentionCount(): void {
    this.mentionCount++;
  }

  ack() {
    const lastMessage = this.channel?.lastMessage;
    if (!lastMessage || "status" in lastMessage) return Promise.resolve();
    return this.app.readStates.ack(this.id, lastMessage.id);
  }

  update(data: Partial<APIReadState>) {
    if (data.lastMessageId !== undefined)
      this.lastMessageId = data.lastMessageId;

    if (data.lastAckedId !== undefined) this.lastAckedId = data.lastAckedId;

    if (data.notificationsCursor !== undefined)
      this.notificationsCursor = data.notificationsCursor;

    if (data.mentionCount !== undefined) this.mentionCount = data.mentionCount;

    if (data.badgeCount !== undefined) this.badgeCount = data.badgeCount;

    if (data.lastPinTimestamp !== undefined)
      this.lastPinTimestamp = data.lastPinTimestamp;

    if (data.flags !== undefined)
      this.flags = BitField.fromString(readStateFlags, data.flags.toString());
  }
}
