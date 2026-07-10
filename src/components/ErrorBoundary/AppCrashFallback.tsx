import { baseDarkTheme } from "@mutualzz/ui-core";
import { WarningCircleIcon } from "phosphor-react-native";
import { Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: baseDarkTheme.colors.background
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12
  },
  card: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 12,
    backgroundColor: baseDarkTheme.colors.surface,
    borderWidth: 1,
    borderColor: baseDarkTheme.colors.warning
  },
  title: {
    color: baseDarkTheme.typography.colors.primary,
    fontSize: baseDarkTheme.typography.levels["title-md"].fontSize,
    fontWeight: "700",
    textAlign: "center"
  },
  body: {
    color: baseDarkTheme.typography.colors.secondary,
    fontSize: baseDarkTheme.typography.levels["body-md"].fontSize,
    lineHeight: 22,
    textAlign: "center"
  },
  hint: {
    color: baseDarkTheme.typography.colors.muted,
    fontSize: baseDarkTheme.typography.levels["body-sm"].fontSize,
    lineHeight: 20,
    textAlign: "center"
  }
});

export function AppCrashFallback() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.card}>
          <WarningCircleIcon
            size={40}
            weight="fill"
            color={baseDarkTheme.colors.warning}
          />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            Mutualzz ran into an unexpected error. Close the app completely, then
            open it again.
          </Text>
          <Text style={styles.hint}>
            {Platform.OS === "ios"
              ? "Swipe up from the bottom of the screen to open the app switcher, then swipe Mutualzz away."
              : "Open your recent apps and swipe Mutualzz away, or use the back button until the app closes."}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
