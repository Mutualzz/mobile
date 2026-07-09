import type { APIPost, Snowflake } from "@mutualzz/types";
import { makeAutoObservable, observable, type ObservableMap } from "mobx";
import type { AppStore } from "./App.store";
import { Post } from "./objects/Post";

export interface PickedPostAsset {
  uri: string;
  type: string;
  name: string;
}

export class PostStore {
  private readonly posts: ObservableMap<string, Post>;

  constructor(private readonly app: AppStore) {
    this.posts = observable.map();

    makeAutoObservable(this, {}, { autoBind: true });
  }

  get all() {
    return Array.from(this.posts.values());
  }

  get count() {
    return this.posts.size;
  }

  clear() {
    this.posts.clear();
  }

  add(data: APIPost): Post {
    const existing = this.posts.get(data.id);
    if (existing) return existing;

    const post = new Post(this.app, data);
    this.posts.set(data.id, post);
    return post;
  }

  private upsert(data: APIPost): Post {
    const existing = this.posts.get(data.id);
    if (existing) {
      existing.update(data);
      return existing;
    }

    return this.add(data);
  }

  addAll(data: APIPost[]): Post[] {
    if (!data) return [];
    return data.map((post) => this.upsert(post));
  }

  get(id: Snowflake) {
    return this.posts.get(id);
  }

  has(id: Snowflake) {
    return this.posts.has(id);
  }

  update(data: APIPost) {
    this.posts.get(data.id)?.update(data);
  }

  remove(id: Snowflake) {
    this.posts.delete(id);
  }

  async resolve(id: Snowflake, force = false) {
    if (this.has(id) && !force) return this.get(id);

    const data = await this.app.rest.get<APIPost>(`/posts/${id}`);
    if (!data) return undefined;
    return this.upsert(data);
  }

  async getFriendsFeed(opts?: {
    before?: string;
    after?: string;
    limit?: number;
  }) {
    const data = await this.app.rest.get<APIPost[]>("/posts/friends", {
      ...(opts?.before ? { before: opts.before } : {}),
      ...(opts?.after ? { after: opts.after } : {}),
      ...(opts?.limit ? { limit: opts.limit } : {}),
    });

    return this.addAll(data);
  }

  async getForYouFeed(opts?: { page?: number; limit?: number }) {
    const data = await this.app.rest.get<APIPost[]>("/posts/for-you", {
      ...(opts?.page ? { page: opts.page } : {}),
      ...(opts?.limit ? { limit: opts.limit } : {}),
    });

    return this.addAll(data);
  }

  async getSavedFeed(opts?: {
    before?: string;
    after?: string;
    limit?: number;
  }) {
    const data = await this.app.rest.get<APIPost[]>("/posts/saved", {
      ...(opts?.before ? { before: opts.before } : {}),
      ...(opts?.after ? { after: opts.after } : {}),
      ...(opts?.limit ? { limit: opts.limit } : {}),
    });

    return this.addAll(data);
  }

  async getScheduledFeed(opts?: { limit?: number }) {
    const data = await this.app.rest.get<APIPost[]>("/posts/scheduled", {
      ...(opts?.limit ? { limit: opts.limit } : {}),
    });

    return this.addAll(data);
  }

  async createPost(
    content: string,
    assets?: PickedPostAsset[],
    scheduledFor?: Date,
    expressionIds?: string[],
  ) {
    if (assets?.length) {
      const formData = new FormData();
      if (content) formData.append("content", content);
      if (scheduledFor) {
        formData.append("scheduledFor", scheduledFor.toISOString());
      }
      assets.forEach((asset) => {
        formData.append("attachments", {
          uri: asset.uri,
          type: asset.type,
          name: asset.name,
        } as unknown as Blob);
      });
      expressionIds?.forEach((id) => formData.append("expressionIds[]", id));

      const data = await this.app.rest.postFormData<APIPost>(
        "/posts",
        formData,
      );

      return this.add(data);
    }

    const data = await this.app.rest.post<
      APIPost,
      { content: string; scheduledFor?: string; expressionIds?: string[] }
    >("/posts", {
      content,
      ...(scheduledFor ? { scheduledFor: scheduledFor.toISOString() } : {}),
      ...(expressionIds?.length ? { expressionIds } : {}),
    });

    return this.add(data);
  }
}
