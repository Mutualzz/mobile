import { ProfileWidgetItem } from "@components/Profile/widgets/ProfileWidgetItem";
import type { AccountStore } from "@stores/Account.store";
import type { User } from "@stores/objects/User";
import type { UserProfile } from "@stores/objects/UserProfile";
import { clampWidgetSize } from "@components/Profile/widgets/profileWidget.constants";
import { View } from "react-native";

const GRID_GAP = 10;

interface Props {
  profile: UserProfile;
  user: User | AccountStore;
}

export function ProfileWidgetGrid({ profile, user }: Props) {
  const blocks = [...profile.mobileBlocks].sort((a, b) => a.order - b.order);

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        padding: GRID_GAP / 2,
      }}
    >
      {blocks.map((block) => {
        const size = clampWidgetSize(block.type, block.size);
        return (
          <View
            key={block.id}
            style={{
              width: size === "s" ? "50%" : "100%",
              padding: GRID_GAP / 2,
            }}
          >
            <ProfileWidgetItem block={block} profile={profile} user={user} />
          </View>
        );
      })}
    </View>
  );
}
