import type { APIMessage, Snowflake } from "@mutualzz/types";
import { makeAutoObservable, observable, type IObservableArray } from "mobx";
import type { AppStore } from "./App.store";
import {
    QueuedMessage,
    QueuedMessageStatus,
    type QueuedMessageData,
} from "./objects/QueuedMessage";

export class MessageQueue {
    readonly messages: IObservableArray<QueuedMessage>;

    constructor(private readonly app: AppStore) {
        this.messages = observable.array([]);

        makeAutoObservable(this);
    }

    add(data: QueuedMessageData) {
        const msg = new QueuedMessage(this.app, data);
        this.messages.push(msg);
        return msg;
    }

    remove(id: Snowflake) {
        const message = this.messages.find((x) => String(x.id) === String(id));
        if (!message) return;
        this.messages.remove(message);
    }

    send(id: Snowflake) {
        const message = this.messages.find((x) => String(x.id) === String(id));
        if (!message) return;
        message.status = QueuedMessageStatus.Sending;
    }

    get(channel: Snowflake) {
        return this.messages.filter((message) => message.channelId === channel);
    }

    handleIncomingMessage(message: APIMessage) {
        if (!message.nonce) return;

        const nonce = String(message.nonce);
        if (!this.get(message.channelId).some((x) => String(x.id) === nonce))
            return;

        this.remove(nonce);
    }

    commitSentMessage(message: APIMessage) {
        const channel = this.app.channels.get(message.channelId);
        if (channel) {
            const added = channel.messages.add(message);
            channel.updateLastMessage(added);
        }

        this.handleIncomingMessage(message);
    }

    clear() {
        this.messages.clear();
    }
}
