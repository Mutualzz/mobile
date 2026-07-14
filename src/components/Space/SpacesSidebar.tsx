import { IconButton } from "@components/IconButton";
import { AppLogo } from "@components/Logo/AppLogo";
import { ReorderableVerticalList } from "@components/Reorder/ReorderableVerticalList";
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
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";

const SidebarSpace = observer(
  ({ space, active }: { space: Space; active: boolean }) => {
    const { t } = useTranslation("chat");
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
            app.channels.setActive();
            app.setSpacesDrawerOpen(true);
            router.replace(`/spaces/${space.id}`);
          }}
          accessibilityRole="button"
          accessibilityLabel={`${space.name}${
            pillType === "unread" ? `, ${t("a11y.unread")}` : ""
          }`}
          accessibilityState={{ selected: active }}
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

  const spaces = app.spaces.positioned;
  const canReorderSpaces = spaces.length > 1;

  const handleReorderSpaces = useCallback(
    (fromIndex: number, toIndex: number) => {
      app.settings?.moveSpace(fromIndex, toIndex);
    },
    [app.settings],
  );

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
        overflow: "visible",
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

      <ReorderableVerticalList
        items={spaces}
        onReorder={handleReorderSpaces}
        enabled={canReorderSpaces}
        dragTarget="row"
        rowGap={12}
        estimatedRowHeight={48}
        style={{ width: "100%" }}
        renderItem={(space) => (
          <SidebarSpace
            active={space.id === app.spaces.activeId}
            space={space}
          />
        )}
      />
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
