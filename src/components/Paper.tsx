import { useAppStore } from "@hooks/useStores";
import { Paper as MPaper, type PaperProps } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { forwardRef } from "react";
import { type View } from "react-native";

const DEFAULT_ELEVATION = { embossed: 4, flat: 0 };

const PaperComponent = forwardRef<View, PaperProps>(
  ({ color, elevation, variant, ...props }, ref) => {
    const app = useAppStore();
    const embossed = app.settings?.preferEmbossed;

    const resolvedElevation =
      variant === "soft"
        ? 0
        : (elevation ??
          (embossed ? DEFAULT_ELEVATION.embossed : DEFAULT_ELEVATION.flat));

    const resolvedVariant =
      variant ??
      (!app.token ? "elevation" : embossed ? "elevation" : "outlined");

    return (
      <MPaper
        color={color}
        {...props}
        variant={resolvedVariant}
        elevation={resolvedElevation}
        ref={ref}
      />
    );
  },
);

export const Paper = observer(PaperComponent);
