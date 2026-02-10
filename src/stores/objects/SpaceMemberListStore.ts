import { Logger } from "@mutualzz/logger";
import type { Snowflake } from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import type { Space } from "@stores/objects/Space";
import { SpaceMember } from "@stores/objects/SpaceMember";
import capitalize from "lodash/capitalize";
import { makeAutoObservable } from "mobx";

// TODO: Add types for this store
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

        makeAutoObservable(this);
    }

    update(data: any) {
        const { groups, id, memberCount, ops } = data;

        this.id = id;
        this.groups = groups;
        this.memberCount = memberCount;
        this.computeListData(ops);
    }

    private computeListData(ops: any) {
        for (const i of ops) {
            const { op, items, range, item, index } = i;
            switch (op) {
                case "SYNC": {
                    let listData: {
                        title: string;
                        data: { member: SpaceMember; index: number }[];
                    }[] = [];

                    for (const item of items) {
                        if ("group" in item) {
                            listData.push({
                                title: `${capitalize(item.group.id)}`,
                                data: [],
                            });
                        } else {
                            const member = this.space.members.get(
                                item.member.id,
                            );
                            if (member) {
                                listData[listData.length - 1].data.push({
                                    member,
                                    index: item.member.index,
                                });
                            } else {
                                const member = this.space.members.add(
                                    item.member,
                                );
                                if (member)
                                    listData[listData.length - 1].data.push({
                                        member,
                                        index: item.member.index,
                                    });
                            }
                        }
                    }

                    // remove empty groups
                    listData = listData.filter((i) => i.data.length > 0);

                    // add the number of members in each group to the group name
                    listData = listData.map((i) => ({
                        ...i,
                        title: `${i.title} - ${i.data.length}`,
                    }));

                    // hide offline group if it has more than 100 members
                    listData = listData.filter(
                        (i) =>
                            !(
                                i.title.toLowerCase().startsWith("offline") &&
                                i.data.length >= 100
                            ),
                    );

                    this.list = listData.map((i) => ({
                        name: i.title,
                        items: i.data
                            .sort((a, b) => {
                                const ua = a.member.user?.username;
                                const ub = b.member.user?.username;
                                if (ua && ub) {
                                    return ua.toLowerCase() > ub.toLowerCase()
                                        ? 1
                                        : -1;
                                }

                                return 0;
                            })
                            .map((i) => i.member),
                    }));

                    break;
                }
                case "DELETE": {
                    this.logger.warn("Unimplemented OP DELETE", item);
                    for (const item of items) {
                        if ("group" in item) {
                            this.logger.debug(
                                `Delete group ${item.group.id} from ${this.id}`,
                                i,
                            );
                            this.list.splice(range[0], 1);
                        } else {
                            this.list[range[0]].items.splice(range[1], 1);
                            this.logger.debug(
                                `Delete member ${item.member.user.username} from ${this.id}`,
                                i,
                            );
                        }
                    }
                    break;
                }
                case "UPDATE": {
                    this.logger.warn("Unimplemented OP UPDATE", item);
                    for (const item of items) {
                        if ("group" in item) {
                            this.list[range[0]].name = item.group.id;
                            this.logger.debug(
                                `Update group ${item.group.id} from ${this.id}`,
                                i,
                            );
                        } else {
                            //   this.listData[range[0]].data[range[1]] = item.member;
                            this.logger.debug(
                                `Update member ${item.member.user.username} from ${this.id}`,
                                i,
                            );
                        }
                    }
                    break;
                }
                case "INSERT": {
                    if ("group" in item) {
                        this.list.splice(index, 0, item.group.id);
                    } else {
                        // try to get the existing member
                        if (item.member.user?.id) {
                            const member = this.space.members.get(
                                item.member.user.id,
                            );
                            if (member) {
                                this.list[index].items.push(member);
                                return;
                            }
                        }

                        this.list[index].items.splice(
                            index,
                            0,
                            new SpaceMember(this.app, this.space, item.member),
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
}
