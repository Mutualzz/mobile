import {
    BitField,
    CDNRoutes,
    ImageFormat,
    spaceFlags,
    type APISpace,
    type AvatarFormat,
    type Sizes,
    type SpaceFlags,
} from "@mutualzz/types";
import { REST } from "@stores/REST.store";
import { makeAutoObservable } from "mobx";
import type { User } from "./User";

export class Space {
    id: string;
    name: string;
    description?: string | null = null;
    icon?: string | null = null;
    created: Date;
    updated: Date;

    flags: BitField<SpaceFlags>;

    raw: APISpace;

    private _owner: User | null = null;

    constructor(space: APISpace) {
        this.id = space.id;
        this.name = space.name;
        this.description = space.description;
        this.icon = space.icon;

        this.created = new Date(space.created);
        this.updated = new Date(space.updated);

        this.flags = BitField.fromString(spaceFlags, space.flags.toString());

        this.raw = space;

        makeAutoObservable(this);
    }

    set owner(user: User | null) {
        this._owner = user;
    }

    get owner() {
        return this._owner;
    }

    update(space: APISpace) {
        Object.assign(this, space);
    }

    get iconUrl() {
        if (!this.icon) return null;
        return this.constructIconUrl(true, this.icon);
    }

    constructIconUrl(
        animated = false,
        hash: string,
        size: Sizes = 128,
        format: AvatarFormat = ImageFormat.WebP,
    ) {
        return REST.makeCDNUrl(
            CDNRoutes.spaceIcon(this.id, hash, format, size, animated),
        );
    }
}
