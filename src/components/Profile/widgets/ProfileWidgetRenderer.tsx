import { ProfileActivityWidgetView } from "@components/Profile/widgets/blocks/ProfileActivityWidgetView";
import { ProfileDividerWidgetView } from "@components/Profile/widgets/blocks/ProfileDividerWidgetView";
import { ProfileDrawWidgetView } from "@components/Profile/widgets/blocks/ProfileDrawWidgetView";
import { ProfileHeaderWidgetView } from "@components/Profile/widgets/blocks/ProfileHeaderWidgetView";
import { ProfileImageWidgetView } from "@components/Profile/widgets/blocks/ProfileImageWidgetView";
import { ProfileLinksWidgetView } from "@components/Profile/widgets/blocks/ProfileLinksWidgetView";
import { ProfileMusicWidgetView } from "@components/Profile/widgets/blocks/ProfileMusicWidgetView";
import { ProfileMutualWidgetView } from "@components/Profile/widgets/blocks/ProfileMutualWidgetView";
import { ProfileQuoteWidgetView } from "@components/Profile/widgets/blocks/ProfileQuoteWidgetView";
import { ProfileRolesWidgetView } from "@components/Profile/widgets/blocks/ProfileRolesWidgetView";
import { ProfileTextWidgetView } from "@components/Profile/widgets/blocks/ProfileTextWidgetView";
import type { AccountStore } from "@stores/Account.store";
import type { User } from "@stores/objects/User";
import type { UserProfile } from "@stores/objects/UserProfile";
import type { APIMobileProfileBlock } from "@mutualzz/types";
import { clampWidgetSize } from "./profileWidget.constants";

interface Props {
  block: APIMobileProfileBlock;
  profile: UserProfile;
  user: User | AccountStore;
}

export function ProfileWidgetRenderer({ block, profile, user }: Props) {
  const size = clampWidgetSize(block.type, block.size);

  switch (block.type) {
    case "header":
      return (
        <ProfileHeaderWidgetView block={block} size={size} profile={profile} user={user} />
      );
    case "text":
      return <ProfileTextWidgetView block={block} size={size} />;
    case "image":
      return <ProfileImageWidgetView block={block} profile={profile} />;
    case "music":
      return <ProfileMusicWidgetView block={block} size={size} profile={profile} />;
    case "links":
      return <ProfileLinksWidgetView block={block} size={size} />;
    case "activity":
      return <ProfileActivityWidgetView block={block} size={size} userId={user.id} />;
    case "roles":
      return <ProfileRolesWidgetView block={block} size={size} userId={user.id} />;
    case "mutual":
      return <ProfileMutualWidgetView block={block} size={size} userId={user.id} />;
    case "divider":
      return <ProfileDividerWidgetView block={block} size={size} />;
    case "quote":
      return <ProfileQuoteWidgetView block={block} size={size} />;
    case "draw":
      return <ProfileDrawWidgetView block={block} />;
    default:
      return null;
  }
}
