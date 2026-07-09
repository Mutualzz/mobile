import { type APIUser } from "@mutualzz/types";
import { makeAutoObservable, observable, type ObservableMap } from "mobx";
import type { AppStore } from "./App.store";
import { User } from "./objects/User";

export class UserStore {
    readonly users: ObservableMap<string, User>;

    constructor(private readonly app: AppStore) {
        this.users = observable.map();
        makeAutoObservable(this);
    }

    add(user: APIUser): User {
        const exists = this.users.get(user.id);
        if (exists) return exists;

        const newUser = new User(user);
        this.users.set(user.id, newUser);
        return newUser;
    }

    addAll(users: APIUser[]): User[] {
        return users.map((user) => this.add(user));
    }

    update(user: APIUser) {
        this.users.get(user.id)?.update(user);
    }

    get(id: string) {
        return this.users.get(id);
    }

    remove(id: string) {
        this.users.delete(id);
    }

    get all() {
        return Array.from(this.users.values());
    }

    get count() {
        return this.users.size;
    }

    has(id: string) {
        return this.users.has(id);
    }

    async resolve(id: string, force = false) {
        if (this.has(id) && !force) return this.get(id);
        const user = await this.app.rest.get<APIUser>(`/users/${id}`);
        if (!user) return undefined;
        if (this.has(user.id)) {
            this.update(user);
            return this.get(user.id);
        }
        return this.add(user);
    }

    async resolveByIdentifier(identifier: string, force = false) {
        const normalized = identifier.trim().toLowerCase();
        const cached = this.all.find(
            (user) =>
                user.id === normalized ||
                user.username.toLowerCase() === normalized,
        );
        if (cached && !force) return cached;

        const user = await this.app.rest.get<APIUser>(
            `/users/${encodeURIComponent(normalized)}`,
        );
        if (!user) return undefined;
        if (this.has(user.id)) {
            this.update(user);
            return this.get(user.id);
        }
        return this.add(user);
    }

    async resolveSystem() {
        const id = "1";
        if (this.has(id)) return this.get(id);
        const user = await this.app.rest.get<APIUser>(`/users/${id}`);
        if (!user) return undefined;
        return this.add(user);
    }

    clear() {
        this.users.clear();
    }
}
