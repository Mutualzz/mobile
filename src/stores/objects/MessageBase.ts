import type { MessageType, Snowflake } from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import type { MessageLikeData } from "./Message";
import { User } from "./User";

export class MessageBase {
    protected app: AppStore;
    id: Snowflake;
    content?: string | null;
    createdAt: Date;
    type: MessageType;

    authorId: Snowflake;
    author?: User | null;

    constructor(app: AppStore, data: MessageLikeData) {
        this.app = app;
        this.id = data.id;
        this.content = data.content;
        this.createdAt = new Date(data.createdAt);
        this.type = data.type;

        this.authorId = data.authorId;
        if (data.author) this.author = this.app.users.add(data.author);
    }
}
