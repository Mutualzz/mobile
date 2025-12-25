import type { APISpaceMember } from "@mutualzz/types";
import { makeAutoObservable, observable, type ObservableMap } from "mobx";
import type { AppStore } from "./App.store";
import type { Space } from "./objects/Space";
import { SpaceMember } from "./objects/SpaceMember";

export class SpaceMemberStore {
    private readonly members: ObservableMap<string, SpaceMember>; // spaceMemberId -> SpaceMember
    private readonly space: Space;

    constructor(
        private readonly app: AppStore,
        space: Space,
    ) {
        this.space = space;
        this.members = observable.map();

        makeAutoObservable(this);
    }

    add(member: APISpaceMember) {
        const exists = this.members.get(member.userId);
        if (exists) return exists;
        const m = new SpaceMember(this.app, this.space, member);
        this.members.set(member.userId, m);
        return m;
    }

    addAll(members: APISpaceMember[]) {
        members.forEach((member) => this.add(member));
    }

    remove(id: string) {
        this.members.delete(id);
    }

    update(member: APISpaceMember) {
        if (!member.userId) {
            throw new Error("Member does not have a user");
        }
        this.members.get(member.userId)?.update(member);
    }

    get(id: string) {
        return this.members.get(id);
    }

    has(id: string) {
        return this.members.has(id);
    }

    get all() {
        return Array.from(this.members.values());
    }

    get size() {
        return this.members.size;
    }

    get me() {
        const meId = this.app.account?.id;
        if (!meId) return null;
        return this.get(meId);
    }
}
