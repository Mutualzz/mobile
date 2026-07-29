import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import {
  type AppLocale,
  dayjsLocaleIds,
  LOCALE_STORAGE_KEY,
  resolveLocale,
  resources,
  supportedLocales,
} from "@mutualzz/i18n";
import "@mutualzz/i18n/types";
import { getLocales } from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import "dayjs/locale/de";
import "dayjs/locale/es";
import "dayjs/locale/fr";
import "dayjs/locale/it";
import "dayjs/locale/ja";
import "dayjs/locale/ko";
import "dayjs/locale/nl";
import "dayjs/locale/pl";
import "dayjs/locale/pt-br";
import "dayjs/locale/ru";
import "dayjs/locale/sv";
import "dayjs/locale/tr";
import "dayjs/locale/uk";
import "dayjs/locale/zh-cn";
import "dayjs/locale/zh-tw";
import { calendarStrings } from "@mutualzz/client";

const device = getLocales()[0];
const deviceTag = device?.languageTag ?? device?.languageCode ?? "en";

function syncDayjsLocale(lng: string) {
  const locale = resolveLocale(lng);
  dayjs.locale(dayjsLocaleIds[locale]);
  calendarStrings.sameDay = i18n.t("calendar.sameDay", { ns: "common" });
  calendarStrings.nextDay = i18n.t("calendar.nextDay", { ns: "common" });
  calendarStrings.lastDay = i18n.t("calendar.lastDay", { ns: "common" });
  calendarStrings.lastWeek = i18n.t("calendar.lastWeek", { ns: "common" });
  calendarStrings.sameElse = i18n.t("calendar.sameElse", { ns: "common" });
}

void i18n.use(initReactI18next).init({
  resources,
  lng: resolveLocale(deviceTag),
  fallbackLng: "en",
  returnEmptyString: false,
  defaultNS: "common",
  interpolation: { escapeValue: false },
  supportedLngs: Object.keys(resources),
});

syncDayjsLocale(i18n.language);
i18n.on("languageChanged", syncDayjsLocale);

void AsyncStorage.getItem(LOCALE_STORAGE_KEY).then((stored) => {
  if (!stored || stored === "system") return;
  const locale = resolveLocale(stored);
  if (locale !== i18n.language) {
    void i18n.changeLanguage(locale);
  }
});

/** `null` = follow device language. */
export async function getPreferredLocale(): Promise<AppLocale | null> {
  try {
    const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
    if (!stored || stored === "system") return null;
    return resolveLocale(stored);
  } catch {
    return null;
  }
}

export async function setPreferredLocale(locale: AppLocale | "system") {
  if (locale === "system") {
    await AsyncStorage.removeItem(LOCALE_STORAGE_KEY);
    await i18n.changeLanguage(resolveLocale(deviceTag));
    return;
  }

  if (!supportedLocales.includes(locale)) return;
  await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale);
  await i18n.changeLanguage(locale);
}

export default i18n;
