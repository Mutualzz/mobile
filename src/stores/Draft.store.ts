import type { ThemeDraft } from "@app-types/theme";
import { Logger } from "@logger";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { makeAutoObservable } from "mobx";
import { makePersistable } from "mobx-persist-store";
import { type CanvasPath } from "react-sketch-canvas";

export class DraftStore {
    private readonly logger = new Logger({
        tag: "DraftStore",
    });
    themes: ThemeDraft[] = [];
    avatars: { image: string; paths: CanvasPath[] }[] = [];

    constructor() {
        makeAutoObservable(this);

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
        this.themes = this.themes.filter((t) => t.name !== theme.name);
    }
}
