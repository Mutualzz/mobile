import { Button } from "@components/Button";
import { Screen } from "@components/Screen/Screen";
import { Paper } from "@components/Paper";
import { SettingsHeader } from "@components/UserSettings/SettingsHeader";
import { useSettingsIconColor } from "@components/UserSettings/settingsTheme";
import {
  type UserSettingsSidebarCategories,
  type UserSettingsSidebarPage,
} from "@contexts/UserSettingsSidebar.context";
import {
  BellIcon,
  CubeIcon,
  LifebuoyIcon,
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
import { ButtonGroup, Divider, Typography } from "@mutualzz/ui-native";
import { type Href } from "expo-router";
import { observer } from "mobx-react-lite";
import { Fragment, type ComponentType } from "react";
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
    { label: "profile", Icon: PaintBrushIcon },
    { label: "expressions", Icon: SmileyIcon },
    { label: "minecraft-bridge", Icon: CubeIcon },
  ],
  "app-settings": [
    { label: "appearance", Icon: PaletteIcon },
    { label: "notifications", Icon: BellIcon },
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
        <Fragment key={`settings-sidebar-category-fragment-${category}`}>
          <Paper
            style={{
              marginHorizontal: 12,
              padding: 12,
              borderRadius: 12,
              flexDirection: "column",
              minWidth: 0,
            }}
            elevation={app.settings?.preferEmbossed ? 3 : 0}
          >
            <Typography level="body-sm" textColor="muted">
              {t(
                settingsCategoryTitleKeys[
                  category as keyof typeof settingsCategoryTitleKeys
                ],
              )}
            </Typography>
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
          </Paper>
          {index < categories.length - 1 && (
            <Divider
              style={{
                paddingInline: 16,
                filter: "opacity(0.5)",
              }}
              lineColor="muted"
            />
          )}
        </Fragment>
      ))}

      <Paper
        elevation={app.settings?.preferEmbossed ? 3 : 0}
        style={{
          marginHorizontal: 12,
          borderRadius: 12,
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Button
          variant="plain"
          fullWidth
          padding={12}
          horizontalAlign="left"
          style={{ borderRadius: 12, minWidth: 0 }}
          startDecorator={
            <LifebuoyIcon weight="fill" size={20} color={navIconColor} />
          }
          onPress={() => navigate("/settings/support" as Href)}
        >
          {t("helpAndSupport")}
        </Button>
      </Paper>

      {app.account?.isStaff && (
        <Paper
          elevation={app.settings?.preferEmbossed ? 3 : 0}
          style={{
            marginHorizontal: 12,
            borderRadius: 12,
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          <Button
            variant="plain"
            fullWidth
            padding={12}
            horizontalAlign="left"
            style={{ borderRadius: 12, minWidth: 0 }}
            startDecorator={
              <ShieldIcon weight="fill" size={20} color={navIconColor} />
            }
            onPress={() => navigate("/staff")}
          >
            {t("staffPanel")}
          </Button>
        </Paper>
      )}

      <Paper
        elevation={app.settings?.preferEmbossed ? 3 : 0}
        style={{
          marginHorizontal: 12,
          borderRadius: 12,
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Button
          variant="plain"
          color="danger"
          fullWidth
          padding={12}
          horizontalAlign="left"
          style={{ borderRadius: 12, minWidth: 0 }}
          startDecorator={
            <SignOutIcon weight="fill" size={20} color={dangerIconColor} />
          }
          onPress={() => app.logout()}
        >
          {t("logOut")}
        </Button>
      </Paper>
    </Screen>
  );
};

export default observer(SettingsIndex);
