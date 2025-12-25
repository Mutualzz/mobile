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
        const message = this.messages.find((x) => x.id === id)!;
        this.messages.remove(message);
    }

    send(id: Snowflake) {
        const message = this.messages.find((x) => x.id === id)!;
        message.status = QueuedMessageStatus.Sending;
    }

    get(channel: Snowflake) {
        return this.messages.filter((message) => message.channelId === channel);
    }

    handleIncomingMessage(message: APIMessage) {
        if (!message.nonce) return;

        if (!this.get(message.channelId).find((x) => x.id === message.nonce))
            return;

        this.remove(message.nonce);
    }
}
