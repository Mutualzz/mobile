import { ScreenHeader } from "@components/Screen/Screen";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { Typography, useTheme } from "@mutualzz/ui-native";
import { ArrowLeftIcon, XIcon } from "phosphor-react-native";
import type { Href } from "expo-router";
import { observer } from "mobx-react-lite";
import { Pressable } from "react-native";

interface Props {
    title: string;
    showBack?: boolean;
    backHref?: Href;
    backLabel?: string;
    onClose?: () => void;
}

export const StaffHeader = observer(
    ({
        title,
        showBack = false,
        backHref,
        backLabel = "Staff Panel",
        onClose,
    }: Props) => {
        const { back, navigate } = useAppNavigation();
        const { theme } = useTheme();

        const iconColor = theme.typography.colors.primary;

        const handleBack = () => {
            if (backHref) {
                navigate(backHref);
                return;
            }

            back();
        };

        const handleClose = () => {
            if (onClose) {
                onClose();
                return;
            }

            back();
        };

        return (
            <ScreenHeader
                safeTop={false}
                safeHorizontal={false}
                style={{
                    paddingHorizontal: 12,
                    gap: 10,
                    borderTopWidth: 0,
                    borderBottomWidth: 0,
                    borderLeftWidth: 0,
                    borderRightWidth: 0,
                }}
            >
                {showBack ? (
                    <Pressable
                        hitSlop={8}
                        onPress={handleBack}
                        style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                    >
                        <ArrowLeftIcon
                            size={22}
                            weight="bold"
                            color={iconColor}
                        />
                        <Typography level="body-sm" weight="bold">
                            {backLabel}
                        </Typography>
                    </Pressable>
                ) : null}
                <Typography
                    level="body-lg"
                    weight="bold"
                    truncate="single"
                    style={{ flex: 1 }}
                >
                    {title}
                </Typography>
                {!showBack ? (
                    <Pressable hitSlop={8} onPress={handleClose}>
                        <XIcon size={22} weight="bold" color={iconColor} />
                    </Pressable>
                ) : null}
            </ScreenHeader>
        );
    },
);
