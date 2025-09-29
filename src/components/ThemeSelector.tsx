import { useAppStore } from "@hooks/useStores";
import { ThemeMode } from "@mutualzz/ui-core";
import { Divider, Radio, RadioGroup, useTheme } from "@mutualzz/ui-native";
import { observer } from "mobx-react";
import { useState } from "react";
import { View } from "react-native";

export const ThemeSelector = observer(() => {
    const { theme: themeStore } = useAppStore();

    const { mode, theme, changeTheme, changeMode } = useTheme();

    const [style, setStyle] = useState<"normal" | "gradient">("normal");

    const themes = Array.from(themeStore.themes.values())
        .filter((theme) => theme.type === mode)
        .filter((theme) => theme.mode === style);

    const handleThemeChange = (themeId: string) => {
        const changeTo = themes.find((theme) => theme.id === themeId);
        if (!changeTo) return;

        changeTheme(changeTo);
    };

    return (
        <View
            style={{
                gap: 25,
                flexDirection: "column",
                minWidth: 224,
                padding: 20,
            }}
        >
            <View
                style={{
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column",
                    gap: 10,
                }}
            >
                <Divider>Color Type</Divider>
                <RadioGroup
                    variant="solid"
                    orientation="horizontal"
                    spacing={10}
                    value={mode}
                    onChange={(modeToSet) => changeMode(modeToSet as ThemeMode)}
                    size="sm"
                >
                    <Radio label="Dark" value="dark" />
                    <Radio label="Light" value="light" />
                    <Radio label="System" value="system" />
                </RadioGroup>
            </View>
        </View>
    );
});
