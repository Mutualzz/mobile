import { Stack } from "expo-router";
import { observer } from "mobx-react-lite";

const SpacesLayout = () => {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="(browse)" options={{ animation: "none" }} />
            <Stack.Screen
                name="channel/[channelId]"
                options={{ animation: "slide_from_right" }}
            />
            <Stack.Screen
                name="[spaceId]/settings"
                options={{ animation: "slide_from_right", presentation: "card" }}
            />
        </Stack>
    );
};

export default observer(SpacesLayout);
