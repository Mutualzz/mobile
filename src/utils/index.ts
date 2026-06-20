import { AppMode } from "@mutualzz/types";
import { AppStore } from "@stores/App.store";
import { Channel } from "@stores/objects/Channel";
import { Theme } from "@stores/objects/Theme";
import { useRouter } from "expo-router";

export const sortThemes = (themes: Theme[]): Theme[] => {
    const priorityOrder: string[] = ["baseDark", "baseLight"];

    const priorityThemes = themes.filter((theme) =>
        priorityOrder.includes(theme.id),
    );
    const otherThemes = themes
        .filter((theme) => !priorityOrder.includes(theme.id))
        .sort((a, b) => a.name.localeCompare(b.name));

    return [...priorityThemes, ...otherThemes];
};

export const asAcronym = (str: string) =>
    str
        .split(" ")
        .map((str) => str[0])
        .join("");

export const compareChannels = (a: Channel, b: Channel): number => {
    return (a.position ?? -1) - (b.position ?? -1);
};

const modeToPath = (mode: AppMode) => `/${mode}` as const;

export const switchMode = (
    app: AppStore,
    router?: ReturnType<typeof useRouter>,
    targetMode?: AppMode | null,
) => {
    if (!router) return;

    const target =
        targetMode != null
            ? modeToPath(targetMode)
            : app.mode === "feed"
              ? "/spaces"
              : app.mode === "spaces"
                ? "/feed"
                : app.account
                  ? modeToPath(
                        app.settings?.preferredMode === "feed"
                            ? "feed"
                            : "spaces",
                    )
                  : null;

    if (!target) return;

    router.replace(target);
};

export * from "./emojis";
export * from "./i18n";
export * from "./ObservableOrderedSet";
export * from "./navigation";
