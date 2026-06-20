import type { PermissionFlag } from "@mutualzz/bitfield";

export interface PermissionGroupDef {
    title: string;
    items: {
        flag: PermissionFlag;
        label: string;
        description?: string;
    }[];
}

export const SPACE_PERMISSION_GROUPS: PermissionGroupDef[] = [
    {
        title: "General Space Permissions",
        items: [
            {
                flag: "ViewChannel",
                label: "View Channels",
                description: "Allow members to view channels by default",
            },
            {
                flag: "ManageChannels",
                label: "Manage Channels",
                description: "Allow members to create, edit or delete channels",
            },
            {
                flag: "ManageRoles",
                label: "Manage Roles",
                description:
                    "Allows members to create new roles and edit or delete roles lower than their highest role",
            },
            {
                flag: "CreateExpressions",
                label: "Create Expressions",
                description:
                    "Allow members to create emoji and stickers in this space.",
            },
            {
                flag: "ManageExpressions",
                label: "Manage Expressions",
                description:
                    "Allow members to edit or delete emoji and stickers in this space.",
            },
            {
                flag: "ManageSpace",
                label: "Manage Space",
                description: "Allow members to change this space",
            },
        ],
    },
    {
        title: "Membership Permissions",
        items: [
            {
                flag: "CreateInvites",
                label: "Create Invites",
                description: "Allow members to invite new people to this space",
            },
            {
                flag: "KickMembers",
                label: "Kick Members",
                description:
                    "Kick will remove other members from this space. Kicked members can rejoin if they have another invite.",
            },
            {
                flag: "BanMembers",
                label: "Ban Members",
                description:
                    "Ban will remove members from this space and prevent them from rejoining until they are unbanned.",
            },
        ],
    },
    {
        title: "Text Channel Permissions",
        items: [
            {
                flag: "SendMessages",
                label: "Send Messages",
                description: "Allow members to send messages in text channels",
            },
            {
                flag: "EmbedLinks",
                label: "Embed Links",
                description: "Allow members to embed links in messages",
            },
            {
                flag: "AttachFiles",
                label: "Attach Files",
                description: "Allow members to attach files in messages",
            },
            {
                flag: "MentionEveryone",
                label: "Mention Everyone",
                description:
                    "Allow members to mention @everyone and @here in messages",
            },
            {
                flag: "UseExternalEmojis",
                label: "Use External Emojis",
                description:
                    "Allow members to use emojis from other spaces or their own in their messages",
            },
            {
                flag: "ManageMessages",
                label: "Manage Messages",
                description: "Allow members to delete other members messages",
            },
            {
                flag: "ReadMessageHistory",
                label: "Read Message History",
                description: "Allow members to read message history",
            },
        ],
    },
    {
        title: "Voice Channel Permissions",
        items: [
            {
                flag: "Connect",
                label: "Connect",
                description: "Allow members to connect to voice channels",
            },
            {
                flag: "Speak",
                label: "Speak",
                description: "Allow members to speak in voice channels",
            },
        ],
    },
    {
        title: "Advanced Permissions",
        items: [
            {
                flag: "Administrator",
                label: "Administrator",
                description:
                    "Members with this permission will have every permission. This is a dangerous permission to grant.",
            },
        ],
    },
];

export function filterPermissionGroups(
    groups: PermissionGroupDef[],
    query: string,
) {
    const q = query.trim().toLowerCase();
    if (!q) return groups;

    return groups
        .map((group) => ({
            ...group,
            items: group.items.filter((item) => {
                if (item.label.toLowerCase().includes(q)) return true;
                if (item.description?.toLowerCase().includes(q)) return true;
                return false;
            }),
        }))
        .filter((group) => group.items.length > 0);
}
