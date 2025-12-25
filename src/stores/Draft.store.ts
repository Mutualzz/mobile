import type { ThemeDraft } from "@app-types/theme";
import { Logger } from "@mutualzz/logger";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { makeAutoObservable, observable, type IObservableArray } from "mobx";
import { makePersistable } from "mobx-persist-store";
import { type CanvasPath } from "react-sketch-canvas";

type AvatarDraft = {
    image: string;
    paths: CanvasPath[];
};

export class DraftStore {
    private readonly logger = new Logger({
        tag: "DraftStore",
    });

    themes: IObservableArray<ThemeDraft>;
    avatars: IObservableArray<AvatarDraft>;

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

    saveThemeDraft(theme: ThemeDraft) {
        this.themes.unshift(theme);
    }

    deleteThemeDraft(theme: ThemeDraft) {
        const index = this.themes.findIndex((t) => t.name === theme.name);
        if (index === -1) {
            this.logger.warn("Theme draft does not exist");
            return;
        }

        this.themes.splice(index, 1);
    }
}
