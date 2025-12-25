import { Logger } from "@mutualzz/logger";
import type { Snowflake } from "@mutualzz/types";
import {
    CDNRoutes,
    ImageFormat,
    type APIPrivateUser,
    type AvatarFormat,
    type Sizes,
} from "@mutualzz/types";
import { makeAutoObservable } from "mobx";
import { REST } from "./REST.store";

export class AccountStore {
    private readonly logger = new Logger({
        tag: "AccountStore",
    });
    id: Snowflake;
    username: string;
    defaultAvatar: {
        type: number;
        color?: string | null;
    };
    previousAvatars: string[] = [];
    avatar?: string | null = null;
    globalName?: string | null = null;
    email?: string | null = null;
    accentColor: string;
    createdAt: Date;

    raw: APIPrivateUser;

    constructor(user: APIPrivateUser) {
        this.id = user.id;
        this.username = user.username;
        this.defaultAvatar = user.defaultAvatar;
        this.avatar = user.avatar ?? null;
        this.accentColor = user.accentColor;
        this.previousAvatars = user.previousAvatars ?? [];
        this.globalName = user.globalName ?? null;
        this.email = user.email ?? null;
        this.createdAt = new Date(user.createdAt);

        this.raw = user;

        makeAutoObservable(this);
    }

    get avatarUrl() {
        return this.constructAvatarUrl(true);
    }

    constructAvatarUrl(
        animated = false,
        version: "dark" | "light" = "light",
        size: Sizes = 128,
        format: AvatarFormat = ImageFormat.WebP,
        hash?: string,
    ) {
        if (!this.avatar)
            return REST.makeCDNUrl(
                CDNRoutes.defaultUserAvatar(
                    this.defaultAvatar.type,
                    version,
                    size,
                    format,
                ),
            );

        return REST.makeCDNUrl(
            CDNRoutes.userAvatar(
                this.id,
                hash ?? this.avatar,
                format,
                size,
                animated,
            ),
        );
    }

    get displayName() {
        return this.globalName || this.username;
    }

    removePreviousAvatar(avatar: string) {
        if (!this.previousAvatars.includes(avatar)) {
            this.logger.warn(`Avatar ${avatar} not found in previous avatars.`);
            return;
        }

        this.previousAvatars = this.previousAvatars.filter((a) => a !== avatar);
    }

    get previousAvatarUrls(): Map<string, string> {
        const map = new Map<string, string>();
        for (const avatar of this.previousAvatars) {
            const url = REST.makeCDNUrl(
                avatar.startsWith("a_")
                    ? CDNRoutes.userAvatar(this.id, avatar, ImageFormat.GIF)
                    : CDNRoutes.userAvatar(this.id, avatar, ImageFormat.PNG),
            );
            map.set(avatar, url);
        }
        return map;
    }

    get defaultAvatarUrl() {
        return REST.makeCDNUrl(
            CDNRoutes.defaultUserAvatar(this.defaultAvatar.type),
        );
    }
}
