import { ThemeSelector } from "@components/ThemeSelector";
import { Typography } from "@mutualzz/ui-native";
import { StyleSheet, View } from "react-native";

export default function HomePage() {
    return (
        <View style={styles.container}>
            <Typography level="h6">
                Website is currently under heavy development
            </Typography>
            <Typography level="body-lg">
                The UI is being made from scratch
            </Typography>
            <Typography level="h5">It's open source too :3</Typography>
            <ThemeSelector />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: "auto",
        flex: 1,
        gap: 4,
        maxWidth: 900,
    },
});
