import type { MessageType, Snowflake } from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import type { MessageLikeData } from "./Message";
import type { User } from "./User";
import type { Space } from "@stores/objects/Space";
import type { Channel } from "@stores/objects/Channel";
import { isLoadedRelation } from "@utils/apiRelations";
import { computed, type AnnotationsMap, observable } from "mobx";

export const messageBaseMobxAnnotations: AnnotationsMap<
    MessageBase,
    "_author" | "_space" | "_channel" | "_repliedTo"
> = {
    id: observable,
    content: observable,
    createdAt: observable,
    type: observable,
    authorId: observable,
    spaceId: observable,
    channelId: observable,
    repliedToId: observable,

    _author: observable.ref,
    _space: observable.ref,
    _channel: observable.ref,
    _repliedTo: observable.ref,

    author: computed,
    space: computed,
    channel: computed,
    member: computed,
    repliedTo: computed,
};

export class MessageBase {
    id: Snowflake;
    content?: string | null;
    createdAt: Date;
    type: MessageType;
    authorId: Snowflake;
    spaceId?: Snowflake | null;
    channelId: Snowflake | null;
    repliedToId?: Snowflake | null;
    protected app: AppStore;

    _author!: User | null;
    _space!: Space | null;
    _channel!: Channel | null;
    _repliedTo: MessageBase | null = null;

    constructor(app: AppStore, data: MessageLikeData) {
        this.app = app;
        this._author = null;
        this._space = null;
        this._channel = null;

        this.id = data.id;
        this.content = data.content;
        this.createdAt = new Date(data.createdAt);
        this.type = data.type;

        this.spaceId = data.spaceId;
        this.channelId = data.channelId;
        this.repliedToId =
            "repliedToId" in data ? (data.repliedToId ?? null) : null;

        this.authorId = data.authorId;
        if (isLoadedRelation(data.author)) {
            this._author = this.app.users.add(data.author);
        }

        if ("channel" in data && isLoadedRelation(data.channel)) {
            this._channel = this.app.channels.add(data.channel);
        }

        if ("space" in data && isLoadedRelation(data.space)) {
            this._space = this.app.spaces.add(data.space);
        }

        if ("repliedTo" in data && isLoadedRelation(data.repliedTo)) {
            this._repliedTo =
                this.channel?.messages.add(data.repliedTo) ?? null;
        }
    }

    get author() {
        return this.app.users.get(this.authorId) || this._author;
    }

    get space() {
        if (!this.spaceId) return null;
        return this.app.spaces.get(this.spaceId) || this._space;
    }

    get channel(): Channel | null | undefined {
        if (!this.channelId) return null;
        return (
            this.app.channels.get(this.channelId) ||
            this.space?.channels.find((ch) => ch.id === this.channelId) ||
            this._channel
        );
    }

    get member() {
        return this.space?.members.get(this.authorId);
    }

    get repliedTo(): MessageBase | null | undefined {
        return (
            this.channel?.messages.get(this.repliedToId ?? "") || this._repliedTo
        );
    }
}
