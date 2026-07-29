import { IconButton as MzIconButton, type IconButtonProps, useTheme } from "@mutualzz/ui-native";
import { forwardRef } from "react";
import { type View } from "react-native";

export const IconButton = forwardRef<View, IconButtonProps>(
    ({ color, variant, ...props }, ref) => {
        const { theme } = useTheme();

        return (
            <MzIconButton
                ref={ref}
                color={color ?? theme.typography.colors.primary}
                variant={variant ?? "plain"}
                {...props}
            />
        );
    },
);

IconButton.displayName = "IconButton";
