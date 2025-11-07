import type { APISpace } from "@mutualzz/types";
import { makeAutoObservable } from "mobx";
import type { User } from "./User";

export class Space {
    id: string;
    name: string;
    description?: string | null = null;
    icon?: string | null = null;
    createdAt: Date;
    createdTimestamp: number;
    updatedAt: Date;
    updatedTimestamp: number;

    raw: APISpace;

    private _owner: User | null = null;

    constructor(space: APISpace) {
        this.id = space.id;
        this.name = space.name;
        this.description = space.description;
        this.icon = space.icon;

        this.createdAt = space.createdAt;
        this.createdTimestamp = space.createdTimestamp;
        this.updatedAt = space.updatedAt;
        this.updatedTimestamp = space.updatedTimestamp;

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
}
