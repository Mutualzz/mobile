import { Button, ButtonProps } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { forwardRef } from "react";

const TabButtonComponent = forwardRef<any, ButtonProps>(
    ({ children, style, ...props }, ref) => {
        return (
            <Button
                color="neutral"
                padding={0}
                size="sm"
                variant="plain"
                ref={ref}
                {...props}
                fullWidth
                orientation="vertical"
            >
                {children}
            </Button>
        );
    },
);

export default observer(TabButtonComponent);
