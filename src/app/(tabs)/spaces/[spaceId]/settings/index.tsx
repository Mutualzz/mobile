import { Button } from "@components/Button";
import { Screen } from "@components/Screen/Screen";
import { Paper } from "@components/Paper";
import { SpaceActionConfirmSheet } from "@components/SpaceSettings/SpaceActionConfirmSheet";
import { SpaceSettingsHeader } from "@components/SpaceSettings/SpaceSettingsHeader";
import { useSettingsIconColor } from "@components/UserSettings/settingsTheme";
import { spaceSettingsPages } from "@components/SpaceSettings/spaceSettingsPages";
import { useModal } from "@hooks/useModal";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import {
  useRequireSpaceSettingsAccess,
  useSpaceSettingsAccess,
} from "@hooks/useSpaceFromRoute";
import { ButtonGroup, Divider, Typography } from "@mutualzz/ui-native";
import type { Href } from "expo-router";
import startCase from "lodash-es/startCase";
import { observer } from "mobx-react-lite";
import { Fragment } from "react";
import { SignOutIcon, TrashIcon } from "phosphor-react-native";

const SpaceSettingsIndex = () => {
  const app = useAppStore();
  const { navigate } = useAppNavigation();
  const { openModal } = useModal();
  const { space, spaceId } = useRequireSpaceSettingsAccess();
  const { categories } = useSpaceSettingsAccess(space);
  const navIconColor = useSettingsIconColor("info");
  const dangerIconColor = useSettingsIconColor("danger");

  if (!app.account || !space || !spaceId) return null;

  const isOwner = space.ownerId === app.account.id;

  return (
    <Screen
      style={{
        flexDirection: "column",
        gap: 16,
        paddingBottom: 16,
      }}
    >
      <SpaceSettingsHeader title="Space Settings" showBack />

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
          Manage roles, invites, expressions, and moderation.
        </Typography>
      </Paper>

      {categories.map(({ category, pages }, index) => (
        <Fragment key={`space-settings-category-${category}`}>
          <Paper
            style={{
              marginHorizontal: 12,
              padding: 12,
              borderRadius: 12,
              minWidth: 0,
            }}
            elevation={app.settings?.preferEmbossed ? 3 : 0}
          >
            <Typography level="body-sm" textColor="muted">
              {startCase(category)}
            </Typography>
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
                  {startCase(page.label)}
                </Button>
              ))}
            </ButtonGroup>
          </Paper>
          {index < categories.length - 1 ? (
            <Divider
              style={{ paddingInline: 16, opacity: 0.5 }}
              lineColor="muted"
            />
          ) : null}
        </Fragment>
      ))}

      <Paper
        style={{
          marginHorizontal: 12,
          borderRadius: 12,
          minWidth: 0,
        }}
        elevation={app.settings?.preferEmbossed ? 3 : 0}
      >
        {isOwner ? (
          <Button
            variant="plain"
            color="danger"
            fullWidth
            padding={12}
            horizontalAlign="left"
            style={{ borderRadius: 12, minWidth: 0 }}
            startDecorator={
              <TrashIcon weight="fill" size={20} color={dangerIconColor} />
            }
            onPress={() =>
              openModal(
                "delete-space-confirm",
                <SpaceActionConfirmSheet
                  space={space}
                  action="delete"
                  modalId="delete-space-confirm"
                />,
              )
            }
          >
            Delete Space
          </Button>
        ) : (
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
            onPress={() =>
              openModal(
                "leave-space-confirm",
                <SpaceActionConfirmSheet
                  space={space}
                  action="leave"
                  modalId="leave-space-confirm"
                />,
              )
            }
          >
            Leave Space
          </Button>
        )}
      </Paper>
    </Screen>
  );
};

export default observer(SpaceSettingsIndex);
