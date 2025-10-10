import {
    CDNRoutes,
    ImageFormat,
    type APITheme,
    type APIUser,
    type DefaultAvatar,
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
    themes?: APITheme[] | null = null;
    accentColor: Hex;
    createdAt: Date;
    createdTimestamp: number;

    raw: APIUser;

    constructor(user: APIUser) {
        this.id = user.id;
        this.username = user.username;
        this.defaultAvatar = user.defaultAvatar;
        this.avatar = user.avatar ?? null;
        this.globalName = user.globalName ?? null;
        this.themes = user.themes ?? null;
        this.accentColor = user.accentColor;
        this.createdAt = user.createdAt;
        this.createdTimestamp = user.createdTimestamp;

        this.raw = user;

        makeAutoObservable(this);
    }

    update(user: APIUser) {
        Object.assign(this, user);
    }

    get avatarUrl() {
        return REST.makeCDNUrl(
            this.avatar
                ? this.avatar.startsWith("a_")
                    ? CDNRoutes.userAvatar(
                          this.id,
                          this.avatar,
                          ImageFormat.GIF,
                      )
                    : CDNRoutes.userAvatar(
                          this.id,
                          this.avatar,
                          ImageFormat.PNG,
                      )
                : CDNRoutes.defaultUserAvatar(this.defaultAvatar),
        );
    }
}
