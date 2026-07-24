import { IconButton } from "@components/IconButton";
import { AppLogo } from "@components/Logo/AppLogo";
import { ReorderableVerticalList } from "@components/Reorder/ReorderableVerticalList";
import { Screen } from "@components/Screen/Screen";
import {
  type PillType,
  SidebarRailSlot,
  SIDEBAR_RAIL_ITEM_SIZE,
} from "@components/SidebarPill";
import { SidebarSpace } from "@components/Space/SidebarSpace";
import { SpaceInviteSheet } from "@components/Space/SpaceInviteSheet";
import {
  CheckIcon,
  DotsSixVerticalIcon,
  PlusIcon,
} from "phosphor-react-native";
import { useKeyboardChromeInset } from "@hooks/useKeyboardChromeInset";
import { useBridgeListSync } from "@hooks/useBridgeListSync";
import { useNavigateToModeHub } from "@hooks/useNavigateToModeHub";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import { usePathname } from "expo-router";
import { observer } from "mobx-react-lite";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

export const SpacesSidebar = observer(() => {
  const app = useAppStore();
  const { t } = useTranslation("space");
  useBridgeListSync();
  const { navigateToModeHub, navigateToSpaceHub } = useNavigateToModeHub();
  const { openSheet } = useSheet();
  const pathname = usePathname();
  const tabBarInset = useKeyboardChromeInset();
  const [isReordering, setIsReordering] = useState(false);

  const onDms = pathname.startsWith("/@me") || app.mode === "@me";

  const dmPillType: PillType = (() => {
    if (onDms) return "active";
    if (app.channels.dms.some((ch) => app.readStates.get(ch.id)?.isUnread))
      return "unread";
    return "none";
  })();

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
        paddingHorizontal: 8,
        paddingBottom: tabBarInset,
        gap: 12,
        alignItems: "center",
        borderTopWidth: 0,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        width: 76,
        flexShrink: 0,
        flex: 1,
        overflow: "visible",
      }}
      elevation={app.settings?.preferEmbossed ? 2 : 0}
    >
      <SidebarRailSlot type={dmPillType} style={{ marginBottom: 4 }}>
        <AppLogo
          size={SIDEBAR_RAIL_ITEM_SIZE}
          selected={onDms}
          onPress={() => {
            if (onDms || isReordering) return;
            navigateToModeHub("@me");
          }}
        />
      </SidebarRailSlot>

      <ReorderableVerticalList
        items={spaces}
        onReorder={handleReorderSpaces}
        enabled={isReordering && canReorderSpaces}
        dragTarget="handle"
        centerRows
        compactHandle
        childHandlesLongPress
        rowGap={12}
        estimatedRowHeight={SIDEBAR_RAIL_ITEM_SIZE + 12}
        style={{ width: "100%" }}
        renderItem={(space) => (
          <SidebarSpace
            active={
              !onDms &&
              app.mode === "spaces" &&
              space.id === app.spaces.activeId
            }
            reordering={isReordering}
            space={space}
            onSelect={navigateToSpaceHub}
          />
        )}
      />

      <IconButton
        shape="circle"
        color="success"
        variant="outlined"
        padding={10}
        style={{
          alignSelf: "center",
          opacity: isReordering ? 0.35 : 1,
        }}
        size="md"
        disabled={isReordering}
        onPress={() => openSheet("space-invite", <SpaceInviteSheet />)}
      >
        <PlusIcon weight="bold" />
      </IconButton>

      {canReorderSpaces ? (
        <IconButton
          shape="circle"
          color={isReordering ? "success" : "neutral"}
          variant={isReordering ? "solid" : "outlined"}
          padding={10}
          style={{ alignSelf: "center" }}
          size="md"
          accessibilityLabel={
            isReordering
              ? t("sidebar.doneReorderingA11y")
              : t("sidebar.reorderA11y")
          }
          onPress={() => setIsReordering((value) => !value)}
        >
          {isReordering ? (
            <CheckIcon weight="bold" />
          ) : (
            <DotsSixVerticalIcon weight="bold" />
          )}
        </IconButton>
      ) : null}
    </Screen>
  );
});
