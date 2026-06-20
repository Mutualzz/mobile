import { ChannelType } from "@mutualzz/types";
import { useTheme } from "@mutualzz/ui-native";
import {
    HashIcon,
    SpeakerSimpleHighIcon,
    type IconProps,
} from "phosphor-react-native";

interface Props extends Omit<IconProps, "type"> {
    type: ChannelType;
}

export const ChannelIcon = ({ type, ...props }: Props) => {
    const { theme } = useTheme();

    switch (type) {
        case ChannelType.Text:
            return (
                <HashIcon
                    color={theme.typography.colors.secondary}
                    size={14}
                    {...props}
                />
            );
        case ChannelType.Voice:
            return (
                <SpeakerSimpleHighIcon
                    color={theme.typography.colors.secondary}
                    size={14}
                    weight="fill"
                    {...props}
                />
            );
        default:
            return null;
    }
};
