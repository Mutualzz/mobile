import type { PermissionFlag } from "@mutualzz/bitfield";
import type { ComponentType } from "react";
import type { IconProps } from "phosphor-react-native";
import {
    GavelIcon,
    PaperPlaneTiltIcon,
    SmileyIcon,
    TreeStructureIcon,
} from "phosphor-react-native";

export type SpaceSettingsPage =
    | "invites"
    | "roles"
    | "expressions"
    | "bans";

export type SpaceSettingsCategory = "people" | "moderation";

export interface SpaceSettingsPageDef {
    label: SpaceSettingsPage;
    Icon: ComponentType<IconProps>;
    permissions: PermissionFlag[];
}

export const spaceSettingsPages: Record<
    SpaceSettingsCategory,
    SpaceSettingsPageDef[]
> = {
    people: [
        {
            label: "roles",
            Icon: TreeStructureIcon,
            permissions: ["ManageRoles"],
        },
        {
            label: "invites",
            Icon: PaperPlaneTiltIcon,
            permissions: ["ManageSpace"],
        },
        {
            label: "expressions",
            Icon: SmileyIcon,
            permissions: ["ManageExpressions", "CreateExpressions"],
        },
    ],
    moderation: [
        {
            label: "bans",
            Icon: GavelIcon,
            permissions: ["BanMembers"],
        },
    ],
};

export function canOpenSpaceSettings(spaceMe: {
    hasAnyPermission: (flags: PermissionFlag[]) => boolean;
}) {
    return Object.values(spaceSettingsPages).some((pages) =>
        pages.some((page) => spaceMe.hasAnyPermission(page.permissions)),
    );
}

export function getVisibleSpaceSettingsPages(spaceMe: {
    hasAnyPermission: (flags: PermissionFlag[]) => boolean;
}) {
    return Object.entries(spaceSettingsPages).flatMap(([category, pages]) => {
        const visible = pages.filter((page) =>
            spaceMe.hasAnyPermission(page.permissions),
        );
        if (visible.length === 0) return [];
        return [{ category: category as SpaceSettingsCategory, pages: visible }];
    });
}
