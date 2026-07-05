import { ProfileDrawWidgetExpandedContent } from "@components/Profile/widgets/blocks/ProfileDrawWidgetView";
import { ProfileImageWidgetExpandedContent } from "@components/Profile/widgets/blocks/ProfileImageWidgetView";
import { ProfileLinksWidgetExpandedContent } from "@components/Profile/widgets/blocks/ProfileLinksWidgetView";
import { ProfileMutualWidgetExpandedContent } from "@components/Profile/widgets/blocks/ProfileMutualWidgetView";
import { ProfileQuoteWidgetExpandedContent } from "@components/Profile/widgets/blocks/ProfileQuoteWidgetView";
import { ProfileRolesWidgetExpandedContent } from "@components/Profile/widgets/blocks/ProfileRolesWidgetView";
import { ProfileTextWidgetExpandedContent } from "@components/Profile/widgets/blocks/ProfileTextWidgetView";
import { ProfileWidgetMaximizeModal } from "@components/Profile/widgets/ProfileWidgetMaximizeModal";
import { ProfileWidgetRenderer } from "@components/Profile/widgets/ProfileWidgetRenderer";
import { ProfileWidgetTile } from "@components/Profile/widgets/ProfileWidgetTile";
import type { AccountStore } from "@stores/Account.store";
import type { User } from "@stores/objects/User";
import type { UserProfile } from "@stores/objects/UserProfile";
import type { APIMobileProfileBlock, ProfileBlockType } from "@mutualzz/types";
import { useState } from "react";
import { clampWidgetSize, isWidgetMaximizable } from "./profileWidget.constants";

const BLOCK_TITLES: Record<ProfileBlockType, string> = {
  header: "Header",
  text: "Text",
  image: "Image",
  music: "Music",
  links: "Links",
  activity: "Activity",
  roles: "Roles",
  mutual: "Mutual",
  divider: "Divider",
  quote: "Quote",
  draw: "Drawing",
};

interface Props {
  block: APIMobileProfileBlock;
  profile: UserProfile;
  user: User | AccountStore;
}

export function ProfileWidgetItem({ block, profile, user }: Props) {
  const [maximized, setMaximized] = useState(false);
  const size = clampWidgetSize(block.type, block.size);
  const maximizable = isWidgetMaximizable(block.type);

  const expandedContent = (() => {
    switch (block.type) {
      case "text":
        return <ProfileTextWidgetExpandedContent block={block} />;
      case "image":
        return <ProfileImageWidgetExpandedContent block={block} profile={profile} />;
      case "links":
        return <ProfileLinksWidgetExpandedContent block={block} />;
      case "roles":
        return <ProfileRolesWidgetExpandedContent block={block} userId={user.id} />;
      case "mutual":
        return <ProfileMutualWidgetExpandedContent block={block} userId={user.id} />;
      case "quote":
        return <ProfileQuoteWidgetExpandedContent block={block} />;
      case "draw":
        return <ProfileDrawWidgetExpandedContent block={block} />;
      default:
        return null;
    }
  })();

  return (
    <>
      <ProfileWidgetTile
        type={block.type}
        size={size}
        onMaximize={maximizable ? () => setMaximized(true) : undefined}
      >
        <ProfileWidgetRenderer block={block} profile={profile} user={user} />
      </ProfileWidgetTile>

      {maximizable ? (
        <ProfileWidgetMaximizeModal
          visible={maximized}
          title={BLOCK_TITLES[block.type]}
          onClose={() => setMaximized(false)}
        >
          {expandedContent}
        </ProfileWidgetMaximizeModal>
      ) : null}
    </>
  );
}
