import { Stack } from "expo-router";
import { observer } from "mobx-react-lite";

const SpaceLayout = () => {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        />
    );
};

export default observer(SpaceLayout);
