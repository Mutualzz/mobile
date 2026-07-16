import type { APISpace, Snowflake } from "@mutualzz/types";
import { makeAutoObservable, observable, type ObservableMap } from "mobx";
import { makePersistable } from "mobx-persist-store";
import type { AppStore } from "./App.store";
import { Space } from "./objects/Space";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type SpaceSidebarTab = "channels" | "bridges";

export class SpaceStore {
    private readonly spaces: ObservableMap<string, Space>;

    active?: Space | null;
    activeId?: Snowflake;

    mostRecentSpaceId?: string | null;
    sidebarTabBySpace: Record<string, SpaceSidebarTab> = {};

    constructor(private readonly app: AppStore) {
        this.spaces = observable.map();
        makeAutoObservable(this);

        makePersistable(this, {
            name: "SpaceStore",
            properties: ["mostRecentSpaceId", "sidebarTabBySpace"],
            storage: AsyncStorage,
        });
    }

    getSidebarTab(spaceId: string): SpaceSidebarTab {
        return this.sidebarTabBySpace[spaceId] ?? "channels";
    }

    setSidebarTab(spaceId: string, tab: SpaceSidebarTab) {
        this.sidebarTabBySpace = { ...this.sidebarTabBySpace, [spaceId]: tab };
    }

    setActive(id?: string) {
        if (id === "@me") {
            this.active = null;
            this.activeId = "@me";
            this.app.channels.setPreferredActive();
            return;
        }

        this.active = (id ? this.get(id) : null) ?? null;
        this.activeId = this.active?.id;

        this.app.channels.setPreferredActive();
    }

    unsetActive() {
        this.active = null;
        this.activeId = undefined;
    }

    setPreferredActive() {
        const preferred = this.mostRecentSpace ?? this.all[0];
        this.setActive(preferred?.id);
        return preferred;
    }

    setMostRecentSpace(id?: string | null) {
        this.mostRecentSpaceId = id;
    }

    get mostRecentSpace(): Space | undefined {
        return this.spaces.get(this.mostRecentSpaceId ?? "");
    }

    add(space: APISpace): Space {
        const exists = this.spaces.get(space.id);
        if (exists) return exists;

        const newSpace = new Space(this.app, space);
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

    remove(id: Snowflake) {
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

    async resolve(id: Snowflake, force = false) {
        if (this.has(id) && !force) return this.get(id);
        const space = await this.app.rest.get<APISpace>(`/spaces/${id}`);
        if (!space) return undefined;
        if (this.has(space.id)) {
            this.update(space);
            return this.get(space.id);
        }
        return this.add(space);
    }

    clear() {
        this.spaces.clear();
        this.active = null;
        this.activeId = undefined;
        this.mostRecentSpaceId = null;
    }
}
