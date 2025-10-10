import { Paper } from "@mutualzz/ui-native";
import { StyleSheet, View } from "react-native";

export default function LoginPage() {
    return (
        <View style={styles.container}>
            <Paper></Paper>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: "auto",
        gap: 4,
        maxWidth: 900,
    },
});
