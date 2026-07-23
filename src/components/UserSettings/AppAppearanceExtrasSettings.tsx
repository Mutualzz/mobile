import {
  SettingsActionRow,
  SettingsSection,
  SettingsSelectRow,
  SettingsToggleRow,
} from "@components/UserSettings/SettingsField";
import { useSettingsOptionSheet } from "@hooks/useSettingsOptionSheet";
import { useAppStore } from "@hooks/useStores";
import { uiDensityLabelKey } from "@mutualzz/client";
import {
  UI_DENSITY_OPTIONS,
  type UiDensity,
} from "@mutualzz/types";
import { applyUiDensity } from "@mutualzz/ui-core";
import { Divider } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

export const AppAppearanceExtrasSettings = observer(() => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const settings = app.settings;
  const openPicker = useSettingsOptionSheet();

  if (!settings) return null;

  const extended = settings.extendedSettings;

  const patch = (next: Partial<typeof extended>) => {
    settings.patchExtendedSettings(next);
    void settings.sync();
  };

  const uiDensityLabel = (value: UiDensity) => t(uiDensityLabelKey(value));

  const densityOptions = UI_DENSITY_OPTIONS.map((value) => ({
    value,
    label: uiDensityLabel(value),
  }));

  return (
    <>
      <SettingsSection title={t("appearance.uiDensityTitle")}>
        <SettingsSelectRow
          title={t("appearance.uiDensity")}
          description={t("appearance.uiDensityDescription")}
          value={uiDensityLabel(extended.uiDensity)}
          onPress={() =>
            openPicker(
              "appearance-ui-density",
              t("appearance.uiDensity"),
              densityOptions,
              extended.uiDensity,
              (value) => {
                const uiDensity = value as UiDensity;
                applyUiDensity(uiDensity);
                patch({ uiDensity });
              },
            )
          }
        />
      </SettingsSection>

      <SettingsSection title={t("layout.title")}>
        <SettingsToggleRow
          title={t("layout.defaultMemberListVisible")}
          description={t("layout.defaultMemberListVisibleDescription")}
          checked={extended.defaultMemberListVisible}
          onChange={(checked) => {
            patch({ defaultMemberListVisible: checked });
            app.setMemberListVisible(checked);
          }}
        />

        <Divider />

        <SettingsActionRow
          title={t("layout.resetCollapsedCategories")}
          description={t("layout.resetCollapsedCategoriesDescription")}
          actionLabel={t("layout.resetCollapsedCategoriesAction")}
          onPress={() => app.channels.resetCollapsedCategories()}
        />

        <Divider />

        <SettingsActionRow
          title={t("layout.resetSpaceOrder")}
          description={t("layout.resetSpaceOrderDescription")}
          actionLabel={t("layout.resetSpaceOrderAction")}
          onPress={() => settings.resetSpaceOrder()}
        />
      </SettingsSection>

      <SettingsSection title={t("accessibility.title")}>
        <SettingsToggleRow
          title={t("accessibility.reducedMotion")}
          description={t("accessibility.reducedMotionDescription")}
          checked={extended.reducedMotion}
          onChange={(checked) => patch({ reducedMotion: checked })}
        />

        <Divider />

        <SettingsToggleRow
          title={t("accessibility.highContrast")}
          description={t("accessibility.highContrastDescription")}
          checked={extended.highContrast}
          onChange={(checked) => patch({ highContrast: checked })}
        />

        <Divider />

        <SettingsToggleRow
          title={t("privacy.dontShowLinkWarning")}
          description={t("privacy.dontShowLinkWarningDescription")}
          checked={app.dontShowLinkWarning}
          onChange={(checked) => app.setDontShowLinkWarning(checked)}
        />
      </SettingsSection>
    </>
  );
});
