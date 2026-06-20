import { IconButton } from "@components/IconButton";
import { ChannelListItem } from "@components/Channel/ChannelListItem/ChannelListItem";
import { Screen, ScreenHeader } from "@components/Screen/Screen";
import { canOpenSpaceSettings } from "@components/SpaceSettings/spaceSettingsPages";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { CaretDownIcon, GearIcon, UserPlusIcon } from "phosphor-react-native";
import { useAppStore } from "@hooks/useStores";
import { ChannelType } from "@mutualzz/types";
import { Box, ButtonGroup, Typography } from "@mutualzz/ui-native";
import { type Channel } from "@stores/objects/Channel";
import { observer } from "mobx-react-lite";

function flattenChannels(channels: Channel[]) {
  const result: Channel[] = [];
  for (const channel of channels) {
    result.push(channel);
    if (channel.type === ChannelType.Category) {
      const children = channels.filter((c) => c.parent?.id === channel.id);

      children.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      result.push(...children);
    }
  }

  return Array.from(new Set(result));
}

export const ChannelList = observer(() => {
  const app = useAppStore();
  const { navigate } = useAppNavigation();

  const space = app.spaces.active;
  if (!space) return null;

  const spaceMe = space.members.me;
  const showSpaceSettings = !!spaceMe && canOpenSpaceSettings(spaceMe);

  const visibleChannels = space.visibleChannels;
  const activeChannel = app.channels.active;

  const flatChannels = flattenChannels(visibleChannels).filter(
    (channel) => channel.type !== ChannelType.Voice,
  );

  const toggleCategory = (categoryId: string) => {
    app.channels.toggleCategoryCollapse(space.id, categoryId);
  };

  const getCategoryWithChildren = (categoryId: string) => {
    const category = flatChannels.find((c) => c.id === categoryId);
    if (!category) return [];
    const children = flatChannels.filter((c) => c.parent?.id === categoryId);
    return [category, ...children];
  };

  return (
    <Screen
      style={{
        flexDirection: "column",
        width: "100%",
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
        borderRightWidth: 0,
      }}
    >
      <ScreenHeader
        style={{
          justifyContent: "space-between",
          borderLeftWidth: 0,
          borderRightWidth: 0,
          borderTopWidth: 0,
        }}
      >
        <Typography level="body-lg">{space.name}</Typography>
        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <ButtonGroup size={12} spacing={16} variant="plain">
            {showSpaceSettings ? (
              <IconButton
                accessibilityLabel="Space settings"
                onPress={() =>
                  navigate(`/(tabs)/spaces/${space.id}/settings`)
                }
              >
                <GearIcon weight="fill" />
              </IconButton>
            ) : null}
            <IconButton>
              <UserPlusIcon weight="fill" />
            </IconButton>
            <IconButton>
              <CaretDownIcon weight="bold" />
            </IconButton>
          </ButtonGroup>
        </Box>
      </ScreenHeader>
      <Box
        style={{
          flex: 1,
          flexDirection: "column",
          gap: 4,
          paddingTop: 4,
        }}
      >
        {flatChannels.map((channel) => (
          <ChannelListItem
            key={channel.id}
            channel={channel}
            isCategory={channel.type === ChannelType.Category}
            active={activeChannel?.id === channel.id}
            space={space}
            isCollapsed={app.channels.isCategoryCollapsed(space.id, channel.id)}
            onToggleCollapse={
              channel.type === ChannelType.Category
                ? () => toggleCategory(channel.id)
                : undefined
            }
          />
        ))}
      </Box>
    </Screen>
  );
});
