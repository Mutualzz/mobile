// stores/objects/ReadState.ts
import { type APIReadState, ReadStateType, Snowflake } from "@mutualzz/types";
import { makeAutoObservable } from "mobx";
import type { AppStore } from "@stores/App.store";
import { BitField, readStateFlags, ReadStateFlags } from "@mutualzz/bitfield";

function maxSnowflake(
  ...ids: (Snowflake | null | undefined)[]
): Snowflake | null {
  let max: Snowflake | null = null;
  for (const id of ids) {
    if (!id) continue;
    if (!max || BigInt(id) > BigInt(max)) max = id;
  }
  return max;
}

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

  get readCursor(): Snowflake | null {
    return maxSnowflake(this.lastMessageId, this.lastAckedId);
  }

  isReadUpTo(messageId: Snowflake): boolean {
    const cursor = this.readCursor;
    if (!cursor) return false;
    return BigInt(messageId) <= BigInt(cursor);
  }

  get isUnread(): boolean {
    const lastChannelMessageId = this.channel?.lastMessage?.id;
    if (!lastChannelMessageId) return false;
    return !this.isReadUpTo(lastChannelMessageId);
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
      this.lastPinTimestamp = data.lastPinTimestamp
        ? new Date(data.lastPinTimestamp)
        : data.lastPinTimestamp;

    if (data.flags !== undefined)
      this.flags = BitField.fromString(readStateFlags, data.flags.toString());
  }

  mergeFromServer(data: APIReadState) {
    const localCursor = this.readCursor;
    const serverCursor = maxSnowflake(data.lastMessageId, data.lastAckedId);
    const localAhead =
      localCursor &&
      serverCursor &&
      BigInt(localCursor) > BigInt(serverCursor);

    this.update({
      lastMessageId: maxSnowflake(this.lastMessageId, data.lastMessageId),
      lastAckedId: maxSnowflake(this.lastAckedId, data.lastAckedId),
      notificationsCursor: maxSnowflake(
        this.notificationsCursor,
        data.notificationsCursor
      ),
      mentionCount: localAhead ? this.mentionCount : data.mentionCount,
      badgeCount: data.badgeCount,
      lastPinTimestamp: data.lastPinTimestamp,
      flags: data.flags
    });
  }
}
