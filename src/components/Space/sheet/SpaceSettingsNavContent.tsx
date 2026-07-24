import { Button } from "@components/Button";
import { SpaceActionConfirmSheet } from "@components/SpaceSettings/SpaceActionConfirmSheet";
import {
  SpaceSheetMenuDivider,
  SpaceSheetMenuGroup,
  SpaceSheetNavRow,
} from "@components/Space/sheet/components";
import { useSettingsIconColor } from "@components/UserSettings/settingsTheme";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import { spacePageTitleKeys } from "@mutualzz/i18n";
import {
  getVisibleSpaceSettingsPages,
  spaceSettingsPages,
  type SpaceSettingsPage,
  type SpaceSettingsPageDef,
} from "@components/SpaceSettings/spaceSettingsPages";
import { Box, Typography } from "@mutualzz/ui-native";
import type { Space } from "@stores/objects/Space";
import type { Href } from "expo-router";
import { SignOutIcon, TrashIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { Fragment, useMemo } from "react";
import { useTranslation } from "react-i18next";

const SETTINGS_SECTION_PAGES: SpaceSettingsPage[] = [
  "profile",
  "theme",
  "channels",
  "expressions",
  "minecraft-bridge",
];

const USER_MANAGEMENT_SECTION_PAGES: SpaceSettingsPage[] = [
  "roles",
  "invites",
  "bans",
];

const SHEET_SECTIONS = [
  { titleKey: "sheet.settingsSection", pages: SETTINGS_SECTION_PAGES },
  {
    titleKey: "sheet.userManagementSection",
    pages: USER_MANAGEMENT_SECTION_PAGES,
  },
] as const;

function pageDef(page: SpaceSettingsPage): SpaceSettingsPageDef | undefined {
  for (const pages of Object.values(spaceSettingsPages)) {
    const match = pages.find((entry) => entry.label === page);
    if (match) return match;
  }
  return undefined;
}

interface Props {
  space: Space;
  onNavigate: (page: SpaceSettingsPage) => void;
  onDangerAction?: () => void;
}

export const SpaceSettingsNavContent = observer(
  ({ space, onNavigate, onDangerAction }: Props) => {
    const { t } = useTranslation("space");
    const { t: tChat } = useTranslation("chat");
    const app = useAppStore();
    const { openSheet } = useSheet();
    const dangerIconColor = useSettingsIconColor("danger");
    const me = space.members.me;
    const isOwner = space.ownerId === app.account?.id;

    const visiblePages = useMemo(() => {
      if (!me) return new Set<SpaceSettingsPage>();
      return new Set(
        getVisibleSpaceSettingsPages(me).flatMap(({ pages }) =>
          pages.map((page) => page.label),
        ),
      );
    }, [me]);

    const pageLabel = (label: SpaceSettingsPage) => {
      const key = spacePageTitleKeys[label];
      return t(key);
    };

    const openConfirm = (action: "delete" | "leave") => {
      const sheetId = `${action}-space-confirm-${space.id}`;
      onDangerAction?.();
      openSheet(
        sheetId,
        <SpaceActionConfirmSheet
          space={space}
          action={action}
          sheetId={sheetId}
        />,
      );
    };

    return (
      <Box style={{ gap: 16 }}>
        {SHEET_SECTIONS.map(({ titleKey, pages }) => {
          const sectionPages = pages
            .map((label) => pageDef(label))
            .filter(
              (entry): entry is SpaceSettingsPageDef =>
                !!entry && visiblePages.has(entry.label),
            );

          if (sectionPages.length === 0) return null;

          return (
            <Box key={titleKey} style={{ gap: 8 }}>
              <Typography
                level="body-xs"
                textColor="muted"
                style={{ paddingHorizontal: 4, textTransform: "uppercase" }}
              >
                {t(titleKey)}
              </Typography>
              <SpaceSheetMenuGroup>
                {sectionPages.map((page, index) => (
                  <Fragment key={page.label}>
                    {index > 0 ? <SpaceSheetMenuDivider /> : null}
                    <SpaceSheetNavRow
                      label={pageLabel(page.label)}
                      Icon={page.Icon}
                      onPress={() => onNavigate(page.label)}
                    />
                  </Fragment>
                ))}
              </SpaceSheetMenuGroup>
            </Box>
          );
        })}

        <SpaceSheetMenuGroup>
          {isOwner ? (
            <Button
              variant="plain"
              color="danger"
              fullWidth
              padding={14}
              horizontalAlign="left"
              startDecorator={
                <TrashIcon weight="fill" size={20} color={dangerIconColor} />
              }
              onPress={() => openConfirm("delete")}
            >
              {t("actions.deleteSpace")}
            </Button>
          ) : (
            <Button
              variant="plain"
              color="danger"
              fullWidth
              padding={14}
              horizontalAlign="left"
              startDecorator={
                <SignOutIcon weight="fill" size={20} color={dangerIconColor} />
              }
              onPress={() => openConfirm("leave")}
            >
              {tChat("contextMenu.leaveSpace")}
            </Button>
          )}
        </SpaceSheetMenuGroup>
      </Box>
    );
  },
);

export function spaceSettingsHref(
  spaceId: string,
  page: SpaceSettingsPage,
): Href {
  return `/(tabs)/spaces/${spaceId}/settings/${page}` as Href;
}
