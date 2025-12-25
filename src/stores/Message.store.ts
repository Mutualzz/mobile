import type { Snowflake } from "@mutualzz/types";
import { type APIMessage, MessageType } from "@mutualzz/types";
import { type IObservableArray, makeAutoObservable, observable } from "mobx";
import type { AppStore } from "./App.store";
import { Message, type MessageLike } from "./objects/Message";
import type { User } from "./objects/User";

export interface MessageGroup {
    author: User;
    messages: MessageLike[];
    createdAt: Date;
}

export class MessageStore {
    private readonly app: AppStore;
    private readonly channelId: Snowflake;

    private readonly messages: IObservableArray<Message>;

    constructor(app: AppStore, channelId: Snowflake) {
        this.app = app;
        this.channelId = channelId;

        this.messages = observable.array([]);

        makeAutoObservable(this);
    }

    clear() {
        this.messages.clear();
    }

    add(message: APIMessage) {
        const existing = this.get(message.id);
        if (existing) return existing;

        const newMessage = new Message(this.app, message);
        this.messages.push(newMessage);
        return newMessage;
    }

    addAll(messages: APIMessage[]) {
        return messages.map((message) => this.add(message));
    }

    get(id: string) {
        return this.messages.find((message) => message.id === id);
    }

    has(id: string) {
        return this.messages.some((message) => message.id === id);
    }

    remove(id: Snowflake) {
        const message = this.get(id);
        if (!message) return;
        this.messages.remove(message);
    }

    update(message: APIMessage) {
        const oldMessage = this.get(message.id);
        if (!oldMessage) return;

        this.messages[this.messages.indexOf(oldMessage)] = new Message(
            this.app,
            message,
        );
    }

    get count() {
        return this.messages.length;
    }

    get groups(): MessageGroup[] {
        // Sort messages by timestamp in descending order (most recent first)
        const sortedMessages: MessageLike[] = [
            ...this.messages,
            ...Array.from(this.app.queue.messages.values()).filter(
                (x) => x.channelId === this.channelId,
            ),
        ];

        return sortedMessages
            .slice()
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .reduce((groups, message) => {
                const lastGroup = groups[groups.length - 1];
                const lastMessage =
                    lastGroup?.messages[lastGroup.messages.length - 1];
                if (
                    lastMessage &&
                    lastMessage.author?.id === message.author?.id &&
                    lastMessage.type === message.type &&
                    message.type === MessageType.Default &&
                    lastMessage.createdAt.getTime() -
                        message.createdAt.getTime() <=
                        10 * 60 * 1000
                ) {
                    // add to last group
                    lastGroup.messages.push(message);
                    lastGroup.createdAt = message.createdAt;
                } else {
                    // create new group
                    groups.push({
                        author: message.author!,
                        messages: [message],
                        createdAt: message.createdAt,
                    });
                }
                return groups;
            }, [] as MessageGroup[]);
    }

    get all() {
        return this.messages;
    }

    async resolve(channelId: string, id: string, force = false) {
        if (this.has(id) && !force) return this.get(id);
        const message = await this.app.rest.get<APIMessage>(
            `/channels/${channelId}/messages/${id}`,
        );
        if (!message) return undefined;
        return this.add(message);
    }
}
