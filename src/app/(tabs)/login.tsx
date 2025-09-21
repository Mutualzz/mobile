import { Stack, Typography } from "@mutualzz/ui/native";
import { StyleSheet } from "react-native";

export default function LoginPage() {
    return (
        <Stack style={styles.container}>
            <Stack style={styles.main}>
                <Typography level="h2">Login</Typography>
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
