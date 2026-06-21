import { ChannelList } from "@components/Channel/ChannelList/ChannelList";
import { Box } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";

const SpaceIndex = () => {
    return (
        <Box style={{ flexDirection: "column", flex: 1 }}>
            <ChannelList />
        </Box>
    );
};

export default observer(SpaceIndex);
