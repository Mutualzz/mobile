import { IconButton } from "@components/IconButton";
import { ChannelIcon } from "@components/Channel/ChannelIcon";
import { Paper } from "@components/Paper";
import { CaretRightIcon, PlusIcon } from "phosphor-react-native";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { ChannelType } from "@mutualzz/types";
import { Box, type PaperProps, Typography, useTheme } from "@mutualzz/ui-native";
import { type Channel } from "@stores/objects/Channel";
import { type Space } from "@stores/objects/Space";
import { useScaledMentionBadgeStyle, useScaledSquareSize } from "@utils/accessibilityLayout";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { Keyboard, Pressable } from "react-native";

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
    const { t } = useTranslation("common");
    const { t: tChat } = useTranslation("chat");
    const { theme } = useTheme();
    const { navigate } = useAppNavigation();
    const app = useAppStore();
    const mentionBadgeStyle = useScaledMentionBadgeStyle();
    const unreadDotSize = useScaledSquareSize(8);

    const readState = app.readStates.get(channel.id);
    const isUnread = readState?.isUnread ?? false;
    const mentionCount = readState?.mentionCount ?? 0;

    const handlePress = () => {
      if (isCategory && onToggleCollapse) {
        onToggleCollapse(channel.id);
        return;
      }

      Keyboard.dismiss();
      app.setSpacesDrawerOpen(false);
      app.channels.setActive(channel.id);
      app.channels.setMostRecentChannelForSpace(space.id, channel.id);

      if (channel.isTextChannel) {
        navigate(`/spaces/channel/${channel.id}`);
        return;
      }

      if (channel.type === ChannelType.Voice) {
        navigate(`/spaces/channel/${channel.id}`);
      }
    };

    const accessibilityLabel = isCategory
      ? (channel.name ?? undefined)
      : `${channel.name}${
          mentionCount > 0
            ? `, ${tChat("a11y.mentionsCount", { value: mentionCount })}`
            : isUnread
              ? `, ${tChat("a11y.unread")}`
              : ""
        }`;

    return (
      <Pressable
        onPress={handlePress}
        onLongPress={onLongPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected: active, expanded: isCategory ? !isCollapsed : undefined }}
      >
        <Paper
          style={{
            marginLeft: isCategory ? 2 : channel.parent ? 14 : 8,
            marginTop: isCategory ? 6 : 1,
            marginBottom: 1,
            paddingHorizontal: 8,
            paddingVertical: 6,
            marginRight: isCategory ? 12 : 16,
            borderRadius: 6,
            alignItems: "center",
            justifyContent: "space-between",
            flexDirection: "row",
            minHeight: isCategory ? 32 : 34,
          }}
          key={channel.id}
          color={props.color}
          variant={active ? "soft" : "plain"}
          surfaceRole={
            active && theme.backgroundImageUrl ? "card" : undefined
          }
          {...props}
          elevation={0}
          transparency={0}
        >
          <Box
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              flexShrink: 1,
              minWidth: 0,
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
              truncate="single"
              style={{
                fontSize: isCategory ? 12 : 14,
                fontWeight: isCategory
                  ? "600"
                  : isUnread || active
                    ? "700"
                    : "500",
                letterSpacing: isCategory ? 0.4 : 0,
                flexShrink: 1,
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
                    ...mentionBadgeStyle,
                    borderRadius: 9999,
                    backgroundColor: theme.colors.danger,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    level="body-xs"
                    style={{
                      color: "#fff",
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
                    width: unreadDotSize,
                    height: unreadDotSize,
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
              accessibilityLabel={t("a11y.createChannelInCategory")}
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
