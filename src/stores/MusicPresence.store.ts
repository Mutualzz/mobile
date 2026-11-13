import { MEDIA_APPS } from "@presence/mediaApps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { makeAutoObservable } from "mobx";
import { makePersistable } from "mobx-persist-store";

export class MusicPresenceStore {
  shareMusicActivity = true;
  disabledMusicApps: string[] = [];
  syncLyrics = false;

  constructor() {
    makeAutoObservable(this);

    makePersistable(this, {
      name: "MusicPresenceStore",
      properties: ["shareMusicActivity", "disabledMusicApps", "syncLyrics"],
      storage: AsyncStorage,
    });
  }

  get enabledMusicAppCount() {
    return MEDIA_APPS.filter(
      (mediaApp) => !this.disabledMusicApps.includes(mediaApp.applicationId),
    ).length;
  }

  get allMusicAppsEnabled() {
    return this.enabledMusicAppCount === MEDIA_APPS.length;
  }

  isMusicAppEnabled(applicationId: string) {
    return !this.disabledMusicApps.includes(applicationId);
  }

  setShareMusicActivity(value: boolean) {
    this.shareMusicActivity = value;
  }

  setSyncLyrics(value: boolean) {
    this.syncLyrics = value;
  }

  setMusicAppEnabled(applicationId: string, enabled: boolean) {
    const otherDisabledApps = this.disabledMusicApps.filter(
      (disabledId) => disabledId !== applicationId,
    );
    this.disabledMusicApps = enabled
      ? otherDisabledApps
      : [...otherDisabledApps, applicationId];
  }

  setAllMusicAppsEnabled(enabled: boolean) {
    this.disabledMusicApps = enabled
      ? []
      : MEDIA_APPS.map((mediaApp) => mediaApp.applicationId);
  }
}
