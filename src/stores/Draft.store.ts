import { Logger } from "@mutualzz/logger";
import type { DrawCanvasState } from "@components/Profile/widgets/editor/ProfileDrawCanvas";
import type { APITheme } from "@mutualzz/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type IObservableArray, makeAutoObservable, observable } from "mobx";
import { makePersistable } from "mobx-persist-store";
import type { MentionEntity } from "@utils/markdown/mentionEntities";

export interface AvatarDraft {
  id: string;
  svgData: string;
  state: DrawCanvasState;
}

export interface MessageDraftAttachment {
  uri: string;
  type: string;
  name: string;
  size?: number;
  spoiler?: boolean;
}

export interface MessageDraft {
  content: string;
  entities: MentionEntity[];
  stickerIds: string[];
  attachments: MessageDraftAttachment[];
}

const getMessageDraftKey = (accountId: string, channelId: string) =>
  `${accountId}:${channelId}`;

export class DraftStore {
  themes: IObservableArray<APITheme>;
  avatars: IObservableArray<AvatarDraft>;
  messages = observable.map<string, MessageDraft>();
  readonly ready: Promise<void>;
  private readonly logger = new Logger({
    tag: "DraftStore",
  });

  constructor() {
    makeAutoObservable(this, { ready: false });

    this.themes = observable.array([]);
    this.avatars = observable.array([]);

    this.ready = makePersistable(this, {
      name: "DraftStore",
      properties: ["avatars", "themes", "messages"],
      storage: AsyncStorage,
    }).then(() => undefined);
  }

  saveMessageDraft(accountId: string, channelId: string, draft: MessageDraft) {
    const key = getMessageDraftKey(accountId, channelId);

    if (
      draft.content.trim() === "" &&
      draft.stickerIds.length === 0 &&
      draft.attachments.length === 0
    ) {
      this.messages.delete(key);
      return;
    }

    this.messages.set(key, draft);
  }

  getMessageDraft(accountId: string, channelId: string) {
    return this.messages.get(getMessageDraftKey(accountId, channelId));
  }

  deleteMessageDraft(accountId: string, channelId: string) {
    this.messages.delete(getMessageDraftKey(accountId, channelId));
  }

  saveAvatarDraft(svgData: string, state: DrawCanvasState) {
    const id = `${Date.now()}`;
    this.avatars.unshift({ id, svgData, state });
    return id;
  }

  getAvatarDraft(id: string) {
    return this.avatars.find((draft) => draft.id === id) ?? null;
  }

  deleteAvatarDraft(id: string) {
    const index = this.avatars.findIndex((draft) => draft.id === id);
    if (index === -1) {
      this.logger.warn("Avatar draft does not exist");
      return;
    }

    this.avatars.splice(index, 1);
  }

  saveThemeDraft(theme: APITheme) {
    const existing = this.themes.some((t) => t.name === theme.name);
    if (existing) {
      this.logger.warn("Theme draft already exists");
      return;
    }

    this.themes.unshift(theme);
  }

  updateThemeDraft(theme: APITheme) {
    const index = this.themes.findIndex((t) => t.name === theme.name);
    if (index === -1) {
      this.logger.warn("Theme draft does not exist");
      return;
    }

    this.themes[index] = theme;
  }

  existsThemeDraft(theme: APITheme) {
    return this.themes.some((t) => t.name === theme.name);
  }

  deleteThemeDraft(theme: APITheme) {
    const existing = this.themes.some((t) => t.name === theme.name);
    if (!existing) {
      this.logger.warn("Theme draft does not exist");
      return;
    }

    this.themes.replace(this.themes.filter((t) => t.name !== theme.name));
  }

  clear() {
    this.themes.clear();
    this.avatars.clear();
    this.messages.clear();
  }
}
