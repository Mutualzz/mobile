import {
  findMemberForUser,
  getMemberRoles,
  getMutualSpaces,
} from "@components/Profile/canvas/profileBlockData.utils";
import { ProfileActivityWidgetExpandedContent } from "@components/Profile/widgets/blocks/ProfileActivityWidgetView";
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
import { useAppStore } from "@hooks/useStores";
import type { AccountStore } from "@stores/Account.store";
import type { User } from "@stores/objects/User";
import type { UserProfile } from "@stores/objects/UserProfile";
import type { APIMobileProfileBlock, ProfileBlockType } from "@mutualzz/types";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { clampWidgetSize } from "./profileWidget.constants";
import { shouldShowWidgetExpand } from "./profileWidgetExpand.utils";

const ROLES_VISIBLE = { s: 3, m: 6, l: 10 } as const;
const MUTUAL_VISIBLE = { s: 3, m: 6, l: 10 } as const;
const ACTIVITY_VISIBLE = { s: 0, m: 2, l: 2 } as const;

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

function getWidgetOverflowCount(
  block: APIMobileProfileBlock,
  size: ReturnType<typeof clampWidgetSize>,
  app: ReturnType<typeof useAppStore>,
  userId: string,
) {
  switch (block.type) {
    case "roles": {
      const member = findMemberForUser(app, userId);
      const roles = getMemberRoles(member, block.maxRoles ?? 6);
      return Math.max(0, roles.length - ROLES_VISIBLE[size]);
    }
    case "mutual": {
      if (block.mode !== "spaces") return 0;
      const spaces = getMutualSpaces(app, userId, block.maxItems ?? 6);
      return Math.max(0, spaces.length - MUTUAL_VISIBLE[size]);
    }
    case "activity": {
      const activities =
        app.presence.get(userId)?.activities.filter((a) => a.type !== "custom") ??
        [];
      return Math.max(0, activities.length - ACTIVITY_VISIBLE[size]);
    }
    default:
      return 0;
  }
}

export const ProfileWidgetItem = observer(function ProfileWidgetItem({
  block,
  profile,
  user,
}: Props) {
  const app = useAppStore();
  const [maximized, setMaximized] = useState(false);
  const size = clampWidgetSize(block.type, block.size);
  const overflowCount = getWidgetOverflowCount(block, size, app, user.id);
  const canExpand = shouldShowWidgetExpand(block, size, overflowCount);

  const expandedContent = (() => {
    switch (block.type) {
      case "text":
        return <ProfileTextWidgetExpandedContent block={block} />;
      case "image":
        return <ProfileImageWidgetExpandedContent block={block} profile={profile} />;
      case "links":
        return <ProfileLinksWidgetExpandedContent block={block} />;
      case "activity":
        return (
          <ProfileActivityWidgetExpandedContent block={block} userId={user.id} />
        );
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
        onMaximize={canExpand ? () => setMaximized(true) : undefined}
      >
        <ProfileWidgetRenderer block={block} profile={profile} user={user} />
      </ProfileWidgetTile>

      {canExpand ? (
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
});
