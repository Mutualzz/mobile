import { Logger } from "@mutualzz/logger";
import type { Snowflake } from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import type { Space } from "@stores/objects/Space";
import { SpaceMember } from "@stores/objects/SpaceMember";
import capitalize from "lodash/capitalize";
import { makeAutoObservable } from "mobx";

export class SpaceMemberListStore {
    private readonly logger = new Logger({
        tag: "SpaceMemberListStore",
    });

    id: Snowflake;
    private readonly space: Space;
    memberCount: number;

    list: { name: string; items: SpaceMember[] }[] = [];

    groups: any[] = [];

    constructor(
        private readonly app: AppStore,
        space: Space,
        data: any,
    ) {
        this.space = space;

        const { groups, id, memberCount, ops } = data;

        this.id = id;
        this.groups = groups;
        this.memberCount = memberCount;
        this.computeListData(ops);

        makeAutoObservable(this, {}, { autoBind: true });
    }

    update(data: any) {
        const { groups, id, memberCount, ops } = data;

        this.id = id;
        this.groups = groups;
        this.memberCount = memberCount;
        this.computeListData(ops);
    }

    private getGroupName(group: any) {
        if (group.id === "online") return "Online";
        if (group.id === "offline") return "Offline";
        return group.name;
    }

    private computeListData(ops: any) {
        const syncItems: any[] = [];
        const otherOps: any[] = [];

        for (const op of ops ?? []) {
            if (op.op === "SYNC") syncItems.push(...(op.items ?? []));
            else otherOps.push(op);
        }

        if (syncItems.length > 0) {
            this.applySyncItems(syncItems);
        }

        for (const i of otherOps) {
            const { op, items, range, item, index } = i;

            switch (op) {
                case "DELETE": {
                    const groupIndex = range?.[0];
                    const memberIndex = range?.[1];

                    if (typeof groupIndex !== "number" || !this.list[groupIndex]) {
                        break;
                    }

                    const entry = (items ?? [])[0];
                    if (!entry) break;

                    if ("group" in entry) {
                        this.list.splice(groupIndex, 1);
                        break;
                    }

                    if (typeof memberIndex !== "number") break;

                    this.list[groupIndex].items.splice(memberIndex, 1);
                    break;
                }
                case "UPDATE": {
                    const groupIndex = range?.[0];
                    const memberIndex = range?.[1];

                    if (typeof groupIndex !== "number" || !this.list[groupIndex]) {
                        break;
                    }

                    const first = (items ?? [])[0];
                    if (!first) break;

                    if ("group" in first) {
                        this.list[groupIndex].name = first.group.id;
                        break;
                    }

                    const memberKey = first.member?.userId;
                    if (!memberKey) break;

                    const storeMember = this.space.members.get(memberKey);
                    storeMember?.update(first.member);

                    if (typeof memberIndex === "number") {
                        const visibleMember =
                            this.list[groupIndex].items[memberIndex];

                        if (visibleMember && visibleMember.userId === memberKey) {
                            visibleMember.update(first.member);
                        } else {
                            const idx = this.list[groupIndex].items.findIndex(
                                (member) => member.userId === memberKey,
                            );
                            if (idx !== -1) {
                                this.list[groupIndex].items[idx].update(
                                    first.member,
                                );
                            }
                        }
                    }

                    break;
                }
                case "INSERT": {
                    if ("group" in item) {
                        const at =
                            typeof index === "number"
                                ? index
                                : (range?.[0] ?? this.list.length);

                        this.list.splice(at, 0, {
                            name: `${capitalize(item.group.id)}`,
                            items: [],
                        });
                        break;
                    }

                    const groupIndex = range?.[0] ?? index;
                    const memberIndex = range?.[1] ?? 0;

                    if (typeof groupIndex !== "number" || !this.list[groupIndex]) {
                        break;
                    }

                    const memberKey = item.member?.userId;
                    let memberObj = memberKey
                        ? this.space.members.get(memberKey)
                        : undefined;

                    if (memberObj) {
                        memberObj.update(item.member);
                    } else {
                        memberObj = this.space.members.add(item.member);
                    }

                    if (memberObj) {
                        this.list[groupIndex].items.splice(
                            memberIndex,
                            0,
                            memberObj,
                        );
                    }

                    break;
                }
                default: {
                    this.logger.warn(`Unknown OP: ${op}`);
                    break;
                }
            }
        }
    }

    private applySyncItems(items: any[]) {
        let listData: {
            id: string;
            title: string;
            data: { member: SpaceMember; index: number }[];
        }[] = [];

        for (const entry of items) {
            if ("group" in entry) {
                listData.push({
                    id: entry.group.id,
                    title: this.getGroupName(entry.group),
                    data: [],
                });
                continue;
            }

            if (listData.length === 0) {
                this.logger.warn("SYNC: member without group header", entry);
                continue;
            }

            const memberPayload = entry.member;
            const memberKey = memberPayload?.userId;
            if (!memberKey) continue;

            let member = this.space.members.get(memberKey);
            if (member) {
                member.update(memberPayload);
            } else {
                member = this.space.members.add(memberPayload);
            }

            if (!member) continue;

            listData[listData.length - 1].data.push({
                member,
                index: entry.index,
            });
        }

        listData = listData.filter((group) => group.data.length > 0);

        listData = listData.map((group) => ({
            ...group,
            title: `${group.title} - ${group.data.length}`,
        }));

        listData = listData.filter(
            (group) =>
                !(
                    group.id.toLowerCase().startsWith("offline") &&
                    group.data.length >= 100
                ),
        );

        this.list = listData.map((group) => ({
            name: group.title,
            items: group.data
                .slice()
                .sort((a, b) => {
                    const ua = a.member.displayName ?? "";
                    const ub = b.member.displayName ?? "";
                    return ua.localeCompare(ub, undefined, {
                        sensitivity: "base",
                    });
                })
                .map((entry) => entry.member),
        }));
    }
}
