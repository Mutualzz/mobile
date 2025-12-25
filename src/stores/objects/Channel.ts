import { Logger } from "@mutualzz/logger";
import type { Snowflake } from "@mutualzz/types";
import {
    BitField,
    channelFlags,
    ChannelType,
    type APIChannel,
    type APIMessage,
    type ChannelFlags,
} from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import { MessageStore } from "@stores/Message.store";
import { Message } from "@stores/objects/Message";
import type { Space } from "@stores/objects/Space";
import { makeAutoObservable } from "mobx";
import type { QueuedMessage } from "./QueuedMessage";

export class Channel {
    private readonly logger = new Logger({
        tag: "Channel",
    });

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
    parent?: Channel | null;

    spaceId?: Snowflake | null;
    space?: Space | null;

    raw: APIChannel;

    lastMessageId?: Snowflake | null;
    lastMessage?: Message | null;

    private hasFetchedInitialMessages = false;

    constructor(
        private readonly app: AppStore,
        channel: APIChannel,
    ) {
        this.app = app;

        this.id = channel.id;
        this.type = channel.type;

        this.name = channel.name;
        this.topic = channel.topic;

        this.parentId = channel.parentId;
        if (channel.parent) this.parent = this.app.channels.add(channel.parent);

        this.spaceId = channel.spaceId;

        if (channel.space) this.space = this.app.spaces.add(channel.space);

        this.position = channel.position;

        this.nsfw = channel.nsfw;

        this.flags = BitField.fromString(
            channelFlags,
            channel.flags.toString(),
        );

        this.createdAt = new Date(channel.createdAt);
        this.updatedAt = new Date(channel.updatedAt);

        this.raw = channel;

        this.messages = new MessageStore(this.app, this.id);

        if (channel.messages) this.messages.addAll(channel.messages);

        this.lastMessageId = channel.lastMessageId;
        if (channel.lastMessage)
            this.lastMessage = this.messages.add(channel.lastMessage);

        makeAutoObservable(this);
    }

    update(channel: APIChannel) {
        Object.assign(this, channel);
    }

    setParent(channel: Channel | null) {
        this.parentId = channel?.id || null;
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
                this.logger.info(
                    `Fetching messages for ${this.id} before ${before}`,
                );

            this.app.rest
                .get<APIMessage[]>(`/channels/${this.id}/messages`, opts)
                .then((res) => {
                    this.messages.addAll(
                        res.filter((x) => !this.messages.has(x.id)),
                    );
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
        data: { content: string; nonce: string } | FormData,
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
                { content: string; nonce: string }
            >(`/channels/${this.id}/messages`, data)
            .catch((err) => {
                this.logger.error(err);
                throw err;
            });
    }

    get listId() {
        let listId = "everyone";

        // TODO: implement this when permission system is implemented
        // const perms: string[] = [];
        //
        // for (const overwrite of this.permissionOverwrites) {
        //     const { id, allow, deny } = overwrite;
        //
        //     if (allow.toBigInt() & Permissions.FLAGS.VIEW_CHANNEL)
        //         perms.push(`allow:${id}`);
        //     else if (deny.toBigInt() & Permissions.FLAGS.VIEW_CHANNEL)
        //         perms.push(`deny:${id}`);
        // }
        //
        // if (perms.length) {
        //     listId = murmur(perms.sort().join(",")).toString();
        // }

        return listId;
    }

    get hasChildren(): boolean {
        return this.app.channels.all.some((ch) => ch.parent?.id === this.id);
    }

    get hasParent(): boolean {
        return !!this.raw.parentId;
    }

    get isDM() {
        return (
            this.type === ChannelType.DM || this.type === ChannelType.GroupDM
        );
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
