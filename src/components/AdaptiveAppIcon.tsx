import { useAppStore } from "@hooks/useStores";
import { Theme } from "@stores/objects/Theme";
import { syncAppIcon } from "@utils/appIcon";
import { useTheme } from "@mutualzz/ui-native";
import { reaction } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";

export const AdaptiveAppIcon = observer(() => {
  const app = useAppStore();
  const { theme } = useTheme();

  useEffect(() => {
    const dispose = reaction(
      () => app.themes.currentIcon,
      (iconThemeId) => {
        const primary = iconThemeId
          ? Theme.toEmotion(app.themes.get(iconThemeId)).colors.primary
          : theme.colors.primary;

        void syncAppIcon(primary);
      },
      { fireImmediately: true },
    );

    return dispose;
  }, [theme.id, theme.colors.primary]);

  return null;
});
