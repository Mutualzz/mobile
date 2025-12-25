import { Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";

const MeIndex = () => {
    return (
        <Typography
            style={{
                textAlign: "center",
            }}
        >
            Here will be your friends and messages, currently working on spaces
        </Typography>
    );
};

export default observer(MeIndex);
