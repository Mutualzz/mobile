import { Theme } from "@stores/objects/Theme";

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
