import { Stack } from "expo-router";
import { observer } from "mobx-react-lite";

const SpacesLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(drawer)" options={{ animation: "none" }} />
      <Stack.Screen
        name="[spaceId]/settings"
        options={{ animation: "slide_from_bottom", presentation: "modal" }}
      />
    </Stack>
  );
};

export default observer(SpacesLayout);
