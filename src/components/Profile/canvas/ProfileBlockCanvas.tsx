import { ProfileBlockRenderer } from "@components/Profile/canvas/ProfileBlockRenderer";
import { ProfileCanvasViewport } from "@components/Profile/canvas/ProfileCanvasViewport";
import type { AccountStore } from "@stores/Account.store";
import type { User } from "@stores/objects/User";
import type { UserProfile } from "@stores/objects/UserProfile";
import {
  PROFILE_CANVAS_REF_WIDTH,
  sortBlocksByZIndex,
  type CanvasRect,
} from "@mutualzz/ui-core";
import { useTheme } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { View } from "react-native";

const MIN_CANVAS_HEIGHT_PERCENT = 100;

interface Props {
  profile: UserProfile;
  user: User | AccountStore;
}

export const ProfileBlockCanvas = observer(({ profile, user }: Props) => {
  const { theme } = useTheme();

  if (profile.blocks.length === 0) return null;

  const contentHeightPercent = Math.max(
    MIN_CANVAS_HEIGHT_PERCENT,
    ...profile.blocks.map((block) => block.y + block.height),
  );
  const contentHeightUnits =
    (contentHeightPercent / 100) * PROFILE_CANVAS_REF_WIDTH;
  const canvas: CanvasRect = {
    width: PROFILE_CANVAS_REF_WIDTH,
    height: contentHeightUnits,
  };

  return (
    <ProfileCanvasViewport contentHeightUnits={contentHeightUnits}>
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: PROFILE_CANVAS_REF_WIDTH,
          height: contentHeightUnits,
          backgroundColor: profile.backgroundColor ?? theme.colors.background,
        }}
      />
      {sortBlocksByZIndex(profile.blocks).map((block) => (
        <ProfileBlockRenderer
          key={block.id}
          block={block}
          canvas={canvas}
          profile={profile}
          user={user}
        />
      ))}
    </ProfileCanvasViewport>
  );
});
