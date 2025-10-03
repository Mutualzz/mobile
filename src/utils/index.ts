import { MzTheme } from "@app-types/theme";

export const sortThemes = (themes: MzTheme[]): MzTheme[] => {
    const priorityOrder: string[] = ["baseDark", "baseLight"];

    const priorityThemes = themes.filter((theme) =>
        priorityOrder.includes(theme.id),
    );
    const otherThemes = themes
        .filter((theme) => !priorityOrder.includes(theme.id))
        .sort((a, b) => a.name.localeCompare(b.name));

    return [...priorityThemes, ...otherThemes];
};
