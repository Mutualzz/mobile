import { Paper } from "@components/Paper";
import type { APISpacePartial } from "@mutualzz/types";
import { resolveSize, type Size } from "@mutualzz/ui-core";
import { Avatar, type AvatarProps, Typography, useTheme } from "@mutualzz/ui-native";
import { Space } from "@stores/objects/Space";
import { asAcronym } from "@utils/index";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

interface Props extends AvatarProps {
  space?: Space | APISpacePartial | null;
  selected?: boolean;
}

const baseSizeMap: Record<Size, number> = {
  sm: 32,
  md: 40,
  lg: 56,
};

export const SpaceIcon = observer(({ space, selected, size = 36, ...props }: Props) => {
  const { t } = useTranslation("chat");
  const { theme } = useTheme();
  const resolvedSize = resolveSize(theme, size, baseSizeMap);
  const iconUrl = space
    ? Space.constructIconUrl(space.id, space.icon?.startsWith("a_"), space.icon)
    : null;
  const fallbackName = space?.name ?? t("privateSpace");

  if (iconUrl)
    return (
      <Avatar
        size={resolvedSize}
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
        width: resolvedSize,
        height: resolvedSize,
      }}
    >
      <Avatar
        size={resolvedSize}
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
