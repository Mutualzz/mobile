import type {
  APISpaceNotificationSettings,
  NotificationLevel,
  NotificationSuppressOptions,
} from "@mutualzz/types";
import { resolveEffectiveNotificationLevel } from "@mutualzz/types";
import type { PatchSpaceNotificationSettings } from "@mutualzz/validators";
import { makeAutoObservable, observable } from "mobx";
import type { ReadState } from "@stores/objects/ReadState";
import type { AppStore } from "@stores/App.store";

export class SpaceNotificationSettingsStore {
  private readonly settings = observable.map<
    string,
    APISpaceNotificationSettings
  >();

  constructor(private readonly app: AppStore) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  clear() {
    this.settings.clear();
  }

  addAll(items: APISpaceNotificationSettings[]) {
    for (const item of items) this.settings.set(item.spaceId, item);
  }

  get(spaceId: string): APISpaceNotificationSettings | undefined {
    return this.settings.get(spaceId);
  }

  upsert(item: APISpaceNotificationSettings) {
    this.settings.set(item.spaceId, item);
  }

  getEffectiveLevel(
    spaceId: string | null | undefined,
    readState?: ReadState,
  ): NotificationLevel {
    const spaceSettings = spaceId ? this.settings.get(spaceId) : undefined;
    return resolveEffectiveNotificationLevel({
      spaceLevel: spaceSettings?.level ?? null,
      spaceMutedUntil: spaceSettings?.mutedUntil ?? null,
      channelLevel: readState?.notificationLevel ?? null,
      channelMutedUntil: readState?.mutedUntil ?? null,
    });
  }

  getSuppress(
    spaceId: string | null | undefined,
  ): NotificationSuppressOptions {
    const spaceSettings = spaceId ? this.settings.get(spaceId) : undefined;
    return {
      suppressEveryone: spaceSettings?.suppressEveryone ?? false,
      suppressRoles: spaceSettings?.suppressRoles ?? false,
    };
  }

  async patch(
    spaceId: string,
    body: PatchSpaceNotificationSettings,
  ): Promise<APISpaceNotificationSettings> {
    const result = await this.app.rest.patch<
      APISpaceNotificationSettings,
      PatchSpaceNotificationSettings
    >(`/spaces/${spaceId}/notification-settings`, body);
    if (result) this.upsert(result);
    return result;
  }
}
