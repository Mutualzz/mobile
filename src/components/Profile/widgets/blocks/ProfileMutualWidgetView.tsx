import {
  getMutualSpaces,
  isProfileFriend,
} from "@components/Profile/canvas/profileBlockData.utils";
import { SpaceIcon } from "@components/Space/SpaceIcon";
import { useAppStore } from "@hooks/useStores";
import type {
  MobileProfileMutualBlock,
  ProfileBlockSize,
  Snowflake,
} from "@mutualzz/types";
import { Stack, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { UsersThreeIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

const VISIBLE_COUNT: Record<ProfileBlockSize, number> = { s: 3, m: 6, l: 10 };

interface Props {
  block: MobileProfileMutualBlock;
  size: ProfileBlockSize;
  userId: Snowflake;
}

export const ProfileMutualWidgetView = observer(
  ({ block, size, userId }: Props) => {
    const { t } = useTranslation("settings");
    const app = useAppStore();
    const maxItems = block.maxItems ?? 6;

    const mutualSpaces =
      block.mode === "spaces" ? getMutualSpaces(app, userId, maxItems) : [];
    const isFriend = block.mode === "friends" && isProfileFriend(app, userId);
    const visible = mutualSpaces.slice(0, VISIBLE_COUNT[size]);

    return (
      <View style={{ width: "100%", height: "100%", padding: 12, gap: 8 }}>
        <Stack direction="row" alignItems="center" style={{ gap: 6 }}>
          <UsersThreeIcon size={16} weight="fill" />
          <Typography level="body-sm" weight="bold">
            {block.mode === "spaces"
              ? t("profile.blocks.mutualSpaces")
              : t("profile.blocks.friendsStatus")}
          </Typography>
        </Stack>

        {block.mode === "friends" ? (
          <Typography
            level="body-sm"
            textColor={isFriend ? "primary" : "muted"}
          >
            {isFriend
              ? t("profile.blocks.youAreFriends")
              : t("profile.blocks.notFriendsYet")}
          </Typography>
        ) : visible.length === 0 ? (
          <Typography level="body-sm" textColor="muted">
            {t("profile.blocks.noMutualSpaces")}
          </Typography>
        ) : (
          <Stack direction="column" style={{ gap: 6 }}>
            {visible.map((space) => (
              <Stack
                key={space.id}
                direction="row"
                alignItems="center"
                style={{ gap: 8 }}
              >
                <SpaceIcon space={space} size={24} />
                <Typography
                  level="body-sm"
                  truncate="single"
                  style={{ flex: 1, minWidth: 0 }}
                >
                  {space.name}
                </Typography>
              </Stack>
            ))}
            {mutualSpaces.length > visible.length && (
              <Typography level="body-xs" textColor="muted">
                {t("profile.blocks.moreCount", {
                  value: mutualSpaces.length - visible.length,
                })}
              </Typography>
            )}
          </Stack>
        )}
      </View>
    );
  },
);

export const ProfileMutualWidgetExpandedContent = observer(
  ({
    block,
    userId,
  }: {
    block: MobileProfileMutualBlock;
    userId: Snowflake;
  }) => {
    const { t } = useTranslation("settings");
    const app = useAppStore();
    const maxItems = block.maxItems ?? 6;
    const mutualSpaces =
      block.mode === "spaces" ? getMutualSpaces(app, userId, maxItems) : [];
    const isFriend = block.mode === "friends" && isProfileFriend(app, userId);

    if (block.mode === "friends") {
      return (
        <Typography level="body-sm" textColor={isFriend ? "primary" : "muted"}>
          {isFriend
            ? t("profile.blocks.youAreFriends")
            : t("profile.blocks.notFriendsYet")}
        </Typography>
      );
    }

    if (mutualSpaces.length === 0) {
      return (
        <Typography level="body-sm" textColor="muted">
          {t("profile.blocks.noMutualSpaces")}
        </Typography>
      );
    }

    return (
      <Stack direction="column" style={{ gap: 6 }}>
        {mutualSpaces.map((space) => (
          <Stack
            key={space.id}
            direction="row"
            alignItems="center"
            style={{ gap: 6 }}
          >
            <SpaceIcon space={space} size={22} />
            <Typography level="body-sm" truncate="single">
              {space.name}
            </Typography>
          </Stack>
        ))}
      </Stack>
    );
  },
);
