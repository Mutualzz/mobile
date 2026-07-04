import { ProfileActivityBlockView } from "@components/Profile/canvas/blocks/ProfileActivityBlockView";
import { ProfileDividerBlockView } from "@components/Profile/canvas/blocks/ProfileDividerBlockView";
import { ProfileDrawBlockView } from "@components/Profile/canvas/blocks/ProfileDrawBlockView";
import { ProfileHeaderBlockView } from "@components/Profile/canvas/blocks/ProfileHeaderBlockView";
import { ProfileImageBlockView } from "@components/Profile/canvas/blocks/ProfileImageBlockView";
import { ProfileLinksBlockView } from "@components/Profile/canvas/blocks/ProfileLinksBlockView";
import { ProfileMusicBlockView } from "@components/Profile/canvas/blocks/ProfileMusicBlockView";
import { ProfileMutualBlockView } from "@components/Profile/canvas/blocks/ProfileMutualBlockView";
import { ProfileQuoteBlockView } from "@components/Profile/canvas/blocks/ProfileQuoteBlockView";
import { ProfileRolesBlockView } from "@components/Profile/canvas/blocks/ProfileRolesBlockView";
import { ProfileTextBlockView } from "@components/Profile/canvas/blocks/ProfileTextBlockView";
import type { AccountStore } from "@stores/Account.store";
import type { User } from "@stores/objects/User";
import type { UserProfile } from "@stores/objects/UserProfile";
import type { APIProfileBlock } from "@mutualzz/types";
import { percentToPixels, type CanvasRect } from "@mutualzz/ui-core";
import { View } from "react-native";

interface Props {
  block: APIProfileBlock;
  canvas: CanvasRect;
  profile: UserProfile;
  user: User | AccountStore;
}

export function ProfileBlockRenderer({ block, canvas, profile, user }: Props) {
  const rect = percentToPixels(block, canvas);

  const content = (() => {
    switch (block.type) {
      case "header":
        return (
          <ProfileHeaderBlockView block={block} profile={profile} user={user} />
        );
      case "text":
        return <ProfileTextBlockView block={block} />;
      case "image":
        return <ProfileImageBlockView block={block} profile={profile} />;
      case "music":
        return <ProfileMusicBlockView block={block} />;
      case "links":
        return <ProfileLinksBlockView block={block} />;
      case "activity":
        return <ProfileActivityBlockView block={block} userId={user.id} />;
      case "roles":
        return <ProfileRolesBlockView block={block} userId={user.id} />;
      case "mutual":
        return <ProfileMutualBlockView block={block} userId={user.id} />;
      case "divider":
        return <ProfileDividerBlockView block={block} />;
      case "quote":
        return <ProfileQuoteBlockView block={block} />;
      case "draw":
        return <ProfileDrawBlockView block={block} />;
      default:
        return null;
    }
  })();

  if (!content) return null;

  return (
    <View
      style={{
        position: "absolute",
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        zIndex: block.zIndex,
      }}
    >
      {content}
    </View>
  );
}
