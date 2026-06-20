import { useAppStore } from "@hooks/useStores";
import type { Snowflake } from "@mutualzz/types";
import { Box, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";

interface Props {
    roleId: Snowflake;
    spaceId?: Snowflake | null;
}

export const RoleMention = observer(({ roleId, spaceId }: Props) => {
    const app = useAppStore();

    const space = spaceId
        ? app.spaces.get(spaceId)
        : (app.spaces.active ?? null);
    const role = space?.roles.get(roleId);

    if (!role) {
        return (
            <Typography level="body-sm" textColor="muted">
                @{roleId}
            </Typography>
        );
    }

    return (
        <Box
            style={{
                backgroundColor: `${role.color}22`,
                borderRadius: 4,
                paddingHorizontal: 6,
                paddingVertical: 1,
            }}
        >
            <Typography level="body-sm" style={{ color: role.color }}>
                @{role.name}
            </Typography>
        </Box>
    );
});
