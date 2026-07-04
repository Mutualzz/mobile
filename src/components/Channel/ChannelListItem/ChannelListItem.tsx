import { IconButton } from "@components/IconButton";
import { ChannelIcon } from "@components/Channel/ChannelIcon";
import { Paper } from "@components/Paper";
import { CaretRightIcon, PlusIcon } from "phosphor-react-native";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { ChannelType } from "@mutualzz/types";
import {
  Box,
  type PaperProps,
  Typography,
  useTheme,
} from "@mutualzz/ui-native";
import { type Channel } from "@stores/objects/Channel";
import { type Space } from "@stores/objects/Space";
import { observer } from "mobx-react-lite";
import { Pressable } from "react-native";

interface Props extends PaperProps {
  space: Space;
  channel: Channel;
  isCategory: boolean;
  active: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: (channelId: string) => void;
  onCreateInCategory?: () => void;
  onLongPress?: () => void;
  canManageChannels?: boolean;
}

export const ChannelListItem = observer(
  ({
    channel,
    isCategory,
    active,
    isCollapsed,
    space,
    onToggleCollapse,
    onCreateInCategory,
    onLongPress,
    canManageChannels = false,
    ...props
  }: Props) => {
    const { theme } = useTheme();
    const { navigate } = useAppNavigation();
    const app = useAppStore();

    const readState = app.readStates.get(channel.id);
    const isUnread = readState?.isUnread ?? false;
    const mentionCount = readState?.mentionCount ?? 0;

    const handlePress = () => {
      if (isCategory && onToggleCollapse) {
        onToggleCollapse(channel.id);
        return;
      }

      app.channels.setActive(channel.id);
      app.channels.setMostRecentChannelForSpace(space.id, channel.id);
      app.setSpacesDrawerOpen(false);

      if (channel.isTextChannel) {
        navigate(`/spaces/channel/${channel.id}`);
        return;
      }

      if (channel.type === ChannelType.Voice) {
        navigate(`/spaces/channel/${channel.id}`);
      }
    };

    return (
      <Pressable onPress={handlePress} onLongPress={onLongPress}>
        <Paper
          style={{
            marginLeft: isCategory ? 0 : channel.parent ? 12 : 8,
            paddingHorizontal: 8,
            marginRight: isCategory ? 12 : 20,
            borderRadius: 6,
            alignItems: "center",
            justifyContent: "space-between",
            flexDirection: "row",
            height: isCategory ? 32 : 28,
          }}
          key={channel.id}
          color={props.color}
          variant={active ? "soft" : "plain"}
          {...props}
        >
          <Box
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            {!isCategory && <ChannelIcon type={channel.type} />}
            {isCategory && (
              <CaretRightIcon
                size={12}
                color={theme.typography.colors.secondary}
                weight="bold"
                style={{
                  transform: [
                    {
                      rotate: isCollapsed ? "90deg" : "0deg",
                    },
                  ],
                }}
              />
            )}
            <Typography
              textColor={isCategory ? "primary" : "secondary"}
              style={{
                fontSize: isCategory ? 12 : 14,
                fontWeight: isCategory
                  ? "400"
                  : isUnread || active
                    ? "700"
                    : "600",
                letterSpacing: isCategory ? 0.5 : 0,
              }}
            >
              {channel.name}
            </Typography>
          </Box>
          {!isCategory && (
            <Box
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                minWidth: 20,
                justifyContent: "flex-end",
              }}
            >
              {mentionCount > 0 && (
                <Box
                  style={{
                    minWidth: 16,
                    height: 16,
                    borderRadius: 9999,
                    backgroundColor: theme.colors.danger,
                    paddingHorizontal: 4,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    style={{
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: "600",
                    }}
                  >
                    {mentionCount > 99 ? "99+" : mentionCount}
                  </Typography>
                </Box>
              )}
              {isUnread && mentionCount === 0 && !active && (
                <Box
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 9999,
                    backgroundColor: theme.typography.colors.primary,
                  }}
                />
              )}
            </Box>
          )}
          {isCategory && canManageChannels && (
            <IconButton
              size={14}
              variant="plain"
              color="neutral"
              style={{
                borderRadius: 9999,
              }}
              onPress={() => onCreateInCategory?.()}
            >
              <PlusIcon size={12} weight="bold" />
            </IconButton>
          )}
        </Paper>
      </Pressable>
    );
  },
);
