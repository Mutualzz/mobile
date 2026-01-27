import { ChannelListItem } from "@components/Channel/ChannelListItem/ChannelListItem";
import { Paper } from "@components/Paper";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import { useAppStore } from "@hooks/useStores";
import { ChannelType } from "@mutualzz/types";
import { Box, ButtonGroup, IconButton, Typography } from "@mutualzz/ui-native";
import { Channel } from "@stores/objects/Channel";
import { observer } from "mobx-react-lite";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function flattenChannels(channels: Channel[]) {
    const result: Channel[] = [];
    for (const channel of channels) {
        result.push(channel);
        if (channel.type === ChannelType.Category) {
            const children = channels.filter(
                (c) => c.parent?.id === channel.id,
            );

            children.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
            result.push(...children);
        }
    }

    return Array.from(new Set(result));
}

export const ChannelList = observer(() => {
    const app = useAppStore();
    const insets = useSafeAreaInsets();

    const space = app.spaces.active;
    if (!space) return null;

    const visibleChannels = app.channels.getSpaceVisibleChannels(space.id);
    const activeChannel = app.channels.active;

    const flatChannels = flattenChannels(visibleChannels);

    const toggleCategory = (categoryId: string) => {
        app.channels.toggleCategoryCollapse(space.id, categoryId);
    };

    const getCategoryWithChildren = (categoryId: string) => {
        const category = flatChannels.find((c) => c.id === categoryId);
        if (!category) return [];
        const children = flatChannels.filter(
            (c) => c.parent?.id === categoryId,
        );
        return [category, ...children];
    };

    return (
        <Paper
            style={{
                flexDirection: "column",
                width: "100%",
                flex: 1,
            }}
            elevation={app.settings?.preferEmbossed ? 2 : 0}
        >
            <Paper
                style={{
                    paddingTop: insets.top,
                    paddingHorizontal: 16,
                    paddingBottom: 8,
                    boxShadow: "none",
                    flexDirection: "row",
                    justifyContent: "space-between",
                }}
                elevation={app.settings?.preferEmbossed ? 3 : 0}
            >
                <Typography level="body-lg">{space.name}</Typography>
                <Box
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "flex-end",
                    }}
                >
                    <ButtonGroup
                        size={12}
                        spacing={16}
                        color="neutral"
                        variant="plain"
                    >
                        <IconButton>
                            <AntDesign name="user-add" />
                        </IconButton>
                        <IconButton>
                            <FontAwesome name="chevron-down" />
                        </IconButton>
                    </ButtonGroup>
                </Box>
            </Paper>
            <Box
                style={{
                    flex: 1,
                    paddingTop: 48,
                    flexDirection: "column",
                    gap: 4,
                }}
            >
                {flatChannels.map((channel) => (
                    <ChannelListItem
                        key={channel.id}
                        channel={channel}
                        isCategory={channel.type === ChannelType.Category}
                        active={activeChannel?.id === channel.id}
                        space={space}
                        isCollapsed={app.channels.isCategoryCollapsed(
                            space.id,
                            channel.id,
                        )}
                        onToggleCollapse={
                            channel.type === ChannelType.Category
                                ? () => toggleCategory(channel.id)
                                : undefined
                        }
                    />
                ))}
            </Box>
        </Paper>
    );
});
