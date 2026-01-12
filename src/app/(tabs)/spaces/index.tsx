import { Box, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";

const SpacesIndex = () => {
    return (
        <Box
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Typography level="h5">Why are we still here?</Typography>
            <Typography level="h6" weight="bold">
                Just to suffer?
            </Typography>
            <Typography level="body-lg">
                Every night, I can feel my leg...
            </Typography>
            <Typography level="body-md">
                And my arm... even my fingers... The body I've lost...
            </Typography>
            <Typography level="body-xs">
                the comrades I've lost... won't stop hurting... It's like
                they're all still there.
            </Typography>
        </Box>
    );
};

export default observer(SpacesIndex);
