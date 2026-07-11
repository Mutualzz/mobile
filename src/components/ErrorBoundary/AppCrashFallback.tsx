import { baseDarkTheme } from "@mutualzz/ui-core";
import { WarningCircleIcon } from "phosphor-react-native";
import { Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("common");

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.card}>
          <WarningCircleIcon
            size={40}
            weight="fill"
            color={baseDarkTheme.colors.warning}
          />
          <Text style={styles.title}>{t("crash.title")}</Text>
          <Text style={styles.body}>{t("crash.bodyMobile")}</Text>
          <Text style={styles.hint}>
            {Platform.OS === "ios"
              ? t("crash.hintIos")
              : t("crash.hintAndroid")}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
