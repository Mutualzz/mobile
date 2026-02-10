import { Logger } from "@mutualzz/logger";
import type { APITheme } from "@mutualzz/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type IObservableArray, makeAutoObservable, observable } from "mobx";
import { makePersistable } from "mobx-persist-store";
import { type CanvasPath } from "react-sketch-canvas";

interface AvatarDraft {
    image: string;
    paths: CanvasPath[];
}

export class DraftStore {
    themes: IObservableArray<APITheme>;
    avatars: IObservableArray<AvatarDraft>;
    private readonly logger = new Logger({
        tag: "DraftStore",
    });

    constructor() {
        makeAutoObservable(this);

        this.themes = observable.array([]);
        this.avatars = observable.array([]);

        makePersistable(this, {
            name: "DraftStore",
            properties: ["avatars", "themes"],
            storage: AsyncStorage,
        });
    }

    saveAvatarDraft(image: string, paths: CanvasPath[]) {
        if (this.avatars.some((avatar) => avatar.paths === paths)) {
            this.logger.warn("Avatar draft already exists");
            return;
        }

        this.avatars.unshift({ image, paths });
    }

    deleteAvatarDraft(index: number) {
        if (!this.avatars[index]) {
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

        this.themes.filter((t) => t.name !== theme.name);
    }
}
