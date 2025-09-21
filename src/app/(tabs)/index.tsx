import { Stack, Typography } from "@mutualzz/ui/native";
import { StyleSheet } from "react-native";

export default function HomePage() {
    return (
        <Stack style={styles.container}>
            <Stack style={styles.main}>
                <Typography level="h6">
                    Website is currently under heavy development
                </Typography>
                <Typography level="body-lg">
                    The UI is being made from scratch
                </Typography>
                <Typography level="h5">It's open source too :3</Typography>
            </Stack>
        </Stack>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        padding: 24,
    },
    main: {
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: "auto",
        gap: 4,
        maxWidth: 900,
    },
});
