import { useAppStore } from "@hooks/useStores";
import { ThemeStyle, ThemeType } from "@mutualzz/ui-core";

import {
    Divider,
    Option,
    Radio,
    RadioGroup,
    Select,
    useTheme,
} from "@mutualzz/ui-native";
import { sortThemes } from "@utils/index";
import { observer } from "mobx-react";
import { View } from "react-native";

export const ThemeSelector = observer(() => {
    const { theme: themeStore } = useAppStore();

    const { type, theme, style, changeTheme, changeType, changeStyle } =
        useTheme();

    const themes = Array.from(themeStore.themes.values())
        .filter((theme) => theme.type === type)
        .filter((theme) => theme.style === style);

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
                    value={type}
                    onChange={(typeToSet) => changeType(typeToSet as ThemeType)}
                    size="sm"
                >
                    <Radio label="Dark" value="dark" />
                    <Radio label="Light" value="light" />
                    <Radio label="System" value="system" />
                </RadioGroup>
            </View>
            {type !== "system" && (
                <View
                    style={{
                        gap: 10,
                        justifyContent: "center",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <Divider>Color Style</Divider>
                    <RadioGroup
                        variant="solid"
                        onChange={(styleToSet) => {
                            changeStyle(styleToSet as ThemeStyle);
                        }}
                        orientation="horizontal"
                        spacing={10}
                        value={style}
                    >
                        <Radio label="Normal" value="normal" />
                        <Radio label="Gradient" value="gradient" />
                    </RadioGroup>
                </View>
            )}
            {themes.length > 1 && type !== "system" && (
                <View
                    style={{
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 10,
                        flexDirection: "column",
                    }}
                >
                    <Divider>Color Scheme</Divider>
                    <Select
                        variant="solid"
                        onValueChange={(value) =>
                            handleThemeChange(value.toString())
                        }
                        value={theme.id}
                    >
                        {sortThemes(themes).map((theme) => (
                            <Option key={theme.id} value={theme.id}>
                                {theme.name}
                                {theme.createdBy ? ` (by You)` : ""}
                            </Option>
                        ))}
                    </Select>
                </View>
            )}
        </View>
    );
});
