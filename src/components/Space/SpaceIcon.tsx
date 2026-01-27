import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import type { APISpacePartial } from "@mutualzz/types";
import { Avatar, type AvatarProps, Typography } from "@mutualzz/ui-native";
import { Space } from "@stores/objects/Space";
import { asAcronym } from "@utils/index";
import { observer } from "mobx-react-lite";

interface Props extends AvatarProps {
    space: Space | APISpacePartial;
    selected?: boolean;
}

export const SpaceIcon = observer(({ space, selected, ...props }: Props) => {
    const app = useAppStore();

    const iconUrl = space
        ? Space.constructIconUrl(
              space.id,
              space.icon?.startsWith("a_"),
              space.icon,
          )
        : null;

    if (iconUrl)
        return (
            <Avatar
                size={36}
                src={iconUrl}
                variant="plain"
                color="primary"
                elevation={5}
                shape={selected ? 15 : 10}
                {...props}
            >
                <Typography level="body-sm">{asAcronym(space.name)}</Typography>
            </Avatar>
        );

    return (
        <Paper
            style={{
                borderRadius: selected ? 15 : 10,
                width: 36,
                height: 36,
                boxShadow: "none",
            }}
            elevation={app.settings?.preferEmbossed ? 5 : 1}
            transparency={25}
        >
            <Avatar
                size={36}
                variant="plain"
                color="primary"
                shape={selected ? 15 : 10}
                {...props}
            >
                <Typography level="body-sm">{asAcronym(space.name)}</Typography>
            </Avatar>
        </Paper>
    );
});
