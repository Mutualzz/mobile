import type { APIRole } from "@mutualzz/types";
import { Box, Divider, Input, Switch, Typography } from "@mutualzz/ui-native";
import { useTranslation } from "react-i18next";

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
    const { t } = useTranslation("space");

    return (
        <Box style={{ gap: 16 }}>
            <Box style={{ gap: 8 }}>
                <Typography level="body-xs" textColor="muted">
                    {t("roles.display.roleName")}
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
                    {t("roles.display.roleColor")}
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
                    {t("roles.display.hoist")}
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
                        {t("roles.display.mentionable")}
                    </Typography>
                    <Typography level="body-xs" textColor="muted">
                        {t("roles.display.mentionableHintShort")}
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
