import type { Snowflake } from "@mutualzz/types";
import { ChannelType, type APIChannel } from "@mutualzz/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { makeAutoObservable, observable, ObservableMap } from "mobx";
import { makePersistable } from "mobx-persist-store";
import type { AppStore } from "./App.store";
import { Channel } from "./objects/Channel";

export class ChannelStore {
    private readonly channels: ObservableMap<string, Channel>;
    collapsedCategories: ObservableMap<string, Set<string>>; // Space -> Set of collapsed category IDs

    active?: Channel | null;
    activeId?: Snowflake;

    mostRecentBySpace: ObservableMap<string, Snowflake | null> =
        observable.map();

    constructor(private readonly app: AppStore) {
        this.channels = observable.map();
        this.collapsedCategories = observable.map();

        makeAutoObservable(this);

        makePersistable(this, {
            name: "ChannelStore",
            properties: [
                {
                    key: "collapsedCategories",
                    serialize: (map: ObservableMap<string, Set<string>>) => {
                        const obj: Record<string, string[]> = {};
                        map.forEach((set, key) => {
                            obj[key] = Array.from(set);
                        });
                        return obj;
                    },
                    deserialize: (obj: Record<string, string[]>) => {
                        const map = observable.map<string, Set<string>>();
                        Object.entries(obj || {}).forEach(([key, arr]) => {
                            map.set(key, new Set(arr));
                        });
                        return map;
                    },
                },
                "mostRecentBySpace",
            ],
            storage: AsyncStorage,
        });
    }

    get preferredChannel() {
        return (
            this.getMostRecentChannelForSpace(this.app.spaces.activeId ?? "") ??
            this.getFirstNavigableChannel(this.app.spaces.activeId ?? "")
        );
    }

    setPreferredActive() {
        const preferred = this.preferredChannel;
        this.setActive(preferred?.id);
    }

    getMostRecentChannelForSpace(spaceId: string): Channel | undefined {
        const id = this.mostRecentBySpace.get(spaceId) ?? undefined;
        return id ? this.get(id) : undefined;
    }

    setMostRecentChannelForSpace(spaceId: string, id?: string | null) {
        if (id == null) this.mostRecentBySpace.delete(spaceId);
        else this.mostRecentBySpace.set(spaceId, id);
    }

    setMostRecentChannel(id?: string | null) {
        this.mostRecentBySpace.set(
            this.app.spaces.activeId ?? "@me",
            id ?? null,
        );
    }

    setActive(id?: Snowflake) {
        this.active = (id ? this.get(id) : null) ?? null;
        this.activeId = this.active?.id;
    }

    add(channel: APIChannel): Channel {
        const exists = this.channels.get(channel.id);
        if (exists) return exists;

        let newChannel = new Channel(this.app, channel);
        this.channels.set(channel.id, newChannel);
        return newChannel;
    }

    addAll(channels: APIChannel[]): Channel[] {
        return channels.map((channel) => this.add(channel));
    }

    update(channel: APIChannel) {
        this.channels.get(channel.id)?.update(channel);
    }

    get(id: Snowflake) {
        return this.channels.get(id);
    }

    remove(id: string) {
        this.channels.delete(id);
    }

    get all() {
        return Array.from(this.channels.values());
    }

    get count() {
        return this.channels.size;
    }

    has(id: string) {
        return this.channels.has(id);
    }

    sortPosition(channels: Channel[]) {
        return channels.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }

    toggleCategoryCollapse(spaceId: string, categoryId: string) {
        if (!this.collapsedCategories.has(spaceId))
            this.collapsedCategories.set(spaceId, new Set());

        const spaceCollapsed = this.collapsedCategories.get(spaceId)!;
        if (spaceCollapsed.has(categoryId)) spaceCollapsed.delete(categoryId);
        else spaceCollapsed.add(categoryId);
    }

    isCategoryCollapsed(spaceId: string, categoryId: string): boolean {
        return this.collapsedCategories.get(spaceId)?.has(categoryId) ?? false;
    }

    getSpaceVisibleChannels(spaceId: string, types?: ChannelType[]): Channel[] {
        const space = this.app.spaces.get(spaceId);
        if (!space) return [];

        const allChannels = space.channels;
        const collapsedCategories =
            this.collapsedCategories.get(spaceId) || new Set();

        return allChannels.filter((channel, currentIndex) => {
            if (channel.type === ChannelType.Category) return true;

            if (types && types.length > 0 && !types.includes(channel.type))
                return false;

            const parentCategoryId = this.findParentCategoryId(
                allChannels,
                currentIndex,
            );

            if (!parentCategoryId) return true;

            return !collapsedCategories.has(parentCategoryId);
        });
    }

    getLastPositionInCategory(
        categoryId: string | null,
        channels: Channel[],
    ): number {
        const inCategory = channels.filter((c) => c.parent?.id === categoryId);
        if (inCategory.length === 0) return -1;
        return Math.max(...inCategory.map((c) => c.position));
    }

    getFirstNavigableChannel(
        spaceId: string,
        types?: ChannelType[],
    ): Channel | undefined {
        const visibleChannels = this.getSpaceVisibleChannels(spaceId);

        return visibleChannels.find((channel) => {
            if (channel.type === ChannelType.Category) return false;
            if (types && types.length > 0) return types.includes(channel.type);
            return true;
        });
    }

    setChannelOrder(spaceId: Snowflake, newOrder: Channel[]) {
        let currentCategory: Channel | null = null;

        const order = newOrder.map((channel, index) => {
            if (channel.type === ChannelType.Category) {
                currentCategory = channel;
                channel.setParent(null);
                channel.position = index;
            } else {
                channel.setParent(currentCategory);
                channel.position = index;
            }

            this.channels.set(channel.id, channel);

            return channel;
        });

        const payload = order.map((channel) => ({
            id: channel.id,
            parentId: channel.parentId ? channel.parentId : null,
            position: channel.position,
            spaceId: spaceId,
        }));

        this.app.rest.patch(`/channels/bulk`, payload);
    }

    private findParentCategoryId(allChannels: Channel[], channelIndex: number) {
        const channel = allChannels[channelIndex];
        if (!channel.parent) return null;

        for (let i = channelIndex - 1; i >= 0; i--) {
            const previousChannel = allChannels[i];

            if (
                previousChannel.type === ChannelType.Category &&
                previousChannel.id === channel.parent.id
            )
                return previousChannel.id;
        }

        return null;
    }

    async resolve(id: Snowflake, force = false) {
        if (this.has(id) && !force) return this.get(id);
        const channel = await this.app.rest.get<APIChannel>(`/channels/${id}`);
        if (!channel) return undefined;
        return this.add(channel);
    }
}
