import { Typography, useTheme } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { View } from "react-native";

interface Props {
    mentionId: string;
}

export const DefaultMention = observer(({ mentionId }: Props) => {
    const { theme } = useTheme();

    return (
        <View
            style={{
                backgroundColor: `${theme.colors.info}22`,
                borderRadius: 4,
                paddingHorizontal: 6,
                paddingVertical: 1,
            }}
        >
            <Typography
                level="body-sm"
                style={{ color: theme.colors.info }}
            >
                @{mentionId}
            </Typography>
        </View>
    );
});
