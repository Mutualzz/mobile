import { Box, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";

const FeedIndex = () => {
    return (
        <Box
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 20,
                flexDirection: "column",
            }}
        >
            <Typography
                style={{
                    textAlign: "center",
                }}
            >
                Here will be your feed, currently working on spaces
            </Typography>
        </Box>
    );
};

export default observer(FeedIndex);
