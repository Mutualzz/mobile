import {
    CDNRoutes,
    ImageFormat,
    type APIUser,
    type AvatarFormat,
    type DefaultAvatar,
    type Sizes,
} from "@mutualzz/types";
import type { Hex } from "@mutualzz/ui-core";
import { REST } from "@stores/REST.store";
import { makeAutoObservable } from "mobx";

export class User {
    id: string;
    username: string;
    defaultAvatar: DefaultAvatar;
    avatar?: string | null = null;
    globalName?: string | null = null;
    accentColor: Hex;
    createdAt: Date;
    createdTimestamp: number;
    updatedAt: Date;
    updatedTimestamp: number;

    raw: APIUser;

    constructor(user: APIUser) {
        this.id = user.id;
        this.username = user.username;
        this.defaultAvatar = user.defaultAvatar;
        this.avatar = user.avatar ?? null;
        this.globalName = user.globalName ?? null;
        this.accentColor = user.accentColor;
        this.createdAt = user.createdAt;
        this.createdTimestamp = user.createdTimestamp;
        this.updatedAt = user.updatedAt;
        this.updatedTimestamp = user.updatedTimestamp;

        this.raw = user;

        makeAutoObservable(this);
    }

    update(user: APIUser) {
        Object.assign(this, user);
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
}
