import type { APIUser, MessageType, Snowflake } from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import { MessageBase } from "./MessageBase";

export enum QueuedMessageStatus {
    Sending = "sending",
    Failed = "failed",
}

export type QueuedMessageData = {
    id: Snowflake;
    channelId: Snowflake;
    spaceId?: Snowflake | null;
    content: string;
    type: MessageType;
    createdAt: string;
    authorId: Snowflake;
    author?: APIUser;
};

export class QueuedMessage extends MessageBase {
    channelId: Snowflake;
    spaceId?: Snowflake | null;
    progress = 0;
    status: QueuedMessageStatus;
    error?: string;

    abortCallback?: () => void;

    constructor(app: AppStore, data: QueuedMessageData) {
        super(app, data);
        this.id = data.id;
        this.channelId = data.channelId;
        this.spaceId = data.spaceId ?? null;
        this.status = QueuedMessageStatus.Sending;
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
}
