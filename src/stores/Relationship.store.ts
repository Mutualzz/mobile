import { makeAutoObservable, observable } from "mobx";
import type { AppStore } from "@stores/App.store";
import { Relationship } from "@stores/objects/Relationship";
import type { APIInvite, APIRelationship, Snowflake } from "@mutualzz/types";

function relationshipKey(userId: Snowflake, otherUserId: Snowflake) {
    return BigInt(userId) < BigInt(otherUserId)
        ? `${userId}:${otherUserId}`
        : `${otherUserId}:${userId}`;
}

export class RelationshipStore {
    private readonly relationships = observable.map<string, Relationship>();

    constructor(private readonly app: AppStore) {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    get all() {
        return Array.from(this.relationships.values());
    }

    get count() {
        return this.relationships.size;
    }

    clear() {
        this.relationships.clear();
    }

    add(data: APIRelationship): Relationship {
        const key = relationshipKey(data.userId, data.otherUserId);
        const exists = this.relationships.get(key);
        if (exists) return exists;

        const relationship = new Relationship(this.app, data);
        this.relationships.set(key, relationship);
        return relationship;
    }

    addAll(data: APIRelationship[]): Relationship[] {
        return data.map((relationship) => this.add(relationship));
    }

    update(data: APIRelationship) {
        const key = relationshipKey(data.userId, data.otherUserId);
        const existing = this.relationships.get(key);
        if (existing) return existing.update(data);

        return this.add(data);
    }

    remove(userId: Snowflake, otherUserId: Snowflake) {
        this.relationships.delete(relationshipKey(userId, otherUserId));
    }

    get(userId: Snowflake, otherUserId: Snowflake) {
        return this.relationships.get(relationshipKey(userId, otherUserId));
    }

    getForMe(userId: Snowflake) {
        const me = this.app.account?.id;
        if (!me) return undefined;

        return this.get(me, userId) || this.get(userId, me);
    }

    getFriendByUserId(userId: Snowflake) {
        const rel = this.getForMe(userId);
        return rel?.isFriend ? rel : undefined;
    }

    getIncoming() {
        return this.all.filter((r) => r.isIncomingRequest);
    }

    getOutgoing() {
        return this.all.filter((r) => r.isOutgoingRequest);
    }

    get friends() {
        return this.all.filter((r) => r.isFriend);
    }

    get online() {
        return this.all
            .filter((r) => r.isFriend)
            .filter((r) => {
                const friendId = r.otherUserIdForMe;
                if (!friendId) return false;
                const status =
                    this.app.presence.get(friendId)?.status ?? "offline";
                return status !== "offline" && status !== "invisible";
            });
    }

    get pending() {
        return [...this.getIncoming(), ...this.getOutgoing()];
    }

    get blocked() {
        return this.all.filter((r) => r.isBlocked);
    }

    getBlocked() {
        return this.all.filter((r) => r.isBlocked);
    }

    isFriend(userId: Snowflake) {
        return this.getFriendByUserId(userId) != null;
    }

    isBlocked(userId: Snowflake) {
        return this.getForMe(userId)?.isBlocked ?? false;
    }

    async openDMWith(userId: Snowflake) {
        return this.app.channels.openDM(userId);
    }

    async resolveAll(force = false) {
        if (!force && this.count > 0) return this.all;
        const data =
            await this.app.rest.get<APIRelationship[]>(`/@me/relationships`);
        if (!data) return [];
        return this.addAll(data);
    }

    async sendFriendRequest(identifier: string) {
        const response = await this.app.rest.post<APIRelationship>(
            `/@me/relationships`,
            { identifier: identifier.trim() },
        );
        if (response) this.update(response);
        return response;
    }

    async acceptFriendRequest(userId: Snowflake) {
        return this.app.rest.patch<APIRelationship>(
            `/@me/relationships/${userId}/accept`,
        );
    }

    async declineFriendRequest(userId: Snowflake) {
        return this.app.rest.patch(`/@me/relationships/${userId}/decline`);
    }

    async removeFriend(userId: Snowflake) {
        return this.app.rest.delete(`/@me/relationships/${userId}`);
    }

    async blockUser(userId: Snowflake) {
        return this.app.rest.put<APIRelationship>(
            `/@me/relationships/${userId}/block`,
        );
    }

    async unblockUser(userId: Snowflake) {
        return this.app.rest.delete(`/@me/relationships/${userId}/block`);
    }

    async getFriendInvite() {
        return this.app.rest.get<APIInvite | null>(`/@me/invites/friend`);
    }

    async createFriendInvite() {
        return this.app.rest.post<APIInvite>(`/@me/invites/friend`, {});
    }

    async acceptFriendInvite(code: string) {
        const response = await this.app.rest.put<APIRelationship>(
            `/invites/${code}/friend`,
            {},
        );
        if (response) this.update(response);
        return response;
    }
}
