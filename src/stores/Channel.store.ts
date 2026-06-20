import type { Snowflake } from "@mutualzz/types";
import { ChannelType, type APIChannel } from "@mutualzz/types";
import { makeAutoObservable, observable, type ObservableMap } from "mobx";
import { makePersistable } from "mobx-persist-store";
import type { AppStore } from "./App.store";
import { Channel } from "./objects/Channel";
import { omitBooleanRelations } from "@utils/apiRelations";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
                {
                    key: "mostRecentBySpace",
                    serialize: (map: ObservableMap<string, Snowflake | null>) => {
                        const obj: Record<string, Snowflake | null> = {};
                        map.forEach((value, key) => {
                            obj[key] = value;
                        });
                        return obj;
                    },
                    deserialize: (obj: Record<string, Snowflake | null>) => {
                        const map = observable.map<string, Snowflake | null>();
                        Object.entries(obj || {}).forEach(([key, value]) => {
                            map.set(key, value);
                        });
                        return map;
                    },
                },
            ],
            storage: AsyncStorage,
        });
    }

    get preferredChannel() {
        const spaceId = this.app.spaces.activeId ?? "@me";

        if (spaceId === "@me" || this.app.mode === "@me") {
            return (
                this.getMostRecentChannelForSpace("@me") ?? this.dms[0]
            );
        }

        return (
            this.getMostRecentChannelForSpace(spaceId) ??
            this.getFirstNavigableChannel(spaceId, [ChannelType.Text])
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
        const data = omitBooleanRelations(channel, ["space", "parent"]);
        const exists = this.channels.get(data.id);
        if (exists) return exists;

        const newChannel = new Channel(this.app, data);
        this.channels.set(data.id, newChannel);
        return newChannel;
    }

    addAll(channels: APIChannel[]): Channel[] {
        return channels.map((channel) => this.add(channel));
    }

    update(channel: APIChannel) {
        this.channels
            .get(channel.id)
            ?.update(omitBooleanRelations(channel, ["space", "parent"]));
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

    get dms() {
        const dms = this.all.filter(
            (ch) => ch.type === ChannelType.DM || ch.type === ChannelType.GroupDM,
        );

        return dms.slice().sort((a, b) => {
            const aMentions = this.app.readStates.get(a.id)?.mentionCount ?? 0;
            const bMentions = this.app.readStates.get(b.id)?.mentionCount ?? 0;
            if (aMentions > 0 !== bMentions > 0) return bMentions > 0 ? 1 : -1;

            const aUnread = this.app.readStates.get(a.id)?.isUnread ? 1 : 0;
            const bUnread = this.app.readStates.get(b.id)?.isUnread ? 1 : 0;
            if (aUnread !== bUnread) return bUnread - aUnread;

            const aTime =
                a.lastMessage?.createdAt?.getTime() ?? a.createdAt.getTime();
            const bTime =
                b.lastMessage?.createdAt?.getTime() ?? b.createdAt.getTime();
            return bTime - aTime;
        });
    }

    getDMChannel(userOne: Snowflake, userTwo: Snowflake) {
        return this.all
            .filter((ch) => ch.type === ChannelType.DM)
            .find(
                (ch) =>
                    ch.recipientIds?.includes(userOne) &&
                    ch.recipientIds?.includes(userTwo),
            );
    }

    async openDM(recipientId: Snowflake): Promise<Channel> {
        const meId = this.app.account!.id;
        const existing = this.getDMChannel(meId, recipientId);
        if (existing) {
            this.setActive(existing.id);
            this.setMostRecentChannelForSpace("@me", existing.id);
            return existing;
        }

        const data = await this.app.rest.post<
            APIChannel,
            { recipientId: Snowflake }
        >(`/channels/@me`, { recipientId });

        const channel = this.add(data);
        this.setActive(channel.id);
        this.setMostRecentChannelForSpace("@me", channel.id);
        return channel;
    }

    clear() {
        this.active = null;
        this.activeId = undefined;
        this.mostRecentBySpace.clear();
        this.channels.clear();
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

        const me = space.members.me;
        if (!me) return [];

        const all = space.channels;
        const collapsed =
            this.collapsedCategories.get(spaceId) || new Set<string>();

        const viewableNonCats = all.filter((ch) => {
            if (ch.type === ChannelType.Category) return false;
            if (types && types.length && !types.includes(ch.type)) return false;
            return me.canViewChannel(ch);
        });

        const categoryIdsToShow = new Set(
            viewableNonCats
                .map((c) => c.parentId)
                .filter((id): id is string => Boolean(id)),
        );

        const visibleNonCats = viewableNonCats.filter((ch) => {
            const parentId = ch.parentId ?? null;
            return !(parentId && collapsed.has(parentId));
        });

        const visibleCategories = all.filter((ch) => {
            if (ch.type !== ChannelType.Category) return false;

            const hasVisibleChildren = categoryIdsToShow.has(ch.id);
            if (hasVisibleChildren) return true;

            return me.canViewChannel(ch);
        });

        return this.sortPosition([...visibleCategories, ...visibleNonCats]);
    }

    compareChannels = (a: Channel, b: Channel): number =>
        (a.position ?? -1) - (b.position ?? -1);

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
        types: ChannelType[] = [ChannelType.Text],
    ): Channel | undefined {
        const visibleChannels = this.getSpaceVisibleChannels(spaceId, types);

        return visibleChannels.find((channel) => {
            if (channel.type === ChannelType.Category) return false;
            if (types.length > 0) return types.includes(channel.type);
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
