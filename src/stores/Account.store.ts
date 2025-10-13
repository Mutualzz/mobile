import { Logger } from "@logger";
import {
    CDNRoutes,
    ImageFormat,
    type APIPrivateUser,
    type APITheme,
    type APIUserSettings,
    type AvatarFormat,
    type DefaultAvatar,
    type Sizes,
} from "@mutualzz/types";
import type { Hex } from "@mutualzz/ui-core";
import { makeAutoObservable } from "mobx";
import { REST } from "./REST.store";

export class AccountStore {
    private readonly logger = new Logger({
        tag: "AccountStore",
    });
    id: string;
    username: string;
    defaultAvatar: DefaultAvatar;
    previousAvatars: string[] = [];
    avatar?: string | null = null;
    globalName?: string | null = null;
    email?: string | null = null;
    themes: APITheme[] | null = [];
    accentColor: Hex;
    createdAt: Date;
    createdTimestamp: number;
    settings: APIUserSettings;

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
        this.themes = user.themes ?? [];
        this.settings = user.settings;
        this.createdAt = user.createdAt;
        this.createdTimestamp = user.createdTimestamp;

        this.raw = user;

        makeAutoObservable(this);
    }

    get avatarUrl() {
        return this.constructAvatarUrl(true);
    }

    constructAvatarUrl(
        animated = false,
        size: Sizes = 128,
        format: AvatarFormat = ImageFormat.WebP,
        hash?: string,
    ) {
        if (!this.avatar)
            return REST.makeCDNUrl(
                CDNRoutes.defaultUserAvatar(this.defaultAvatar),
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
        return REST.makeCDNUrl(CDNRoutes.defaultUserAvatar(this.defaultAvatar));
    }
}
