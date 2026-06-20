import {
    filterPermissionGroups,
    SPACE_PERMISSION_GROUPS,
} from "@components/SpaceSettings/permissionGroups";
import type {
    RoleEditable,
    SetRoleEditable,
} from "@components/SpaceSettings/SpaceRoleEditDisplay";
import {
    BitField,
    permissionFlags,
    type PermissionFlag,
    type PermissionFlags,
} from "@mutualzz/bitfield";
import { Box, Button, Divider, Input, Switch, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { Pressable } from "react-native";

interface Props {
    changes: RoleEditable;
    setChanges: SetRoleEditable;
}

export const SpaceRoleEditPermissions = observer(({ changes, setChanges }: Props) => {
    const [search, setSearch] = useState("");

    const permissions: BitField<PermissionFlags> = changes.allow
        ? BitField.fromString(permissionFlags, changes.allow.toString())
        : BitField.fromString(permissionFlags, "0");

    const visibleGroups = useMemo(
        () => filterPermissionGroups(SPACE_PERMISSION_GROUPS, search),
        [search],
    );

    const togglePermission = (flag: PermissionFlag) => {
        const next = permissions.has(flag)
            ? permissions.remove(flag)
            : permissions.add(flag);

        setChanges((prev) => ({
            ...prev,
            allow: next.bits,
        }));
    };

    return (
        <Box style={{ gap: 16 }}>
            <Input
                value={search}
                onChangeText={setSearch}
                placeholder="Search permissions..."
            />

            <Button
                size="sm"
                color="danger"
                variant="soft"
                style={{ alignSelf: "flex-start" }}
                disabled={permissions.toArray().length === 0}
                onPress={() =>
                    setChanges((prev) => ({
                        ...prev,
                        allow: 0n,
                    }))
                }
            >
                Clear permissions
            </Button>

            {visibleGroups.length === 0 ? (
                <Typography
                    level="body-sm"
                    textColor="muted"
                    style={{ textAlign: "center", paddingVertical: 24 }}
                >
                    No permissions match your search
                </Typography>
            ) : (
                visibleGroups.map((group, groupIndex) => (
                    <Box key={group.title} style={{ gap: 12 }}>
                        <Typography level="body-md" weight={700}>
                            {group.title}
                        </Typography>
                        {group.items.map((item, itemIndex) => (
                            <Box key={item.flag} style={{ gap: 12 }}>
                                <Pressable
                                    onPress={() => togglePermission(item.flag)}
                                >
                                    <Box
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 12,
                                        }}
                                    >
                                        <Box style={{ flex: 1, gap: 4 }}>
                                            <Typography level="body-sm">
                                                {item.label}
                                            </Typography>
                                            {item.description ? (
                                                <Typography
                                                    level="body-xs"
                                                    textColor="muted"
                                                >
                                                    {item.description}
                                                </Typography>
                                            ) : null}
                                        </Box>
                                        <Switch
                                            checked={permissions.has(item.flag)}
                                            onChange={() =>
                                                togglePermission(item.flag)
                                            }
                                        />
                                    </Box>
                                </Pressable>
                                {itemIndex < group.items.length - 1 ? (
                                    <Divider
                                        lineColor="muted"
                                        style={{ opacity: 0.25 }}
                                    />
                                ) : null}
                            </Box>
                        ))}
                        {groupIndex < visibleGroups.length - 1 ? (
                            <Divider lineColor="muted" style={{ opacity: 0.35 }} />
                        ) : null}
                    </Box>
                ))
            )}
        </Box>
    );
});
