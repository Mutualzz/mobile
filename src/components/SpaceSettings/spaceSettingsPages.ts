import type { PermissionFlag } from "@mutualzz/bitfield";
import type { ComponentType } from "react";
import type { IconProps } from "phosphor-react-native";
import {
    CubeIcon,
    GavelIcon,
    HashIcon,
    PaperPlaneTiltIcon,
    PencilSimpleIcon,
    SmileyIcon,
    TreeStructureIcon,
} from "phosphor-react-native";

export type SpaceSettingsPage =
    | "profile"
    | "channels"
    | "invites"
    | "roles"
    | "expressions"
    | "bans"
    | "minecraft-bridge";

export type SpaceSettingsCategory = "people" | "integrations" | "moderation";

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
            label: "profile",
            Icon: PencilSimpleIcon,
            permissions: ["ManageSpace"],
        },
        {
            label: "roles",
            Icon: TreeStructureIcon,
            permissions: ["ManageRoles"],
        },
        {
            label: "channels",
            Icon: HashIcon,
            permissions: ["ManageChannels"],
        },
        {
            label: "invites",
            Icon: PaperPlaneTiltIcon,
            permissions: ["ManageChannels", "CreateInvites"],
        },
        {
            label: "expressions",
            Icon: SmileyIcon,
            permissions: ["ManageExpressions", "CreateExpressions"],
        },
    ],
    integrations: [
        {
            label: "minecraft-bridge",
            Icon: CubeIcon,
            permissions: ["ManageSpace"],
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
