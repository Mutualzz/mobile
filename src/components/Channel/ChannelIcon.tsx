import { FontAwesome } from "@expo/vector-icons";
import { ChannelType } from "@mutualzz/types";
import { useTheme } from "@mutualzz/ui-native";

interface Props extends Omit<any, "type"> {
    type: ChannelType;
}

export const ChannelIcon = ({ type, ...props }: Props) => {
    const { theme } = useTheme();

    switch (type) {
        case ChannelType.Text:
            return (
                <FontAwesome
                    color={theme.colors.neutral}
                    name="hashtag"
                    size={14}
                    {...props}
                />
            );
        case ChannelType.Voice:
            return (
                <FontAwesome
                    color={theme.colors.neutral}
                    name="volume-up"
                    size={14}
                    {...props}
                />
            );
        default:
            return null;
    }
};
