import { Button } from "@components/Button";
import { Screen } from "@components/Screen/Screen";
import {
  SettingsNavButton,
  SettingsNavSection,
} from "@components/UserSettings/SettingsField";
import { SettingsHeader } from "@components/UserSettings/SettingsHeader";
import { useSettingsIconColor } from "@components/UserSettings/settingsTheme";
import {
  type UserSettingsSidebarCategories,
  type UserSettingsSidebarPage,
} from "@contexts/UserSettingsSidebar.context";
import {
  BellIcon,
  ChatTextIcon,
  DevicesIcon,
  LifebuoyIcon,
  LinkSimpleIcon,
  MicrophoneIcon,
  PaletteIcon,
  PaintBrushIcon,
  ShieldIcon,
  SignOutIcon,
  SmileyIcon,
  UserGearIcon,
} from "phosphor-react-native";
import { useAppStore } from "@hooks/useStores";
import { useAppNavigation } from "@hooks/useAppNavigation";
import {
  settingsCategoryTitleKeys,
  settingsPageTitleKeys,
} from "@mutualzz/i18n";
import { Box, ButtonGroup, Divider, Typography } from "@mutualzz/ui-native";
import { type Href } from "expo-router";
import { observer } from "mobx-react-lite";
import { type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import type { IconProps } from "phosphor-react-native";

type SettingsPages = Record<UserSettingsSidebarCategories, Pages[]>;

interface Pages {
  label: UserSettingsSidebarPage;
  Icon: ComponentType<IconProps>;
}

const settingsPages: SettingsPages = {
  "user-settings": [
    { label: "my-account", Icon: UserGearIcon },
    { label: "sessions", Icon: DevicesIcon },
    { label: "profile", Icon: PaintBrushIcon },
    { label: "expressions", Icon: SmileyIcon },
    { label: "connections", Icon: LinkSimpleIcon },
  ],
  "app-settings": [
    { label: "appearance", Icon: PaletteIcon },
    { label: "messages", Icon: ChatTextIcon },
    { label: "notifications", Icon: BellIcon },
    { label: "privacy", Icon: ShieldIcon },
    { label: "voice_and_video", Icon: MicrophoneIcon },
  ],
};

const SettingsIndex = () => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const { navigate } = useAppNavigation();
  const navIconColor = useSettingsIconColor("info");
  const dangerIconColor = useSettingsIconColor("danger");

  if (!app.account) return;

  const categories = Object.entries(settingsPages);

  const pageLabel = (label: UserSettingsSidebarPage) => {
    const key =
      settingsPageTitleKeys[label as keyof typeof settingsPageTitleKeys];
    return key ? t(key) : label;
  };

  return (
    <Screen
      style={{
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "stretch",
        paddingVertical: 16,
        gap: 16,
        borderTopWidth: 0,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
      }}
    >
      <SettingsHeader title={t("title")} />
      {categories.map(([category, pages], index) => (
        <Box key={category}>
          <SettingsNavSection
            title={t(
              settingsCategoryTitleKeys[
                category as keyof typeof settingsCategoryTitleKeys
              ],
            )}
          >
            <ButtonGroup
              orientation="vertical"
              variant="plain"
              spacing={1.25}
              horizontalAlign="left"
              fullWidth
            >
              {pages.map((page) => (
                <Button
                  startDecorator={
                    <page.Icon weight="fill" size={20} color={navIconColor} />
                  }
                  key={`user-settings-sidebar-${page.label}`}
                  padding={4}
                  style={{ minWidth: 0 }}
                  onPress={() => navigate(`/settings/${page.label}` as Href)}
                >
                  {pageLabel(page.label)}
                </Button>
              ))}
            </ButtonGroup>
          </SettingsNavSection>
          {index < categories.length - 1 && (
            <Divider
              style={{
                paddingInline: 16,
                filter: "opacity(0.5)",
              }}
              lineColor="muted"
            />
          )}
        </Box>
      ))}

      <SettingsNavButton
        label={t("helpAndSupport")}
        icon={<LifebuoyIcon weight="fill" size={20} color={navIconColor} />}
        onPress={() => navigate("/settings/support" as Href)}
      />

      {app.account?.isStaff ? (
        <SettingsNavButton
          label={t("staffPanel")}
          icon={<ShieldIcon weight="fill" size={20} color={navIconColor} />}
          onPress={() => navigate("/staff")}
        />
      ) : null}

      <SettingsNavButton
        label={t("logOut")}
        icon={<SignOutIcon weight="fill" size={20} color={dangerIconColor} />}
        onPress={() => app.logout()}
        color="danger"
      />
    </Screen>
  );
};

export default observer(SettingsIndex);
