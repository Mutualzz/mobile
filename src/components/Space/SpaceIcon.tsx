import { Paper } from "@components/Paper";
import type { APISpacePartial } from "@mutualzz/types";
import { Avatar, type AvatarProps, Typography } from "@mutualzz/ui-native";
import { Space } from "@stores/objects/Space";
import { asAcronym } from "@utils/index";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

interface Props extends AvatarProps {
  space?: Space | APISpacePartial | null;
  selected?: boolean;
}

export const SpaceIcon = observer(({ space, selected, ...props }: Props) => {
  const { t } = useTranslation("chat");
  const iconUrl = space
    ? Space.constructIconUrl(space.id, space.icon?.startsWith("a_"), space.icon)
    : null;
  const fallbackName = space?.name ?? t("privateSpace");

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
        <Typography level="body-sm">{asAcronym(fallbackName)}</Typography>
      </Avatar>
    );

  return (
    <Paper
      style={{
        borderRadius: selected ? 15 : 10,
        width: 36,
        height: 36,
      }}
      transparency={25}
    >
      <Avatar
        size={36}
        variant="plain"
        color="primary"
        shape={selected ? 15 : 10}
        {...props}
      >
        <Typography level="body-sm">{asAcronym(fallbackName)}</Typography>
      </Avatar>
    </Paper>
  );
});
