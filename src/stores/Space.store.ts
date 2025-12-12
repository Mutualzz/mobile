import type { APISpace } from "@mutualzz/types";
import { makeAutoObservable, observable, type ObservableMap } from "mobx";
import type { AppStore } from "./App.store";
import { Space } from "./objects/Space";

// TODO: Fix a bug with sorting upon adding a space without having any,
// Which means if a user doesnt have any spaces and then adds one after another, it gets sorted backwards
// Could be an issue of "positioned" getter returning the default "this.all" before the spacePositions are updated
export class SpaceStore {
    private readonly spaces: ObservableMap<string, Space>;

    active: Space | null = null;
    activeId?: string;

    constructor(private readonly app: AppStore) {
        this.spaces = observable.map();
        makeAutoObservable(this);
    }

    setActive(id?: string) {
        this.activeId = id;

        this.active = (id ? this.get(id) : null) ?? null;
    }

    get mostRecentSpaceId(): string | undefined {
        return this.positioned.at(0)?.id ?? this.all.at(0)?.id ?? undefined;
    }

    add(space: APISpace): Space {
        const newSpace = new Space(space);
        this.spaces.set(space.id, newSpace);
        return newSpace;
    }

    addAll(spaces: APISpace[]): Space[] {
        return spaces.map((space) => this.add(space));
    }

    update(space: APISpace) {
        this.spaces.get(space.id)?.update(space);
    }

    get(id: string) {
        return this.spaces.get(id);
    }

    remove(id: string) {
        this.spaces.delete(id);
    }

    get all() {
        return Array.from(this.spaces.values());
    }

    get positioned() {
        const positions = this.app.settings?.spacePositions;

        if (!positions || positions.size === 0) return this.all;

        const positionedSpaces = positions
            .toArray()
            .map((id) => this.spaces.get(id))
            .filter((space): space is Space => space !== undefined);

        const unpositionedSpaces = this.all.filter(
            (space) => !positions.has(space.id),
        );

        return [...positionedSpaces, ...unpositionedSpaces];
    }

    get count() {
        return this.spaces.size;
    }

    has(id: string) {
        return this.spaces.has(id);
    }

    async resolve(id: string, force = false) {
        if (this.has(id) && !force) return this.get(id);
        const space = await this.app.rest.get<APISpace>(`/spaces/${id}`);
        if (!space) return undefined;
        return this.add(space);
    }
}
