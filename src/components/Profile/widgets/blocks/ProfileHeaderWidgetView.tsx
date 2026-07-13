import { ProfileBlockImage } from "@components/Profile/shared/ProfileBlockImage";
import { ProfileMarkdownContent } from "@components/Profile/shared/ProfileMarkdownContent";
import { UserAvatar } from "@components/User/UserAvatar";
import type { AccountStore } from "@stores/Account.store";
import type { User } from "@stores/objects/User";
import type { UserProfile } from "@stores/objects/UserProfile";
import type {
  MobileProfileHeaderBlock,
  ProfileBlockSize,
} from "@mutualzz/types";
import { Stack, Typography } from "@mutualzz/ui-native";
import { useScaledProfileHeaderWidgetMetrics } from "@utils/accessibilityLayout";
import { View } from "react-native";

interface Props {
  block: MobileProfileHeaderBlock;
  size: ProfileBlockSize;
  user: User | AccountStore;
  profile: UserProfile;
}

export function ProfileHeaderWidgetView({ block, size, user, profile }: Props) {
  const metrics = useScaledProfileHeaderWidgetMetrics();
  const bannerUrl = profile.constructBannerUrl();
  const focusY = block.bannerFocusY ?? 50;
  const isLarge = size === "l";
  const avatarSize = isLarge ? metrics.avatarSizeL : metrics.avatarSizeM;
  const avatarOverlap = isLarge
    ? metrics.avatarOverlapL
    : metrics.avatarOverlapM;
  const bannerHeight = isLarge
    ? metrics.bannerHeightL
    : metrics.bannerHeightM;

  return (
    <View style={{ width: "100%", height: "100%" }}>
      <View
        style={{
          width: "100%",
          height: bannerHeight,
          overflow: "hidden",
          backgroundColor: bannerUrl ? undefined : user.accentColor,
          zIndex: 0,
        }}
      >
        {bannerUrl && (
          <ProfileBlockImage
            uri={bannerUrl}
            assetHash={profile.banner}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
            contentPosition={{ top: `${focusY}%` }}
          />
        )}
      </View>

      <Stack
        direction="column"
        flex={1}
        minWidth={0}
        minHeight={0}
        style={{
          gap: metrics.gap,
          paddingHorizontal: metrics.padding,
          paddingBottom: metrics.padding,
          marginTop: -avatarOverlap,
          zIndex: 1,
        }}
      >
        <Stack
          direction="row"
          alignItems="flex-end"
          minWidth={0}
          style={{ gap: metrics.gap }}
        >
          <View style={{ flexShrink: 0 }}>
            <UserAvatar user={user} size={avatarSize} />
          </View>

          <Stack
            direction="column"
            flex={1}
            minWidth={0}
            style={{
              gap: 2,
              paddingBottom: isLarge ? 2 : 4,
            }}
          >
            <Typography level={isLarge ? "title-sm" : "body-md"} weight="bold" truncate="double">
              {user.displayName}
            </Typography>
          </Stack>
        </Stack>

        {isLarge && profile.bio ? (
          <View style={{ flex: 1, minHeight: 0 }}>
            <ProfileMarkdownContent value={profile.bio} lineClamp={3} />
          </View>
        ) : null}
      </Stack>
    </View>
  );
}
