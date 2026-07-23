import type {
  APIExpression,
  APIUser,
  MessageType,
  Snowflake,
} from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import { formatRestError } from "@mutualzz/client";
import { action, makeObservable, observable } from "mobx";
import type { Expression } from "./Expression";
import { MessageBase, messageBaseMobxAnnotations } from "./MessageBase";
import i18n from "../../i18n";
import { type Message } from "./Message";

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
  repliedTo?: Message | null;
  mentionReply?: boolean;
}

export class QueuedMessage extends MessageBase {
  progress = 0;
  status: QueuedMessageStatus;
  error?: string;
  expressions = observable.array<Expression>();
  mentionReply = true;

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
    this.mentionReply = data.mentionReply ?? true;
    this.expressions = observable.array<Expression>(
      data.expressions ? app.expressions.addAll(data.expressions) : [],
    );

    makeObservable<
      QueuedMessage,
      "_author" | "_space" | "_channel" | "_repliedTo"
    >(this, {
      ...messageBaseMobxAnnotations,
      progress: observable,
      status: observable,
      error: observable,
      expressions: observable,
      mentionReply: observable,
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
    const body = {
      content: this.content ?? "",
      nonce: this.id,
      ...(expressionIds.length ? { expressionIds } : {}),
      ...(this.repliedToId
        ? {
            repliedToId: this.repliedToId,
            mentionReply: this.mentionReply,
          }
        : {}),
    };

    try {
      await channel.sendMessage(body, this);
    } catch (e) {
      this.fail(formatRestError(e, i18n.t("errors.unknown", { ns: "common" })));
    }
  }

  delete() {
    this.app.queue.remove(this.id);
    return null;
  }
}
