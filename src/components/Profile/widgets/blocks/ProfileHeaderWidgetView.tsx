import { ProfileMarkdownContent } from "@components/Profile/shared/ProfileMarkdownContent";
import { UserAvatar } from "@components/User/UserAvatar";
import type { AccountStore } from "@stores/Account.store";
import type { User } from "@stores/objects/User";
import type { UserProfile } from "@stores/objects/UserProfile";
import type { MobileProfileHeaderBlock, ProfileBlockSize } from "@mutualzz/types";
import { Stack, Typography } from "@mutualzz/ui-native";
import { Image, View } from "react-native";

const AVATAR_SIZE = 56;
const BANNER_HEIGHT = 64;
// Overscan the image beyond the visible banner strip so we can shift it
// vertically to approximate desktop's `background-position center Y%` crop.
const BANNER_OVERSCAN_HEIGHT = BANNER_HEIGHT * 1.6;

interface Props {
  block: MobileProfileHeaderBlock;
  size: ProfileBlockSize;
  user: User | AccountStore;
  profile: UserProfile;
}

export function ProfileHeaderWidgetView({ block, size, user, profile }: Props) {
  const bannerUrl = profile.constructBannerUrl();
  const focusY = block.bannerFocusY ?? 50;
  const maxShift = BANNER_OVERSCAN_HEIGHT - BANNER_HEIGHT;
  const bannerTop = -maxShift * (Math.min(100, Math.max(0, focusY)) / 100);

  return (
    <View style={{ width: "100%", height: "100%" }}>
      {size === "l" ? (
        <View
          style={{
            width: "100%",
            height: BANNER_HEIGHT,
            overflow: "hidden",
            backgroundColor: bannerUrl ? undefined : user.accentColor,
          }}
        >
          {bannerUrl ? (
            <Image
              source={{ uri: bannerUrl }}
              style={{
                position: "absolute",
                width: "100%",
                height: BANNER_OVERSCAN_HEIGHT,
                top: bannerTop,
              }}
              resizeMode="cover"
            />
          ) : null}
        </View>
      ) : null}

      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        p={1.5}
        flex={1}
        minWidth={0}
        minHeight={0}
        style={size === "l" ? { marginTop: -AVATAR_SIZE / 2 } : undefined}
      >
        <UserAvatar user={user} size={AVATAR_SIZE} />
        <Stack direction="column" spacing={0.25} flex={1} minWidth={0}>
          <Typography level="title-sm" numberOfLines={1}>
            {user.displayName}
          </Typography>
          {size === "l" && profile.bio ? (
            <ProfileMarkdownContent value={profile.bio} lineClamp={2} />
          ) : null}
        </Stack>
      </Stack>
    </View>
  );
}
