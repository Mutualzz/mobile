import { Logger } from "@mutualzz/logger";
import {
  type APIChannel,
  type APIMessage,
  CDNRoutes,
  type ChannelIconFormat,
  ChannelType,
  ImageFormat,
  type Sizes,
  type Snowflake,
} from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import { MessageStore } from "@stores/Message.store";
import type { Space } from "@stores/objects/Space";
import { makeAutoObservable, observable } from "mobx";
import type { QueuedMessage } from "./QueuedMessage";
import { ChannelPermissionOverwrite } from "./ChannelPermissionOverwrite";
import { BitField, channelFlags, type ChannelFlags } from "@mutualzz/bitfield";
import { REST } from "@stores/REST.store";
import type { User } from "./User";
import { murmur } from "@utils/hash";
import type { Message } from "./Message";

function getOverwriteKey(ow: ChannelPermissionOverwrite): string {
  if (ow.roleId != null) return `r:${ow.roleId}`;
  if (ow.userId != null) return `u:${ow.userId}`;

  return "x";
}

export class Channel {
  id: Snowflake;
  type: ChannelType;

  icon?: string | null;
  name?: string | null;
  topic?: string | null;
  position: number;
  nsfw: boolean;

  createdAt: Date;
  updatedAt: Date;

  flags: BitField<ChannelFlags>;

  messages: MessageStore;

  lastMessageId?: Snowflake | null;

  parentId?: Snowflake | null;
  spaceId?: Snowflake | null;
  recipientIds?: Snowflake[] | null;

  ownerId?: Snowflake | null;
  raw: APIChannel;
  overwrites = observable.array<ChannelPermissionOverwrite>();
  private readonly logger = new Logger({
    tag: "Channel",
  });
  private hasFetchedInitialMessages = false;

  constructor(
    private readonly app: AppStore,
    channel: APIChannel,
  ) {
    this.id = channel.id;
    this.type = channel.type;

    this.name = channel.name;
    this.topic = channel.topic;

    this.parentId = channel.parentId;
    if (channel.parent) this._parent = this.app.channels.add(channel.parent);

    this.spaceId = channel.spaceId;

    if (channel.space) this._space = this.app.spaces.add(channel.space);

    this.lastMessageId = channel.lastMessageId;

    this.position = channel.position;

    this.nsfw = channel.nsfw;

    this.flags = BitField.fromString(channelFlags, channel.flags.toString());

    this.icon = channel.icon;

    this.createdAt = new Date(channel.createdAt);
    this.updatedAt = new Date(channel.updatedAt);

    this.raw = channel;

    this.messages = new MessageStore(this.app, this.id);

    if (channel.messages) this.messages.addAll(channel.messages);

    if (channel.lastMessage)
      this._lastMessage = this.messages.add(channel.lastMessage);

    this.recipientIds = channel.recipientIds ?? this.recipientIds ?? null;
    if (channel.recipients)
      this._recipients = observable.array(
        this.app.users.addAll(channel.recipients),
      );

    this.ownerId = channel.ownerId;
    if (channel.owner) this._owner = this.app.users.add(channel.owner);

    this.overwrites = observable.array(
      (channel.overwrites || []).map(
        (ow) => new ChannelPermissionOverwrite(this.app, ow),
      ),
    );

    makeAutoObservable(this, {}, { autoBind: true });
  }

  _owner: User | null = null;

  get owner() {
    if (!this.ownerId) return null;

    return this.app.users.get(this.ownerId) || this._owner || null;
  }

  _lastMessage: Message | null = null;

  get lastMessage() {
    if (this._lastMessage) return this._lastMessage;

    try {
      const local = Array.from(this.messages.all || []);
      const queued = this.app.queue.get(this.id);

      const combined: (Message | QueuedMessage)[] = [...local, ...queued];

      if (combined.length === 0) return null;

      combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return combined[0] ?? null;
    } catch {
      return null;
    }
  }

  _parent: Channel | null = null;

  get parent(): Channel | null | undefined {
    if (!this.parentId) return null;

    return (
      this.app.channels.get(this.parentId) ||
      this.space?.channels.find((ch) => ch.id === this.parentId) ||
      this._parent
    );
  }

  _space: Space | null = null;

  get space() {
    if (!this.spaceId) return null;

    return this.app.spaces.get(this.spaceId) || this._space;
  }

  _recipients = observable.array<User>();

  get recipients() {
    return this._recipients;
  }

  get listId() {
    const parts: string[] = [];

    // p = parent
    // c = channel
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
    if (!sorted.length) return "everyone";

    return murmur(sorted.join(","));
  }

  get iconUrl() {
    if (!this.icon) return null;
    return Channel.constructIconUrl(
      this.id,
      this.icon.startsWith("a_"),
      this.icon,
    );
  }

  get hasChildren(): boolean {
    return this.app.channels.all.some((ch) => ch.parentId === this.id);
  }

  get hasParent(): boolean {
    return !!this.raw.parentId;
  }

  get isDM() {
    return this.type === ChannelType.DM;
  }

  get isGroupDM() {
    return this.type === ChannelType.GroupDM;
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

  get dmRecipients() {
    const ids = this.recipientIds ?? [];
    if (!ids.length) return [];

    const meId = this.app.account?.id;

    const filteredIds = ids.filter((id) => id !== meId);

    const fromStore = filteredIds
      .map((id) => this.app.users.get(id))
      .filter((u): u is NonNullable<typeof u> => !!u);

    if (fromStore.length) return fromStore;

    return this._recipients.filter((u) => u.id !== meId);
  }

  get dmRecipientsList() {
    const ids = this.recipientIds ?? [];
    if (!ids.length) return [];

    const fromStore = ids
      .map((id) => this.app.users.get(id))
      .filter((u) => !!u);

    if (fromStore.length) return fromStore;

    return this._recipients;
  }

  get dmRecipient() {
    return this.type === ChannelType.DM ? this.dmRecipients[0] : undefined;
  }

  get canRedirect() {
    return !this.isCategory;
  }

  get voiceStates() {
    return this.app.voiceStates.getAllByChannel(this.id);
  }

  static constructIconUrl(
    channelId: Snowflake,
    animated = false,
    hash?: string | null,
    size: Sizes = 128,
    format: ChannelIconFormat = ImageFormat.WebP,
  ) {
    if (!hash) return null;
    return REST.makeCDNUrl(
      CDNRoutes.channelIcon(channelId, hash, format, size, animated),
    );
  }

  addRecipient(user: User) {
    if (!this._recipients.some((r) => r.id === user.id))
      this._recipients.push(user);
  }

  removeRecipient(userId: Snowflake) {
    const idx = this._recipients.findIndex((r) => r.id === userId);
    if (idx !== -1) this._recipients.splice(idx, 1);
    this.recipientIds =
      this.recipientIds?.filter((id) => id !== userId) ?? null;
  }

  close() {
    return this.app.channels.closeDM(this.id);
  }

  update(channel: APIChannel) {
    this.type = channel.type;
    this.name = channel.name;
    this.topic = channel.topic;
    this.position = channel.position;
    this.nsfw = channel.nsfw;

    this.parentId = channel.parentId ?? null;
    this._parent = channel.parent
      ? this.app.channels.add(channel.parent)
      : null;

    this.spaceId = channel.spaceId ?? null;
    this._space = channel.space
      ? this.app.spaces.add(channel.space)
      : (this.space ?? null);

    this.icon = channel.icon ?? null;

    this.recipientIds = channel.recipientIds ?? this.recipientIds ?? null;
    if (channel.recipients)
      this._recipients.replace(this.app.users.addAll(channel.recipients));

    this.overwrites = observable.array(
      (channel.overwrites || []).map(
        (ow) => new ChannelPermissionOverwrite(this.app, ow),
      ),
    );

    this.flags = BitField.fromString(channelFlags, channel.flags.toString());

    this.createdAt = new Date(channel.createdAt);
    this.updatedAt = new Date(channel.updatedAt);

    this.raw = channel;

    this._lastMessage = channel.lastMessage
      ? this.messages.add(channel.lastMessage)
      : null;

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
      if (isInitial && this.hasFetchedInitialMessages) {
        resolve(Math.min(this.messages.count, limit ?? 50));
        return;
      }

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
      | {
          content: string;
          nonce: string;
          expressionIds?: string[];
          sharedPostId?: string;
          codedLinks?: Array<{ type: 0 | 1; code: string }>;
        }
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
        {
          content: string;
          nonce: string;
          expressionIds?: string[];
          sharedPostId?: string;
          codedLinks?: Array<{ type: 0 | 1; code: string }>;
        }
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

  toJSON() {
    return this.raw;
  }
}
