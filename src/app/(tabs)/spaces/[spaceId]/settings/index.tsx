import { Button } from "@components/Button";
import { Screen } from "@components/Screen/Screen";
import { Paper } from "@components/Paper";
import { SpaceActionConfirmSheet } from "@components/SpaceSettings/SpaceActionConfirmSheet";
import { SpaceSettingsHeader } from "@components/SpaceSettings/SpaceSettingsHeader";
import {
  SettingsNavButton,
  SettingsNavSection,
} from "@components/UserSettings/SettingsField";
import { useSettingsIconColor } from "@components/UserSettings/settingsTheme";
import { useSheet } from "@hooks/useSheet";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import {
  useRequireSpaceSettingsAccess,
  useSpaceSettingsAccess,
} from "@hooks/useSpaceFromRoute";
import type { SpaceSettingsPage } from "@components/SpaceSettings/spaceSettingsPages";
import {
  spaceCategoryTitleKeys,
  spacePageTitleKeys,
} from "@mutualzz/i18n";
import { Box, ButtonGroup, Divider, Typography } from "@mutualzz/ui-native";
import type { Href } from "expo-router";
import { observer } from "mobx-react-lite";
import { Fragment } from "react";
import { SignOutIcon, TrashIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";

const SpaceSettingsIndex = () => {
  const { t } = useTranslation("space");
  const app = useAppStore();
  const { navigate } = useAppNavigation();
  const { openSheet } = useSheet();
  const { space, spaceId } = useRequireSpaceSettingsAccess();
  const { categories } = useSpaceSettingsAccess(space);
  const navIconColor = useSettingsIconColor("info");
  const dangerIconColor = useSettingsIconColor("danger");

  if (!app.account || !space || !spaceId) return null;

  const isOwner = space.ownerId === app.account.id;

  const pageLabel = (label: SpaceSettingsPage) => {
    const key = spacePageTitleKeys[label];
    return t(key);
  };

  return (
    <Screen
      style={{
        flexDirection: "column",
        gap: 16,
        paddingBottom: 16,
      }}
    >
      <SpaceSettingsHeader title={t("title")} showBack />

      <Paper
        style={{
          marginHorizontal: 12,
          padding: 12,
          borderRadius: 12,
          gap: 4,
        }}
        elevation={app.settings?.preferEmbossed ? 3 : 0}
      >
        <Typography level="body-lg" weight={700}>
          {space.name}
        </Typography>
        <Typography level="body-sm" textColor="muted">
          {t("overviewDescription")}
        </Typography>
      </Paper>

      {categories.map(({ category, pages }, index) => (
        <Fragment key={`space-settings-category-${category}`}>
          <SettingsNavSection title={t(spaceCategoryTitleKeys[category])}>
            <ButtonGroup
              color="info"
              orientation="vertical"
              variant="plain"
              spacing={1.25}
              horizontalAlign="left"
              fullWidth
            >
              {pages.map((page) => (
                <Button
                  key={page.label}
                  padding={5}
                  style={{ minWidth: 0 }}
                  startDecorator={
                    <page.Icon weight="fill" size={20} color={navIconColor} />
                  }
                  onPress={() =>
                    navigate(
                      `/(tabs)/spaces/${spaceId}/settings/${page.label}` as Href,
                    )
                  }
                >
                  {pageLabel(page.label)}
                </Button>
              ))}
            </ButtonGroup>
          </SettingsNavSection>
          {index < categories.length - 1 && (
            <Divider
              style={{ paddingInline: 16, opacity: 0.5 }}
              lineColor="muted"
            />
          )}
        </Fragment>
      ))}

      {isOwner ? (
        <SettingsNavButton
          label={t("actions.deleteSpace")}
          icon={<TrashIcon weight="fill" size={20} color={dangerIconColor} />}
          color="danger"
          onPress={() =>
            openSheet(
              "delete-space-confirm",
              <SpaceActionConfirmSheet
                space={space}
                action="delete"
                sheetId="delete-space-confirm"
              />,
            )
          }
        />
      ) : (
        <SettingsNavButton
          label={t("actions.leaveSpace")}
          icon={<SignOutIcon weight="fill" size={20} color={dangerIconColor} />}
          color="danger"
          onPress={() =>
            openSheet(
              "leave-space-confirm",
              <SpaceActionConfirmSheet
                space={space}
                action="leave"
                sheetId="leave-space-confirm"
              />,
            )
          }
        />
      )}
    </Screen>
  );
};

export default observer(SpaceSettingsIndex);
