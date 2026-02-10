import type { Snowflake } from "@mutualzz/types";
import {
    BitField,
    CDNRoutes,
    ImageFormat,
    userFlags,
    type APIUser,
    type AvatarFormat,
    type Sizes,
    type UserFlags,
} from "@mutualzz/types";
import { REST } from "@stores/REST.store";
import { makeAutoObservable } from "mobx";

export class User {
    id: Snowflake;
    username: string;
    defaultAvatar: {
        type: number;
        color?: string | null;
    };
    avatar?: string | null = null;
    globalName?: string | null = null;
    accentColor: string;
    createdAt: Date;
    updatedAt: Date;
    flags: BitField<UserFlags>;

    raw: APIUser;

    constructor(user: APIUser) {
        this.id = user.id;
        this.username = user.username;
        this.defaultAvatar = user.defaultAvatar;
        this.avatar = user.avatar ?? null;
        this.globalName = user.globalName ?? null;
        this.accentColor = user.accentColor;
        this.createdAt = new Date(user.createdAt);
        this.updatedAt = new Date(user.updatedAt);
        this.flags = BitField.fromString(userFlags, user.flags.toString());

        this.raw = user;

        makeAutoObservable(this);
    }

    update(user: APIUser) {
        Object.assign(this, user);
    }

    get avatarUrl() {
        return this.constructAvatarUrl(true);
    }

    get displayName() {
        return this.globalName || this.username;
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

        const isAnimated = animated && this.avatar?.startsWith("a_");

        return REST.makeCDNUrl(
            CDNRoutes.userAvatar(
                this.id,
                hash ?? this.avatar,
                format,
                size,
                animated || isAnimated,
            ),
        );
    }
}
