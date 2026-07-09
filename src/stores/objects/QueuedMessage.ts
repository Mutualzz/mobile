import type { APIExpression, APIUser, MessageType, Snowflake } from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import { action, makeObservable, observable } from "mobx";
import type { Expression } from "./Expression";
import { MessageBase, messageBaseMobxAnnotations } from "./MessageBase";

export enum QueuedMessageStatus {
    Sending = "sending",
    Failed = "failed",
}

export interface QueuedMessageData {
    id: Snowflake;
    channelId: Snowflake;
    spaceId?: Snowflake | null;
    content: string;
    type: MessageType;
    createdAt: string;
    authorId: Snowflake;
    author?: APIUser;
    expressionIds?: Snowflake[];
    expressions?: APIExpression[];
    repliedToId?: Snowflake | null;
    repliedTo?: import("@mutualzz/types").APIMessage;
}

export class QueuedMessage extends MessageBase {
    progress = 0;
    status: QueuedMessageStatus;
    error?: string;
    expressions = observable.array<Expression>();

    abortCallback?: () => void;

    constructor(app: AppStore, data: QueuedMessageData) {
        super(app, data);

        this._author = this._author ?? null;
        this._space = this._space ?? null;
        this._channel = this._channel ?? null;

        this.id = data.id;
        this.channelId = data.channelId;
        this.spaceId = data.spaceId ?? null;
        this.status = QueuedMessageStatus.Sending;
        this.error = undefined;
        this.abortCallback = undefined;
        this.expressions = observable.array<Expression>(
            data.expressions ? app.expressions.addAll(data.expressions) : [],
        );

        makeObservable<QueuedMessage, "_author" | "_space" | "_channel" | "_repliedTo">(this, {
            ...messageBaseMobxAnnotations,
            progress: observable,
            status: observable,
            error: observable,
            expressions: observable,
            abortCallback: observable.ref,
            updateProgress: action.bound,
            setAbortCallback: action.bound,
            abort: action.bound,
            fail: action.bound,
            retry: action.bound,
        });
    }

    updateProgress(e: ProgressEvent) {
        this.progress = Math.round((e.loaded / e.total) * 100);
    }

    setAbortCallback(cb: () => void) {
        this.abortCallback = cb;
    }

    abort() {
        if (this.abortCallback) {
            this.abortCallback();
        }
    }

    fail(error: string) {
        this.error = error;
        this.status = QueuedMessageStatus.Failed;
    }

    async retry() {
        const channel = this.channel;
        if (!channel) return;

        this.status = QueuedMessageStatus.Sending;
        this.error = undefined;

        const expressionIds = this.expressions.map((expression) => expression.id);

        try {
            await channel.sendMessage(
                {
                    content: this.content ?? "",
                    nonce: this.id,
                    ...(expressionIds.length ? { expressionIds } : {}),
                },
                this,
            );
        } catch (e) {
            const error =
                e instanceof Error
                    ? e.message
                    : typeof e === "string"
                      ? e
                      : "Unknown error";
            this.fail(error);
        }
    }

    delete() {
        this.app.queue.remove(this.id);
        return null;
    }
}
