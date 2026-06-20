import { Logger } from "@mutualzz/logger";
import type { Snowflake } from "@mutualzz/types";
import { type APIChannel, type APIMessage, ChannelType } from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import { MessageStore } from "@stores/Message.store";
import { type Message } from "@stores/objects/Message";
import type { Space } from "@stores/objects/Space";
import type { User } from "@stores/objects/User";
import { isLoadedRelation, omitBooleanRelations } from "@utils/apiRelations";
import { action, computed, makeObservable, observable } from "mobx";
import type { QueuedMessage } from "./QueuedMessage";
import { ChannelPermissionOverwrite } from "./ChannelPermissionOverwrite";
import { BitField, channelFlags, type ChannelFlags } from "@mutualzz/bitfield";
import { murmur } from "@utils/hash";

function getOverwriteKey(ow: ChannelPermissionOverwrite): string {
  if (ow.roleId != null) return `r:${ow.roleId}`;
  if (ow.userId != null) return `u:${ow.userId}`;

  return "x";
}

export class Channel {
  static readonly DEFAULT_LIST_ID = "everyone";
  id: Snowflake;
  type: ChannelType;
  name?: string | null;
  topic?: string | null;
  position: number;
  nsfw: boolean;
  createdAt: Date;
  updatedAt: Date;
  flags: BitField<ChannelFlags>;
  messages: MessageStore;
  parentId?: Snowflake | null;
  spaceId?: Snowflake | null;
  raw: APIChannel;
  lastMessageId?: Snowflake | null;
  overwrites = observable.array<ChannelPermissionOverwrite>();
  recipientIds?: Snowflake[] | null;

  _parent!: Channel | null;
  _space!: Space | null;
  _lastMessage!: Message | null;
  _recipients = observable.array<User>();

  private readonly logger = new Logger({
    tag: "Channel",
  });
  private hasFetchedInitialMessages = false;

  constructor(
    private readonly app: AppStore,
    channel: APIChannel,
  ) {
    this._parent = null;
    this._space = null;
    this._lastMessage = null;

    this.id = channel.id;
    this.type = channel.type;

    this.name = channel.name;
    this.topic = channel.topic;

    this.parentId = channel.parentId;
    if (isLoadedRelation(channel.parent)) {
      this._parent = this.app.channels.add(channel.parent);
    }

    this.spaceId = channel.spaceId;
    if (isLoadedRelation(channel.space)) {
      this._space = this.app.spaces.add(channel.space);
    }

    this.position = channel.position;
    this.nsfw = channel.nsfw;

    this.flags = BitField.fromString(channelFlags, channel.flags.toString());

    this.createdAt = new Date(channel.createdAt);
    this.updatedAt = new Date(channel.updatedAt);

    this.raw = omitBooleanRelations(channel, ["space", "parent"]);

    this.messages = new MessageStore(this.app, this.id);

    if (channel.messages) this.messages.addAll(channel.messages);

    this.lastMessageId = channel.lastMessageId;
    if (channel.lastMessage) {
      this._lastMessage = this.messages.add(channel.lastMessage);
    }

    this.overwrites = observable.array(
      (channel.overwrites || []).map(
        (ow) => new ChannelPermissionOverwrite(this.app, ow),
      ),
    );

    this.recipientIds = channel.recipientIds ?? null;
    if (channel.recipients) {
      this._recipients.replace(this.app.users.addAll(channel.recipients));
    }

    makeObservable<this, "_parent" | "_space" | "_lastMessage">(this, {
      id: observable,
      type: observable,
      name: observable,
      topic: observable,
      position: observable,
      nsfw: observable,
      flags: observable.ref,
      parentId: observable,
      spaceId: observable,
      raw: observable.ref,
      lastMessageId: observable,
      overwrites: observable,
      _parent: observable.ref,
      _space: observable.ref,
      _lastMessage: observable.ref,
      parent: computed,
      space: computed,
      lastMessage: computed,
      listId: computed,
      hasChildren: computed,
      hasParent: computed,
      isDM: computed,
      isGroupDM: computed,
      dmRecipient: computed,
      dmRecipientsList: computed,
      isTextChannel: computed,
      isVoiceChannel: computed,
      isCategory: computed,
      update: action.bound,
      setParent: action.bound,
      getMessages: action.bound,
      sendMessage: action.bound,
      delete: action.bound,
      addRecipient: action.bound,
      removeRecipient: action.bound,
      updateLastMessage: action.bound,
    });
  }

  get parent(): Channel | null | undefined {
    if (!this.parentId) return null;

    return (
      this.app.channels.get(this.parentId) ||
      this.space?.channels.find((ch) => ch.id === this.parentId) ||
      this._parent
    );
  }

  get space() {
    if (!this.spaceId) return null;

    return this.app.spaces.get(this.spaceId) || this._space;
  }

  get lastMessage() {
    if (this._lastMessage) return this._lastMessage;

    try {
      const local = Array.from(this.messages.all || []);
      const queued = Array.from(this.app.queue.messages.values()).filter(
        (m) => m.channelId === this.id,
      );

      const combined: (Message | QueuedMessage)[] = [...local, ...queued];

      if (combined.length === 0) return null;

      combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return combined[0] ?? null;
    } catch {
      return null;
    }
  }

  get listId() {
    const parts: string[] = [];

    const add = (
      prefix: "p" | "c",
      overwrites?: ChannelPermissionOverwrite[] | null,
    ) => {
      if (!overwrites?.length) return;

      for (const ow of overwrites) {
        const key = getOverwriteKey(ow);

        if (ow.allow.has("ViewChannel")) parts.push(`${prefix}:a:${key}`);
        if (ow.deny.has("ViewChannel")) parts.push(`${prefix}:d:${key}`);
      }
    };

    add("p", this.parent?.overwrites);
    add("c", this.overwrites);

    const sorted = Array.from(new Set(parts)).sort();
    if (!sorted.length) return Channel.DEFAULT_LIST_ID;

    return murmur(sorted.join(","));
  }

  get hasChildren(): boolean {
    return this.app.channels.all.some((ch) => ch.parent?.id === this.id);
  }

  get hasParent(): boolean {
    return !!this.raw.parentId;
  }

  get isDM() {
    return this.type === ChannelType.DM || this.type === ChannelType.GroupDM;
  }

  get isGroupDM() {
    return this.type === ChannelType.GroupDM;
  }

  get dmRecipientsList() {
    const meId = this.app.account?.id;
    if (!meId) return this._recipients.slice();

    return this._recipients.filter((user) => user.id !== meId);
  }

  get dmRecipient() {
    return this.type === ChannelType.DM ? this.dmRecipientsList[0] : undefined;
  }

  addRecipient(user: User) {
    if (!this.recipientIds?.includes(user.id)) {
      this.recipientIds = [...(this.recipientIds ?? []), user.id];
    }
    if (!this._recipients.some((recipient) => recipient.id === user.id)) {
      this._recipients.push(user);
    }
  }

  removeRecipient(userId: Snowflake) {
    const index = this._recipients.findIndex(
      (recipient) => recipient.id === userId,
    );
    if (index !== -1) this._recipients.splice(index, 1);
    this.recipientIds =
      this.recipientIds?.filter((id) => id !== userId) ?? null;
  }

  get isTextChannel() {
    return this.type === ChannelType.Text;
  }

  get isVoiceChannel() {
    return this.type === ChannelType.Voice;
  }

  get isCategory() {
    return this.type === ChannelType.Category;
  }

  update(channel: APIChannel) {
    this.type = channel.type;
    this.name = channel.name;
    this.topic = channel.topic;
    this.position = channel.position;
    this.nsfw = channel.nsfw;

    this.parentId = channel.parentId ?? null;
    this._parent = isLoadedRelation(channel.parent)
      ? this.app.channels.add(channel.parent)
      : null;

    this.spaceId = channel.spaceId ?? null;
    this._space = isLoadedRelation(channel.space)
      ? this.app.spaces.add(channel.space)
      : null;

    this.flags = BitField.fromString(channelFlags, channel.flags.toString());

    this.createdAt = new Date(channel.createdAt);
    this.updatedAt = new Date(channel.updatedAt);

    this.overwrites = observable.array(
      (channel.overwrites || []).map(
        (ow) => new ChannelPermissionOverwrite(this.app, ow),
      ),
    );

    this.raw = omitBooleanRelations(channel, ["space", "parent"]);

    this.recipientIds = channel.recipientIds ?? this.recipientIds ?? null;
    if (channel.recipients) {
      this._recipients.replace(this.app.users.addAll(channel.recipients));
    }

    if (channel.lastMessage) {
      this._lastMessage = this.messages.add(channel.lastMessage);
    }

    this.space?.members.me?.invalidateChannelPermCache?.();
  }

  setParent(channel: Channel | null) {
    this.parentId = channel?.id || null;
    this.space?.members.me?.invalidateChannelPermCache?.();
  }

  updateLastMessage(message: Message) {
    if (
      this._lastMessage &&
      BigInt(message.id) <= BigInt(this._lastMessage.id)
    ) {
      return;
    }

    this._lastMessage = message;
    this.lastMessageId = message.id;
  }

  getMessages(
    isInitial: boolean,
    limit?: number,
    before?: string,
    after?: string,
    around?: string,
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      if (isInitial && this.hasFetchedInitialMessages) return;

      let opts: Record<string, any> = {
        limit: limit || 50,
      };

      if (before) opts = { ...opts, before };

      if (after) opts = { ...opts, after };

      if (around) opts = { ...opts, around };

      if (isInitial)
        this.logger.info(`Fetching initial messages for ${this.id}`);
      else
        this.logger.info(`Fetching messages for ${this.id} before ${before}`);

      this.app.rest
        .get<APIMessage[]>(`/channels/${this.id}/messages`, opts)
        .then((res) => {
          this.messages.addAll(res.filter((x) => !this.messages.has(x.id)));
          this.hasFetchedInitialMessages = true;
          resolve(res.length);
        })
        .catch((err) => {
          this.logger.error(err);
          reject(err);
        });
    });
  }

  async sendMessage(
    data:
      | { content: string; nonce: string; expressionIds?: string[] }
      | FormData,
    msg?: QueuedMessage,
  ) {
    if (data instanceof FormData)
      return this.app.rest
        .postFormData<APIMessage>(
          `/channels/${this.id}/messages`,
          data,
          undefined,
          undefined,
          msg,
        )
        .catch((err) => {
          this.logger.error(err);
          throw err;
        });

    return this.app.rest
      .post<
        APIMessage,
        { content: string; nonce: string; expressionIds?: string[] }
      >(`/channels/${this.id}/messages`, data)
      .catch((err) => {
        this.logger.error(err);
        throw err;
      });
  }

  delete(parentOnly: boolean) {
    return this.app.rest.delete<{
      spaceId?: string;
      channelId: string;
    }>(`/channels/${this.id}`, {
      parentOnly,
      spaceId: this.raw.spaceId ?? undefined,
    });
  }
}
