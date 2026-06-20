import type { APIRole } from "@mutualzz/types";
import { Box, Divider, Input, Switch, Typography } from "@mutualzz/ui-native";

export type RoleEditable = Pick<
    APIRole,
    "name" | "color" | "position" | "allow" | "hoist" | "mentionable"
>;

export type SetRoleEditable = (
    next: RoleEditable | ((prev: RoleEditable) => RoleEditable),
) => void;

interface Props {
    changes: RoleEditable;
    setChanges: SetRoleEditable;
}

export const SpaceRoleEditDisplay = ({ changes, setChanges }: Props) => {
    return (
        <Box style={{ gap: 16 }}>
            <Box style={{ gap: 8 }}>
                <Typography level="body-xs" textColor="muted">
                    Role name
                </Typography>
                <Input
                    value={changes.name ?? ""}
                    onChangeText={(name) =>
                        setChanges((prev) => ({ ...prev, name }))
                    }
                    maxLength={64}
                />
            </Box>

            <Divider lineColor="muted" style={{ opacity: 0.35 }} />

            <Box style={{ gap: 8 }}>
                <Typography level="body-xs" textColor="muted">
                    Role color
                </Typography>
                <Input
                    value={String(changes.color ?? "#ffffff")}
                    onChangeText={(color) =>
                        setChanges((prev) => ({ ...prev, color }))
                    }
                    autoCapitalize="none"
                    placeholder="#5865f2"
                />
            </Box>

            <Divider lineColor="muted" style={{ opacity: 0.35 }} />

            <Box
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                }}
            >
                <Typography level="body-sm" style={{ flex: 1 }}>
                    Display role members separately from online members
                </Typography>
                <Switch
                    checked={!!changes.hoist}
                    onChange={(hoist) =>
                        setChanges((prev) => ({ ...prev, hoist }))
                    }
                />
            </Box>

            <Divider lineColor="muted" style={{ opacity: 0.35 }} />

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
                        Allow anyone to @mention this role
                    </Typography>
                    <Typography level="body-xs" textColor="muted">
                        Members with the mention-everyone permission can still
                        mention this role.
                    </Typography>
                </Box>
                <Switch
                    checked={!!changes.mentionable}
                    onChange={(mentionable) =>
                        setChanges((prev) => ({ ...prev, mentionable }))
                    }
                />
            </Box>
        </Box>
    );
};
