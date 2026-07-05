import { IconButton } from "@components/IconButton";
import { AppLogo } from "@components/Logo/AppLogo";
import { Screen } from "@components/Screen/Screen";
import { type PillType, SidebarPill } from "@components/SidebarPill";
import { SpaceIcon } from "@components/Space/SpaceIcon";
import { SpaceInviteModal } from "@components/Space/SpaceInviteModal";
import { PlusIcon } from "phosphor-react-native";
import { useModal } from "@hooks/useModal";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { Box } from "@mutualzz/ui-native";
import type { Space } from "@stores/objects/Space";
import { useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { Pressable } from "react-native";

const SidebarSpace = observer(
  ({ space, active }: { space: Space; active: boolean }) => {
    const app = useAppStore();
    const router = useRouter();

    const pillType: PillType = (() => {
      if (active) return "active";
      if (space.channels.some((ch) => app.readStates.get(ch.id)?.isUnread))
        return "unread";
      return "none";
    })();

    return (
      <Box
        style={{
          position: "relative",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <SidebarPill type={pillType} />
        <Pressable
          onPress={() => {
            if (active) return;

            app.spaces.setActive(space.id);
            app.spaces.setMostRecentSpace(space.id);
            router.replace(`/spaces/${space.id}`);
          }}
        >
          <SpaceIcon selected={active} space={space} />
        </Pressable>
      </Box>
    );
  },
);

export const SpacesSidebar = observer(() => {
  const app = useAppStore();
  const { navigate } = useAppNavigation();
  const { openModal } = useModal();

  const dmPillType: PillType = app.channels.dms.some(
    (ch) => app.readStates.get(ch.id)?.isUnread,
  )
    ? "unread"
    : "none";

  return (
    <Screen
      fill={false}
      style={{
        flexDirection: "column",
        paddingHorizontal: 6,
        gap: 12,
        alignItems: "center",
        borderTopWidth: 0,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        width: 64,
        flexShrink: 0,
      }}
      elevation={app.settings?.preferEmbossed ? 2 : 0}
    >
      <Box
        style={{
          position: "relative",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 4,
        }}
      >
        <SidebarPill type={dmPillType} />
        <AppLogo
          size={48}
          onPress={() => {
            app.setMode("@me");
            navigate("/@me");
          }}
        />
      </Box>

      {app.spaces.positioned.map((space) => (
        <SidebarSpace
          active={space.id === app.spaces.activeId}
          key={space.id}
          space={space}
        />
      ))}
      <IconButton
        shape="circle"
        color="success"
        variant="outlined"
        padding={8}
        style={{
          alignSelf: "center",
        }}
        size="sm"
        onPress={() =>
          openModal("space-invite", <SpaceInviteModal />, {
            style: {
              padding: 26,
            },
          })
        }
      >
        <PlusIcon weight="bold" />
      </IconButton>
    </Screen>
  );
});
