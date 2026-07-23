import type {
  APIAttachment,
  APIHashtag,
  APIMessageEmbed,
  APIPost,
  APIPostComment,
  Snowflake,
} from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import type { User } from "@stores/objects/User";
import {
  action,
  computed,
  makeObservable,
  observable,
  type IObservableArray,
} from "mobx";
import type { Expression } from "@stores/objects/Expression";
import { PostComment } from "./PostComment";

export class PostCommentStore {
  private readonly app: AppStore;
  private readonly comments: IObservableArray<PostComment>;

  constructor(app: AppStore) {
    this.app = app;
    this.comments = observable.array([]);

    makeObservable(this, {}, { autoBind: true });
  }

  get all() {
    return this.comments;
  }

  get count() {
    return this.comments.length;
  }

  add(data: APIPostComment) {
    const existing = this.get(data.id);
    if (existing) return existing;

    const comment = new PostComment(this.app, data);
    this.comments.push(comment);
    return comment;
  }

  addAll(data: APIPostComment[]) {
    if (!data) return [];
    return data.map((comment) => this.add(comment));
  }

  get(id: Snowflake) {
    return this.comments.find((comment) => comment.id === id);
  }

  has(id: Snowflake) {
    return this.comments.some((comment) => comment.id === id);
  }

  update(data: APIPostComment) {
    this.get(data.id)?.update(data);
  }

  remove(id: Snowflake) {
    const comment = this.get(id);
    if (!comment) return;
    this.comments.remove(comment);
  }
}

export class Post {
  id: Snowflake;
  authorId: Snowflake;
  content?: string | null;
  attachments: APIAttachment[];
  hashtags: APIHashtag[];
  embeds: APIMessageEmbed[];
  expressions = observable.array<Expression>();

  likeCount: number;
  saveCount: number;
  shareCount: number;
  commentCount: number;

  liked: boolean;
  saved: boolean;
  shared: boolean;

  createdAt: Date;
  updatedAt?: Date | null;
  scheduledFor: Date | null;

  comments: PostCommentStore;

  private readonly app: AppStore;
  private hasFetchedComments = false;

  _author?: User | null;

  constructor(app: AppStore, data: APIPost) {
    this.app = app;

    this.id = data.id;
    this.authorId = data.authorId;
    if (data.author) this._author = this.app.users.add(data.author);

    this.content = data.content;
    this.attachments = data.attachments ?? [];
    this.hashtags = data.hashtags ?? [];
    this.embeds = data.embeds ?? [];
    this.expressions = observable.array<Expression>(
      this.app.expressions.addAll(data.expressions ?? []),
    );

    this.likeCount = data.likeCount ?? 0;
    this.saveCount = data.saveCount ?? 0;
    this.shareCount = data.shareCount ?? 0;
    this.commentCount = data.commentCount ?? 0;

    this.liked = data.liked ?? false;
    this.saved = data.saved ?? false;
    this.shared = data.shared ?? false;

    this.createdAt = new Date(data.createdAt);
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
    this.scheduledFor = data.scheduledFor ? new Date(data.scheduledFor) : null;

    this.comments = new PostCommentStore(this.app);

    makeObservable<this, "_author">(this, {
      content: observable,
      attachments: observable.shallow,
      hashtags: observable.shallow,
      embeds: observable.shallow,
      expressions: observable,
      likeCount: observable,
      saveCount: observable,
      shareCount: observable,
      commentCount: observable,
      liked: observable,
      saved: observable,
      shared: observable,
      updatedAt: observable,
      scheduledFor: observable,
      _author: observable.ref,
      author: computed,
      isScheduled: computed,
      update: action.bound,
      toggleLike: action.bound,
      toggleSave: action.bound,
      toggleShare: action.bound,
      bumpLikeCount: action.bound,
      bumpShareCount: action.bound,
      bumpCommentCount: action.bound,
    });
  }

  get author() {
    return this.app.users.get(this.authorId) || this._author;
  }

  get isScheduled() {
    return !!this.scheduledFor && this.scheduledFor.getTime() > Date.now();
  }

  bumpLikeCount(delta: number) {
    this.likeCount = Math.max(0, this.likeCount + delta);
  }

  bumpShareCount(delta: number) {
    this.shareCount = Math.max(0, this.shareCount + delta);
  }

  bumpCommentCount(delta: number) {
    this.commentCount = Math.max(0, this.commentCount + delta);
  }

  update(data: APIPost) {
    this.content = data.content;
    this.attachments = data.attachments ?? this.attachments;
    this.hashtags = data.hashtags ?? this.hashtags;
    this.embeds = data.embeds ?? this.embeds;
    this.expressions = observable.array<Expression>(
      this.app.expressions.addAll(
        data.expressions ?? this.expressions.map((exp) => exp.toJSON()),
      ),
    );

    if (data.likeCount != null) this.likeCount = data.likeCount;
    if (data.saveCount != null) this.saveCount = data.saveCount;
    if (data.shareCount != null) this.shareCount = data.shareCount;
    if (data.commentCount != null) this.commentCount = data.commentCount;

    if (data.liked != null) this.liked = data.liked;
    if (data.saved != null) this.saved = data.saved;
    if (data.shared != null) this.shared = data.shared;

    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
    this.scheduledFor = data.scheduledFor ? new Date(data.scheduledFor) : null;
  }

  async toggleLike() {
    const wasLiked = this.liked;
    const path = `/posts/${this.id}/likes/@me`;

    this.liked = !wasLiked;
    this.likeCount += wasLiked ? -1 : 1;

    try {
      if (wasLiked) await this.app.rest.delete(path);
      else await this.app.rest.put(path);
    } catch (err) {
      this.liked = wasLiked;
      this.likeCount += wasLiked ? 1 : -1;
      throw err;
    }
  }

  async toggleSave() {
    const wasSaved = this.saved;
    const path = `/posts/${this.id}/saves/@me`;

    this.saved = !wasSaved;
    this.saveCount += wasSaved ? -1 : 1;

    try {
      if (wasSaved) await this.app.rest.delete(path);
      else await this.app.rest.put(path);
    } catch (err) {
      this.saved = wasSaved;
      this.saveCount += wasSaved ? 1 : -1;
      throw err;
    }
  }

  async toggleShare() {
    const wasShared = this.shared;
    const path = `/posts/${this.id}/shares/@me`;

    this.shared = !wasShared;
    this.shareCount += wasShared ? -1 : 1;

    try {
      if (wasShared) await this.app.rest.delete(path);
      else await this.app.rest.post(path);
    } catch (err) {
      this.shared = wasShared;
      this.shareCount += wasShared ? 1 : -1;
      throw err;
    }
  }

  async getComments(options?: {
    force?: boolean;
    before?: string;
    limit?: number;
  }) {
    const force = options?.force ?? false;
    const before = options?.before;
    const limit = options?.limit ?? 50;

    if (this.hasFetchedComments && !force && !before) {
      return this.comments.all;
    }

    const query = before
      ? `?before=${before}&limit=${limit}`
      : `?limit=${limit}`;

    const data = await this.app.rest.get<APIPostComment[]>(
      `/posts/${this.id}/comments${query}`,
    );

    this.comments.addAll(data);
    if (!before) this.hasFetchedComments = true;
    return this.comments.all;
  }

  async loadMoreComments(before: string, limit = 50) {
    return this.getComments({ before, limit });
  }

  async addComment(
    content: string,
    expressionIds?: string[],
    repliedToId?: string,
  ) {
    const created = await this.app.rest.post<
      APIPostComment,
      {
        content?: string;
        expressionIds?: string[];
        repliedToId?: string;
      }
    >(`/posts/${this.id}/comments`, {
      ...(content ? { content } : {}),
      expressionIds,
      repliedToId,
    });

    const comment = this.comments.add(created);
    this.commentCount += 1;
    return comment;
  }

  async edit(content: string) {
    const updated = await this.app.rest.patch<APIPost, { content: string }>(
      `/posts/${this.id}`,
      { content },
    );

    this.update(updated);
    return updated;
  }

  async reschedule(date: Date) {
    const updated = await this.app.rest.patch<
      APIPost,
      { scheduledFor: string }
    >(`/posts/${this.id}`, { scheduledFor: date.toISOString() });

    this.update(updated);
    return updated;
  }

  async publishNow() {
    const updated = await this.app.rest.patch<
      APIPost,
      { scheduledFor: null }
    >(`/posts/${this.id}`, { scheduledFor: null });

    this.update(updated);
    return updated;
  }

  async delete() {
    await this.app.rest.delete(`/posts/${this.id}`);
    this.app.posts.remove(this.id);
  }
}
