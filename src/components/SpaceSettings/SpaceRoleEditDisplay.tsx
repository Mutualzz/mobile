import type { APIRole } from "@mutualzz/types";
import { SettingsToggleRow } from "@components/UserSettings/SettingsField";
import { Box, Divider, Input, Typography } from "@mutualzz/ui-native";
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

            <SettingsToggleRow
                title={t("roles.display.hoist")}
                checked={!!changes.hoist}
                onChange={(hoist) =>
                    setChanges((prev) => ({ ...prev, hoist }))
                }
            />

            <Divider lineColor="muted" style={{ opacity: 0.35 }} />

            <SettingsToggleRow
                title={t("roles.display.mentionable")}
                description={t("roles.display.mentionableHintShort")}
                checked={!!changes.mentionable}
                onChange={(mentionable) =>
                    setChanges((prev) => ({ ...prev, mentionable }))
                }
            />
        </Box>
    );
};
