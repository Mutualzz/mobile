import { ChannelIcon } from "@components/Channel/ChannelIcon";
import { Paper } from "@components/Paper";
import { FontAwesome } from "@expo/vector-icons";
import { useAppStore } from "@hooks/useStores";
import {
    Box,
    IconButton,
    PaperProps,
    Typography,
    useTheme,
} from "@mutualzz/ui-native";
import { Channel } from "@stores/objects/Channel";
import { Space } from "@stores/objects/Space";
import { useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { Pressable } from "react-native";

interface Props extends PaperProps {
    space: Space;
    channel: Channel;
    isCategory: boolean;
    active: boolean;
    isCollapsed?: boolean;
    onToggleCollapse?: (channelId: string) => void;
}

export const ChannelListItem = observer(
    ({
        channel,
        isCategory,
        active,
        isCollapsed,
        space,
        onToggleCollapse,
        ...props
    }: Props) => {
        const { theme } = useTheme();
        const router = useRouter();
        const app = useAppStore();

        const canModifyChannel =
            app.account && space.owner && space.owner.id === app.account.id;

        const handlePress = () => {
            if (isCategory && onToggleCollapse) {
                onToggleCollapse(channel.id);
                return;
            }

            if (!channel.isTextChannel) return;

            router.push(`/spaces/${space.id}/${channel.id}`);
        };

        return (
            <Pressable onPress={handlePress}>
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
                            <FontAwesome
                                name={
                                    isCollapsed ? "chevron-up" : "chevron-down"
                                }
                                size={8}
                                color={theme.typography.colors.secondary}
                            />
                        )}
                        <Typography
                            textColor={isCategory ? "primary" : "secondary"}
                            style={{
                                fontSize: isCategory ? 12 : 14,
                                fontWeight: isCategory ? "400" : "600",
                                letterSpacing: isCategory ? 0.5 : 0,
                            }}
                        >
                            {channel.name}
                        </Typography>
                    </Box>
                    {isCategory && canModifyChannel && (
                        <IconButton
                            size={14}
                            variant="plain"
                            color="neutral"
                            style={{
                                borderRadius: 9999,
                            }}
                        >
                            <FontAwesome name="plus" size={8} />
                        </IconButton>
                    )}
                </Paper>
            </Pressable>
        );
    },
);
