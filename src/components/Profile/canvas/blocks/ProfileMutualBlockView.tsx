import {
  getMutualSpaces,
  isProfileFriend,
} from "@components/Profile/canvas/profileBlockData.utils";
import { SpaceIcon } from "@components/Space/SpaceIcon";
import { useAppStore } from "@hooks/useStores";
import type { ProfileMutualBlock, Snowflake } from "@mutualzz/types";
import { Paper, Stack, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { UsersThreeIcon } from "phosphor-react-native";

interface Props {
  block: ProfileMutualBlock;
  userId: Snowflake;
}

export const ProfileMutualBlockView = observer(({ block, userId }: Props) => {
  const app = useAppStore();
  const maxItems = block.maxItems ?? 6;

  const mutualSpaces =
    block.mode === "spaces" ? getMutualSpaces(app, userId, maxItems) : [];
  const isFriend = block.mode === "friends" && isProfileFriend(app, userId);

  return (
    <Paper
      elevation={1}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 12,
        padding: 14,
        gap: 10,
        overflow: "hidden",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <UsersThreeIcon size={18} weight="fill" />
        <Typography level="body-sm" weight="bold">
          {block.mode === "spaces" ? "Mutual Spaces" : "Friends"}
        </Typography>
      </Stack>

      {block.mode === "friends" ? (
        <Typography level="body-sm" textColor={isFriend ? "primary" : "muted"}>
          {isFriend ? "You are friends" : "Not friends yet"}
        </Typography>
      ) : mutualSpaces.length === 0 ? (
        <Typography level="body-sm" textColor="muted">
          No mutual spaces
        </Typography>
      ) : (
        <Stack direction="column" spacing={0.75}>
          {mutualSpaces.map((space) => (
            <Stack
              key={space.id}
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <SpaceIcon space={space} size={24} />
              <Typography level="body-sm" numberOfLines={1}>
                {space.name}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </Paper>
  );
});
