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
      <Typography level="body-lg">Every night, I can feel my leg...</Typography>
      <Typography level="body-md">
        And my arm... even my fingers... The body I&apos;ve lost...
      </Typography>
      <Typography level="body-xs">
        the comrades I&apos;ve lost... won&apos;t stop hurting... It&apos;s like
        they&apos;re all still there.
      </Typography>
    </Box>
  );
};

export default observer(SpacesIndex);
