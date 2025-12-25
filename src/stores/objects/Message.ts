import type { APIMessage, APIMessageEmbed, Snowflake } from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import type { Space } from "@stores/objects/Space";
import { makeObservable } from "mobx";
import type { Channel } from "./Channel";
import { MessageBase } from "./MessageBase";
import type { QueuedMessage, QueuedMessageData } from "./QueuedMessage";

export type MessageLike = Message | QueuedMessage;
export type MessageLikeData = APIMessage | QueuedMessageData;

export class Message extends MessageBase {
    channelId: Snowflake;
    updatedAt?: Date | null;

    nonce?: Snowflake | null;
    spaceId?: Snowflake | null;
    embeds: APIMessageEmbed[];

    edited: boolean;

    space?: Space | null;
    channel?: Channel | null;

    constructor(app: AppStore, data: APIMessage) {
        super(app, data);

        this.id = data.id;

        this.channelId = data.channelId;
        if (data.channel) this.channel = this.app.channels.add(data.channel);

        this.channel = this.app.channels.get(this.channelId);

        this.content = data.content;
        this.createdAt = new Date(data.createdAt);
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
        this.nonce = data.nonce;
        this.edited = data.edited ?? false;
        this.channelId = data.channelId;

        this.embeds = data.embeds;

        this.spaceId = data.spaceId;
        if (data.space) this.space = this.app.spaces.add(data.space);

        makeObservable(this);
    }

    update(message: APIMessage) {
        Object.assign(this, message);

        this.createdAt = new Date(message.createdAt);
        this.updatedAt = message.updatedAt ? new Date(message.updatedAt) : null;
        this.edited = message.edited ?? this.edited;
    }

    async delete() {
        return this.app.rest.delete(
            `/channels/${this.channelId}/messages/${this.id}`,
        );
    }
}
