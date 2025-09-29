import { Typography } from "@mutualzz/ui-native";
import { StyleSheet, View } from "react-native";

export default function LoginPage() {
    return (
        <View style={styles.container}>
            <View style={styles.main}>
                <Typography level="h2">Login</Typography>
            </View>
        </View>
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
