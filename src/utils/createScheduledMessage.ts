import type { APIScheduledMessage } from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";

export interface ScheduledAttachment {
  uri: string;
  type: string;
  name: string;
  spoiler?: boolean;
}

export interface ScheduleMessageInput {
  content: string;
  stickerIds: string[];
  attachments: ScheduledAttachment[];
  repliedToId?: string;
  mentionReply: boolean;
  scheduledFor: Date;
}

export const createScheduledMessage = async (
  app: AppStore,
  channelId: string,
  input: ScheduleMessageInput,
) => {
  const path = `/channels/${channelId}/scheduled-messages`;
  const scheduledFor = input.scheduledFor.toISOString();

  let result: APIScheduledMessage;

  if (input.attachments.length > 0) {
    const formData = new FormData();
    if (input.content) formData.append("content", input.content);
    formData.append("scheduledFor", scheduledFor);
    input.stickerIds.forEach((stickerId) =>
      formData.append("expressionIds[]", stickerId),
    );
    if (input.repliedToId) {
      formData.append("repliedToId", input.repliedToId);
      formData.append("mentionReply", String(input.mentionReply));
    }
    input.attachments.forEach((attachment) => {
      formData.append("attachments", {
        uri: attachment.uri,
        type: attachment.type,
        name: attachment.name,
      } as unknown as Blob);
      formData.append(
        "attachmentSpoilers[]",
        String(attachment.spoiler ?? false),
      );
    });
    result = await app.rest.postFormData<APIScheduledMessage>(path, formData);
  } else {
    result = await app.rest.post<APIScheduledMessage>(path, {
      content: input.content,
      scheduledFor,
      ...(input.stickerIds.length > 0
        ? { expressionIds: input.stickerIds }
        : {}),
      ...(input.repliedToId
        ? { repliedToId: input.repliedToId, mentionReply: input.mentionReply }
        : {}),
    });
  }

  app.scheduledMessages.upsert(result);
  return result;
};
