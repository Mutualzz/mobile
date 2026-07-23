import { AppStore } from "@stores/App.store";
import { Channel } from "@stores/objects/Channel";
import { Theme } from "@stores/objects/Theme";
import { createSystemMessage as createSystemMessageBase } from "@mutualzz/client";

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

export const createSystemMessage = (
    app: AppStore,
    channelId: string,
    content: string,
    flags?: bigint,
) => createSystemMessageBase(app.users as Parameters<typeof createSystemMessageBase>[0], channelId, content, flags);

export * from "./emojis";
export { calendarStrings, ObservableOrderedSet } from "@mutualzz/client";
export * from "./navigation";
