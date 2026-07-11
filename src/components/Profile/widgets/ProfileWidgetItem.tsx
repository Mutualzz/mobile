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
import { ProfileStickerWidgetExpandedContent } from "@components/Profile/widgets/blocks/ProfileStickerWidgetView";
import { ProfileTextWidgetExpandedContent } from "@components/Profile/widgets/blocks/ProfileTextWidgetView";
import { ProfileWidgetMaximizeModal } from "@components/Profile/widgets/ProfileWidgetMaximizeModal";
import { ProfileWidgetRenderer } from "@components/Profile/widgets/ProfileWidgetRenderer";
import { ProfileWidgetTile } from "@components/Profile/widgets/ProfileWidgetTile";
import { useOpenBottomSheet } from "@hooks/useOpenBottomSheet";
import { useAppStore } from "@hooks/useStores";
import type { AccountStore } from "@stores/Account.store";
import type { User } from "@stores/objects/User";
import type { UserProfile } from "@stores/objects/UserProfile";
import type { APIMobileProfileBlock } from "@mutualzz/types";
import { resolveProfileBlockCornerRadius } from "@mutualzz/ui-core";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { clampWidgetSize } from "./profileWidget.constants";
import { shouldShowWidgetExpand } from "./profileWidgetExpand.utils";

const ROLES_VISIBLE = { s: 3, m: 6, l: 10 } as const;
const MUTUAL_VISIBLE = { s: 3, m: 6, l: 10 } as const;
const ACTIVITY_VISIBLE = { s: 1, m: 2, l: 2 } as const;

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
        app.presence
          .get(userId)
          ?.activities.filter((a) => a.type !== "custom") ?? [];
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
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const { openBottomSheet, closeBottomSheet } = useOpenBottomSheet();
  const size = clampWidgetSize(block.type, block.size);
  const overflowCount = getWidgetOverflowCount(block, size, app, user.id);
  const canExpand = shouldShowWidgetExpand(block, size, overflowCount);
  const modalId = `profile-widget-maximize-${block.id}`;

  const expandedContent = (() => {
    switch (block.type) {
      case "text":
        return <ProfileTextWidgetExpandedContent block={block} />;
      case "image":
        return (
          <ProfileImageWidgetExpandedContent block={block} profile={profile} />
        );
      case "sticker":
        return <ProfileStickerWidgetExpandedContent block={block} />;
      case "links":
        return <ProfileLinksWidgetExpandedContent block={block} />;
      case "activity":
        return (
          <ProfileActivityWidgetExpandedContent
            block={block}
            userId={user.id}
          />
        );
      case "roles":
        return (
          <ProfileRolesWidgetExpandedContent block={block} userId={user.id} />
        );
      case "mutual":
        return (
          <ProfileMutualWidgetExpandedContent block={block} userId={user.id} />
        );
      case "quote":
        return <ProfileQuoteWidgetExpandedContent block={block} />;
      case "draw":
        return <ProfileDrawWidgetExpandedContent block={block} />;
      default:
        return null;
    }
  })();

  const openMaximize = () => {
    openBottomSheet(
      modalId,
      <ProfileWidgetMaximizeModal
        embedded
        title={t(`profile.blocks.${block.type}`)}
        onClose={() => closeBottomSheet(modalId)}
      >
        {expandedContent}
      </ProfileWidgetMaximizeModal>,
    );
  };

  return (
    <ProfileWidgetTile
      type={block.type}
      size={size}
      cornerRadius={resolveProfileBlockCornerRadius(block, "mobile")}
      onMaximize={canExpand ? openMaximize : undefined}
    >
      <ProfileWidgetRenderer block={block} profile={profile} user={user} />
    </ProfileWidgetTile>
  );
});
