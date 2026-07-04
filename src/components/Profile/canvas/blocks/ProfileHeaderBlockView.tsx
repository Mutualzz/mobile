import { ProfileMarkdownContent } from "@components/Profile/shared/ProfileMarkdownContent";
import { UserAvatar } from "@components/User/UserAvatar";
import type { AccountStore } from "@stores/Account.store";
import type { User } from "@stores/objects/User";
import type { UserProfile } from "@stores/objects/UserProfile";
import type { ProfileHeaderBlock } from "@mutualzz/types";
import { Paper, Stack, Typography } from "@mutualzz/ui-native";
import { Image, View } from "react-native";

const AVATAR_SIZE = 72;
const AVATAR_OVERLAP = AVATAR_SIZE / 2;
const DEFAULT_BANNER_HEIGHT = 58;

interface Props {
  user: User | AccountStore;
  profile: UserProfile;
  block: ProfileHeaderBlock;
}

export function ProfileHeaderBlockView({ user, profile, block }: Props) {
  const bannerUrl = profile.constructBannerUrl();
  const bannerHeight = block.bannerHeight ?? DEFAULT_BANNER_HEIGHT;

  return (
    <Paper
      elevation={1}
      style={{ width: "100%", height: "100%", overflow: "hidden" }}
    >
      <View
        style={{
          width: "100%",
          height: `${bannerHeight}%`,
          minHeight: 64,
          backgroundColor: bannerUrl ? undefined : user.accentColor,
        }}
      >
        {bannerUrl ? (
          <Image
            source={{ uri: bannerUrl }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : null}
      </View>

      <Stack
        direction="row"
        alignItems="flex-start"
        spacing={1.5}
        px={2}
        pb={1.5}
        flex={1}
        minWidth={0}
        minHeight={0}
        style={{ marginTop: -AVATAR_OVERLAP }}
      >
        <UserAvatar user={user} size={AVATAR_SIZE} />

        <Stack
          direction="column"
          spacing={profile.bio ? 0.5 : 0}
          flex={1}
          minWidth={0}
          minHeight={0}
          style={{ paddingTop: AVATAR_OVERLAP }}
        >
          <Typography level="title-md">{user.displayName}</Typography>
          {profile.bio ? (
            <ProfileMarkdownContent value={profile.bio} lineClamp={3} />
          ) : null}
        </Stack>
      </Stack>
    </Paper>
  );
}
