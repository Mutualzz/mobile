import { useAppStore } from "@hooks/useStores";
import { Paper as MPaper, type PaperProps } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { forwardRef } from "react";
import { View } from "react-native";

const PaperComponent = forwardRef<View, PaperProps>(
    ({ color, ...props }, ref) => {
        const app = useAppStore();

        return (
            <MPaper
                variant={app.preferEmbossed ? "elevation" : "outlined"}
                elevation={props.variant === "soft" ? 0 : props.elevation}
                transparency={app.preferEmbossed ? 90 : props.transparency}
                color={color}
                {...props}
                ref={ref}
            />
        );
    },
);

export const Paper = observer(PaperComponent);
