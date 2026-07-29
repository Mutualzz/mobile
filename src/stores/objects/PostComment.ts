import type {
  APIMessageEmbed,
  APIPostComment,
  Snowflake,
} from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import { type Expression } from "@stores/objects/Expression";
import type { User } from "@stores/objects/User";
import { action, computed, makeObservable, observable } from "mobx";

export class PostComment {
  id: Snowflake;
  postId: Snowflake;
  authorId: Snowflake;
  content: string;
  embeds: APIMessageEmbed[];
  expressionIds: Snowflake[];
  expressions = observable.array<Expression>();
  repliedToId: Snowflake | null;
  edited: boolean;
  createdAt: Date;
  updatedAt?: Date | null;

  protected app: AppStore;

  _author?: User | null;

  constructor(app: AppStore, data: APIPostComment) {
    this.app = app;

    this.id = data.id;
    this.postId = data.postId;
    this.authorId = data.authorId;
    if (data.author) this._author = this.app.users.add(data.author);

    this.content = data.content;
    this.embeds = data.embeds ?? [];
    this.expressionIds = data.expressionIds ?? [];
    this.expressions = observable.array<Expression>(
      this.app.expressions.addAll(data.expressions ?? []),
    );
    this.repliedToId = data.repliedToId ?? null;
    this.edited = data.edited;
    this.createdAt = new Date(data.createdAt);
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;

    makeObservable<this, "_author">(this, {
      content: observable,
      embeds: observable.shallow,
      expressionIds: observable.shallow,
      expressions: observable,
      repliedToId: observable,
      edited: observable,
      createdAt: observable,
      updatedAt: observable,
      _author: observable.ref,
      author: computed,
      post: computed,
      repliedTo: computed,
      update: action.bound,
      delete: action.bound,
    });
  }

  get author() {
    return this.app.users.get(this.authorId) || this._author;
  }

  get post() {
    return this.app.posts.get(this.postId);
  }

  get repliedTo(): PostComment | null {
    return this.repliedToId
      ? (this.post?.comments.get(this.repliedToId) ?? null)
      : null;
  }

  update(data: APIPostComment) {
    this.content = data.content;
    this.embeds = data.embeds ?? this.embeds;
    this.expressionIds = data.expressionIds ?? [];
    this.expressions = observable.array<Expression>(
      this.app.expressions.addAll(data.expressions ?? []),
    );
    this.edited = data.edited;
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
  }

  async edit(content: string) {
    const updated = await this.app.rest.patch<
      APIPostComment,
      { content: string }
    >(`/posts/${this.postId}/comments/${this.id}`, { content });

    this.update(updated);
    return updated;
  }

  async delete() {
    await this.app.rest.delete(`/posts/${this.postId}/comments/${this.id}`);

    const post = this.post;
    for (const comment of post?.comments.all ?? []) {
      if (comment.repliedToId === this.id) comment.repliedToId = null;
    }

    post?.comments.remove(this.id);
    post?.bumpCommentCount(-1);
  }
}
