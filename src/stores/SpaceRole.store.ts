import type { APIRole, Snowflake } from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import { Role } from "@stores/objects/Role";
import type { Space } from "@stores/objects/Space";
import { makeAutoObservable, observable, runInAction, type ObservableMap } from "mobx";

export const compareRolesByHierarchy = (a: Role, b: Role): number => {
    if (a.position !== b.position) return b.position - a.position;

    const aid = BigInt(a.id);
    const bid = BigInt(b.id);
    if (aid > bid) return -1;
    if (aid < bid) return 1;
    return 0;
};

export class SpaceRoleStore {
    private readonly roles: ObservableMap<string, Role>;
    private readonly space: Space;

    constructor(
        private readonly app: AppStore,
        space: Space,
    ) {
        this.space = space;
        this.roles = observable.map();

        makeAutoObservable(this, {}, { autoBind: true });
    }

    get all() {
        return Array.from(this.roles.values());
    }

    get sorted() {
        return this.all.slice().sort((a, b) => a.position - b.position);
    }

    get assignable() {
        return this.sorted.filter((role) => role.id !== this.space.id);
    }

    get byHierarchy() {
        return this.assignable.slice().sort(compareRolesByHierarchy);
    }

    create() {
        return this.app.rest.put<APIRole>(`/spaces/${this.space.id}/roles`);
    }

    get size() {
        return this.roles.size;
    }

    get everyone() {
        return this.roles.get(this.space.id);
    }

    add(role: APIRole) {
        const exists = this.roles.get(role.id);
        if (exists) return exists;

        const r = new Role(this.app, role);
        this.roles.set(role.id, r);

        this.invalidateMePermCache();
        return r;
    }

    addAll(roles: APIRole[]) {
        return roles.map((role) => this.add(role));
    }

    remove(id: Snowflake) {
        const existed = this.roles.delete(id);
        if (existed) this.invalidateMePermCache();
    }

    update(role: APIRole) {
        const r = this.roles.get(role.id);
        if (!r) return;

        r.update(role);
        this.invalidateMePermCache();
    }

    get(id: Snowflake) {
        return this.roles.get(id);
    }

    has(id: Snowflake) {
        return this.roles.has(id);
    }

    async reorderRoles(orderedRoles: Role[], positionCeiling?: number) {
        const ceiling = positionCeiling ?? orderedRoles.length;
        const updates: { role: Role; position: number }[] = [];

        orderedRoles.forEach((role, index) => {
            const newPosition = ceiling - index;
            if (role.position !== newPosition) {
                updates.push({ role, position: newPosition });
            }
        });

        if (updates.length === 0) return;

        const snapshot = updates.map(({ role }) => ({
            id: role.id,
            position: role.position,
        }));

        runInAction(() => {
            for (const { role, position } of updates) {
                role.position = position;
            }
        });

        try {
            const results = await Promise.all(
                updates.map(({ role, position }) =>
                    this.app.rest.patch<APIRole>(
                        `/spaces/${this.space.id}/roles/${role.id}`,
                        { position },
                    ),
                ),
            );

            for (const data of results) {
                if (data) this.update(data);
            }
        } catch (error) {
            runInAction(() => {
                for (const { id, position } of snapshot) {
                    const role = this.roles.get(id);
                    if (role) role.position = position;
                }
            });
            throw error;
        }
    }

    private invalidateMePermCache() {
        this.space.members.me?.invalidateChannelPermCache?.();
    }
}
