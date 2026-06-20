import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { CaretDownIcon, CaretRightIcon } from "phosphor-react-native";
import { type ReactNode, useState } from "react";
import { Pressable } from "react-native";

interface Props {
    name: string;
    items: ReactNode[];
}

export const ListSection = ({ name, items }: Props) => {
    const { theme } = useTheme();
    const [open, setOpen] = useState(true);
    const iconColor = theme.typography.colors.primary;

    if (items.length === 0) return null;

    return (
        <Box style={{ paddingTop: 16, paddingHorizontal: 8 }}>
            <Pressable
                onPress={() => setOpen((prev) => !prev)}
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <Typography level="label-xs" textColor="secondary">
                    {name}
                </Typography>
                {open ? (
                    <CaretDownIcon
                        weight="bold"
                        size={12}
                        color={iconColor}
                    />
                ) : (
                    <CaretRightIcon
                        weight="bold"
                        size={12}
                        color={iconColor}
                    />
                )}
            </Pressable>
            {open && (
                <Box style={{ gap: 4, marginTop: 8 }}>{items}</Box>
            )}
        </Box>
    );
};
