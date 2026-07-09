import type {
  APIMessage,
  APIAttachment,
  APIMessageEmbed,
  APIMessageReaction,
  APIMessageReactionEmoji,
  APIMessageReactionEvent,
  APIMessageReactionRemoveAllEvent,
  APIMessageReactionRemoveEmojiEvent,
  APIMessageReactionRemoveEvent,
  Snowflake,
} from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import { isLoadedRelation } from "@utils/apiRelations";
import { action, makeObservable, observable } from "mobx";
import { type Expression } from "./Expression";
import { MessageBase, messageBaseMobxAnnotations } from "./MessageBase";
import type { QueuedMessage, QueuedMessageData } from "./QueuedMessage";
import {
  applyReactionAdd,
  applyReactionRemove,
  applyReactionRemoveEmoji,
  reactionEmojiToBody,
  reactionEmojisMatch,
} from "@utils/reactions";

export type MessageLike = Message | QueuedMessage;
export type MessageLikeData = APIMessage | QueuedMessageData;

export class Message extends MessageBase {
  updatedAt?: Date | null;

  nonce?: Snowflake | null;
  embeds: APIMessageEmbed[];
  attachments: APIAttachment[];
  expressions = observable.array<Expression>();
  reactions: APIMessageReaction[] = [];

  edited: boolean;

  editing = false;

  constructor(app: AppStore, data: APIMessage) {
    super(app, data);

    this._author = this._author ?? null;
    this._space = this._space ?? null;
    this._channel = this._channel ?? null;

    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
    this.nonce = data.nonce;
    this.edited = data.edited ?? false;
    this.embeds = data.embeds ?? [];
    this.attachments = data.attachments ?? [];
    this.expressions = observable.array<Expression>(
      this.app.expressions.addAll(data.expressions ?? []),
    );
    this.reactions = data.reactions ?? [];

        makeObservable<Message, "_author" | "_space" | "_channel" | "_repliedTo">(this, {
            ...messageBaseMobxAnnotations,
      updatedAt: observable,
      nonce: observable,
      embeds: observable.shallow,
      attachments: observable.shallow,
      expressions: observable,
      reactions: observable.shallow,
      edited: observable,
      editing: observable,
      update: action.bound,
      setEditing: action.bound,
      setReactions: action.bound,
      handleReactionAdd: action.bound,
      handleReactionRemove: action.bound,
      handleReactionRemoveEmoji: action.bound,
      handleReactionRemoveAll: action.bound,
      toggleReaction: action.bound,
    });
  }

  update(message: APIMessage) {
    this.id = message.id;
    this.channelId = message.channelId;

    if (isLoadedRelation(message.channel)) {
      this._channel = this.app.channels.add(message.channel);
    }

    this.spaceId = message.spaceId ?? null;
    if (isLoadedRelation(message.space)) {
      this._space = this.app.spaces.add(message.space);
    }

    this.content = message.content;
    this.nonce = message.nonce ?? null;
    this.embeds = message.embeds ?? this.embeds ?? [];
    this.attachments = message.attachments ?? this.attachments ?? [];
    this.expressions = observable.array<Expression>(
      this.app.expressions.addAll(
        message.expressions ??
          this.expressions.map((exp) => exp.toJSON()) ??
          [],
      ),
    );
    this.reactions = message.reactions ?? this.reactions;

    this.createdAt = new Date(message.createdAt);
    this.updatedAt = message.updatedAt ? new Date(message.updatedAt) : null;

    this.edited = message.edited ?? this.edited;
    this.type = message.type;
    this.repliedToId = message.repliedToId ?? null;
    if (isLoadedRelation(message.repliedTo)) {
      this._repliedTo = this.channel?.messages.add(message.repliedTo) ?? null;
    }
  }

  setEditing(value: boolean) {
    this.editing = value;
  }

  setReactions(reactions: APIMessageReaction[]) {
    this.reactions = reactions;
  }

  handleReactionAdd(payload: APIMessageReactionEvent) {
    this.setReactions(
      applyReactionAdd(this.reactions, payload, this.app.account?.id),
    );
  }

  handleReactionRemove(payload: APIMessageReactionRemoveEvent) {
    this.setReactions(
      applyReactionRemove(this.reactions, payload, this.app.account?.id),
    );
  }

  handleReactionRemoveEmoji(payload: APIMessageReactionRemoveEmojiEvent) {
    this.setReactions(applyReactionRemoveEmoji(this.reactions, payload));
  }

  handleReactionRemoveAll(_payload: APIMessageReactionRemoveAllEvent) {
    this.setReactions([]);
  }

  async toggleReaction(emoji: APIMessageReactionEmoji) {
    const path = `/channels/${this.channelId}/messages/${this.id}/reactions/@me`;
    const body = reactionEmojiToBody(emoji);
    const existing = this.reactions.find((reaction) =>
      reactionEmojisMatch(reaction.emoji, emoji),
    );
    const previous = this.reactions;

    if (existing?.me) {
      this.handleReactionRemove({
        channelId: this.channelId!,
        messageId: this.id,
        userId: this.app.account!.id,
        emoji,
      });

      try {
        await this.app.rest.delete(path, {}, body);
      } catch {
        this.setReactions(previous);
        throw new Error("Failed to remove reaction");
      }

      return;
    }

    this.handleReactionAdd({
      channelId: this.channelId!,
      messageId: this.id,
      userId: this.app.account!.id,
      emoji,
    });

    try {
      await this.app.rest.put(path, body);
    } catch {
      this.setReactions(previous);
      throw new Error("Failed to add reaction");
    }
  }

  async edit(content: string) {
    const updated = await this.app.rest.patch<APIMessage, { content: string }>(
      `/channels/${this.channelId}/messages/${this.id}`,
      { content },
    );

    if (!content.trim()) {
      this.channel?.messages.remove(this.id);
      this.setEditing(false);
      return updated;
    }

    this.update(updated);
    this.setEditing(false);
    return updated;
  }

  async delete() {
    return this.app.rest.delete(
      `/channels/${this.channelId}/messages/${this.id}`,
    );
  }

  dismiss() {
    this.channel?.messages.remove(this.id);
  }
}
